// Regrades the hero cut-outs and the portrait into the graphite set; the laptop and phone screens keep
// their colour. Run once by hand from the repo root:
//   node scripts/bake-graphite.mjs
// The output is committed and CI never runs this. The originals stay where they are, so one constant
// (HERO_ART in components/HeroStage.tsx) reverts the art.
//
// The repo has no source larger than the 1x cut-outs. "@2x" is therefore one Lanczos3 upscale plus a
// light unsharp, done in the same pass as the grade. It adds no detail: it controls resampling under
// GPU zoom and avoids grading twice.
import { mkdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const img = (path) => fileURLToPath(new URL(`../public/img/${path}`, import.meta.url));
const OUT = "hero/graphite/";
mkdirSync(img(OUT), { recursive: true });

/** Screen corners, clockwise from top left, in source pixels of laptop.webp. The same numbers as
 *  LAPTOP_SCREEN in lib/motion/camera.ts: the hole and the camera have to agree. */
const LAPTOP_SCREEN = [
  [294.6, 124.9],
  [840.9, 31],
  [764.2, 443.7],
  [208.3, 457.9],
];
const LAPTOP_WIDTH = 868;
/** The same numbers as PHONE_SCREEN in lib/motion/camera.ts. */
const PHONE_SCREEN = [
  [26.7, 13.8],
  [180.8, 34.1],
  [257.7, 431.3],
  [102, 439.9],
];

/** The two screens keep their real colour; the device around them, the ribbon and the chips are graphite.
 *  Each mask is the screen's own shape in its flat coordinates, read off the unwarped originals: the laptop's
 *  corners are square, the phone's are rounded like the Ceru screens scene A lays over it (32 of 430).
 *  `grow` reaches a hair into the black bezel and `feather` fades there, where both grades are black, so the
 *  join cannot show; the phone's rounding keeps its bronze frame out of the mask. Units are flat-screen units. */
const SCREENS = {
  laptop: { quad: LAPTOP_SCREEN, width: 1600, height: 1000, radius: 0, grow: 4, feather: 5 },
  phone: { quad: PHONE_SCREEN, width: 430, height: 932, radius: 34, grow: 3, feather: 4 },
};

/** Where the ribbon and the laptop sit on the stage, as fractions of its width (globals.css; the stage is 100 / 64). */
const STAGE_HEIGHT = 0.64;
const RIBBON_BOX = { left: 0.02, top: 0.047 * STAGE_HEIGHT, width: 0.96 };
const LAPTOP_BOX = { left: 0.2352, top: 0.0684 * STAGE_HEIGHT, width: 0.5969 };

/** Source px outward from the screen's edge: the ribbon stops under the bezel, so the opened screen never shows its ends. */
const RIBBON_CUT = 7;
/** Source px over which the punched hole fades in, so its edge antialiases against whatever is behind it. */
const HOLE_FEATHER = 1.2;
/** The portrait on the laptop: object-fit cover in a 16:10 screen, object-position 17%, slightly below full chroma. */
const SCREEN_ASPECT = 1.6;
const PORTRAIT_POSITION = 0.17;
const PORTRAIT_SATURATION = 0.88;

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
const smooth = (a, b, x) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/** Graphite has no colour, it only reflects: luminance through a curve, a trace of the original hue, a slightly cool cast. */
const metal = (pow, gain, lift, chroma) => (r, g, b) => {
  const y = luma(r, g, b) / 255;
  const v = (Math.pow(y, pow) * gain + lift) * 255;
  const k = v / Math.max(1, y * 255);
  return [v * 0.985 + (r * k - v) * chroma, v + (g * k - v) * chroma, v * 1.045 + (b * k - v) * chroma];
};

const RIBBON = metal(3.2, 0.98, 0.035, 0.08);
const CHIP = metal(3.0, 0.98, 0.03, 0.06);
const PENCIL = metal(1.95, 0.8, 0, 0.06);

const inside = (q, x, y) => {
  let c = false;
  for (let i = 0, j = q.length - 1; i < q.length; j = i++) {
    const [xi, yi] = q[i];
    const [xj, yj] = q[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

/** Distance from a point to the nearest edge of a quad. */
const edgeDistance = (q, x, y) => {
  let nearest = Infinity;
  for (let i = 0; i < 4; i += 1) {
    const [ax, ay] = q[i];
    const [bx, by] = q[(i + 1) % 4];
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    nearest = Math.min(nearest, Math.hypot(x - ax - vx * t, y - ay - vy * t));
  }
  return nearest;
};

const centroid = (q) => [q.reduce((s, p) => s + p[0], 0) / q.length, q.reduce((s, p) => s + p[1], 0) / q.length];

/** Coefficients [a..h] of the projective map that lands each `from` corner on the `to` corner:
 *  u = (a x + b y + c) / (g x + h y + 1), v = (d x + e y + f) / (g x + h y + 1). */
function projective(from, to) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i += 1) {
    const [x, y] = from[i];
    const [u, v] = to[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }
  for (let c = 0; c < 8; c += 1) {
    let pivot = c;
    for (let r = c + 1; r < 8; r += 1) if (Math.abs(A[r][c]) > Math.abs(A[pivot][c])) pivot = r;
    [A[c], A[pivot]] = [A[pivot], A[c]];
    [b[c], b[pivot]] = [b[pivot], b[c]];
    for (let r = 0; r < 8; r += 1) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 8; k += 1) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  return b.map((value, i) => value / A[i][i]);
}

async function grade(name, scale, fn, extra) {
  const file = img(`hero/${name}.webp`);
  const { width } = await sharp(file).metadata();
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .resize({ width: width * scale, kernel: "lanczos3" })
    .sharpen(scale > 1 ? { sigma: 0.7, m1: 0.5, m2: 1.4 } : undefined)
    .raw()
    .toBuffer({ resolveWithObject: true });
  // The resized original, before the grade: colourScreen takes the screens back from it.
  const source = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = fn(data[i], data[i + 1], data[i + 2]);
    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
  extra?.(data, info);
  return { data, info, source };
}

/** Signed distance to a rounded rectangle at the origin, negative inside. */
const roundedRect = (u, v, width, height, radius) => {
  const qx = Math.abs(u - width / 2) - (width / 2 - radius);
  const qy = Math.abs(v - height / 2) - (height / 2 - radius);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius;
};

/** Puts the original pixels back inside the screen, so it stays in colour on a graphite device. */
function colourScreen({ data, info, source }, screen, scale) {
  const { quad, width: W, height: H, radius, grow, feather } = screen;
  const scaled = quad.map(([x, y]) => [x * scale, y * scale]);
  const [a, b, c, d, e, f, g, h] = projective(scaled, [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ]);
  const out = Buffer.from(data);
  const xs = scaled.map((p) => p[0]);
  const ys = scaled.map((p) => p[1]);
  const pad = 8 * scale;
  for (let y = Math.max(0, Math.floor(Math.min(...ys) - pad)); y < Math.min(info.height, Math.ceil(Math.max(...ys) + pad)); y += 1) {
    for (let x = Math.max(0, Math.floor(Math.min(...xs) - pad)); x < Math.min(info.width, Math.ceil(Math.max(...xs) + pad)); x += 1) {
      const w = g * (x + 0.5) + h * (y + 0.5) + 1;
      const u = (a * (x + 0.5) + b * (y + 0.5) + c) / w;
      const v = (d * (x + 0.5) + e * (y + 0.5) + f) / w;
      const k = Math.max(0, Math.min(1, (grow - roundedRect(u, v, W, H, radius)) / feather));
      if (k === 0) continue;
      const i = (y * info.width + x) * 4;
      for (let band = 0; band < 3; band += 1) out[i + band] = clamp(data[i + band] + (source[i + band] - data[i + band]) * k);
    }
  }
  return { data: out, info };
}

const sizes = {};
async function save({ data, info }, name) {
  const path = img(`${OUT}${name}.webp`);
  await sharp(data, { raw: info }).webp({ quality: 86, alphaQuality: 92, effort: 6 }).toFile(path);
  sizes[name] = statSync(path).size;
}

/** Cuts the part of the ribbon that would show through the opened laptop. Its edge sits under the bezel. */
function cutRibbon(data, info) {
  const k = LAPTOP_BOX.width / LAPTOP_WIDTH;
  const [cx, cy] = centroid(LAPTOP_SCREEN);
  const hole = LAPTOP_SCREEN.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy);
    return [LAPTOP_BOX.left + (x + ((x - cx) / d) * RIBBON_CUT) * k, LAPTOP_BOX.top + (y + ((y - cy) / d) * RIBBON_CUT) * k];
  });
  const kR = RIBBON_BOX.width / info.width;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (inside(hole, RIBBON_BOX.left + x * kR, RIBBON_BOX.top + y * kR)) data[(y * info.width + x) * 4 + 3] = 0;
    }
  }
}

/** One stop down on the wall behind him; skin, hair and shirt stay where they are. The mask is soft, so nothing halos. */
async function gradePortrait() {
  const { data, info } = await sharp(img("anton-iosifov.webp")).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  // Highlights that have no chroma but still belong to him: the smile, the two eyes and the watch.
  const keep = [
    [430, 455, 66, 28],
    [388, 353, 34, 16],
    [490, 360, 34, 16],
    [281, 977, 44, 52],
  ];
  const mask = Buffer.alloc(W * H);
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 3;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      let p = Math.max(smooth(0.06, 0.16, (Math.max(r, g, b) - Math.min(r, g, b)) / 255), 1 - smooth(0.2, 0.34, luma(r, g, b) / 255));
      for (const [cx, cy, rx, ry] of keep) p = Math.max(p, 1 - smooth(0.7, 1.15, ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2));
      mask[y * W + x] = clamp(p * 255);
    }
  }
  // toColourspace: without it sharp returns three bands, and indexing them as one tears the mask into scanlines.
  const blurred = await sharp(mask, { raw: { width: W, height: H, channels: 1 } }).blur(5).toColourspace("b-w").raw().toBuffer();
  for (let y = 0; y < H; y += 1) {
    for (let x = 0; x < W; x += 1) {
      const i = (y * W + x) * 3;
      // The blur only softens the inside of his outline: taken as it is, it paints a glow on the wall around him.
      const p = Math.max(smooth(0.55, 0.95, blurred[y * W + x] / 255), (mask[y * W + x] * 0.9) / 255);
      const f = 1 - (1 - 0.52) * (1 - p);
      const t = (1 - p) * 0.75;
      const Y = luma(data[i], data[i + 1], data[i + 2]);
      data[i] = clamp((data[i] + (Y - data[i]) * t) * f);
      data[i + 1] = clamp((data[i + 1] + (Y - data[i + 1]) * t) * f);
      data[i + 2] = clamp((data[i + 2] + (Y - data[i + 2]) * t) * f * (1 + 0.02 * t));
    }
  }
  return { data, info };
}

/** The portrait, through an inverse projective map, into the screen quad of a transparent laptop-sized canvas.
 *  Bilinear: the source is 900 px across and the quad is about 1108, so nothing is ever minified. */
function warpIntoScreen({ data: src, info: s }, quad, width, height) {
  const visible = s.width / SCREEN_ASPECT;
  const top = PORTRAIT_POSITION * (s.height - visible);
  const toSource = projective(quad, [
    [0, top],
    [s.width, top],
    [s.width, top + visible],
    [0, top + visible],
  ]);
  const [a, b, c, d, e, f, g, h] = toSource;
  const out = Buffer.alloc(width * height * 4);
  // A hair past the fitted edge, so the shell's feather always has picture under it.
  const [cx, cy] = centroid(quad);
  const bleed = quad.map(([x, y]) => {
    const r = Math.hypot(x - cx, y - cy);
    return [x + ((x - cx) / r) * 3, y + ((y - cy) / r) * 3];
  });
  const xs = bleed.map((p) => p[0]);
  const ys = bleed.map((p) => p[1]);
  const at = (x, y, band) => src[(y * s.width + x) * s.channels + band];
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y < Math.min(height, Math.ceil(Math.max(...ys))); y += 1) {
    for (let x = Math.max(0, Math.floor(Math.min(...xs))); x < Math.min(width, Math.ceil(Math.max(...xs))); x += 1) {
      if (!inside(bleed, x + 0.5, y + 0.5)) continue;
      const w = g * (x + 0.5) + h * (y + 0.5) + 1;
      const u = Math.max(0, Math.min(s.width - 1, (a * (x + 0.5) + b * (y + 0.5) + c) / w - 0.5));
      const v = Math.max(0, Math.min(s.height - 1, (d * (x + 0.5) + e * (y + 0.5) + f) / w - 0.5));
      const x0 = Math.floor(u);
      const y0 = Math.floor(v);
      const x1 = Math.min(s.width - 1, x0 + 1);
      const y1 = Math.min(s.height - 1, y0 + 1);
      const fx = u - x0;
      const fy = v - y0;
      const rgb = [0, 1, 2].map((band) => {
        const upper = at(x0, y0, band) * (1 - fx) + at(x1, y0, band) * fx;
        const lower = at(x0, y1, band) * (1 - fx) + at(x1, y1, band) * fx;
        return upper * (1 - fy) + lower * fy;
      });
      const Y = luma(...rgb);
      const i = (y * width + x) * 4;
      out[i] = clamp(Y + (rgb[0] - Y) * PORTRAIT_SATURATION);
      out[i + 1] = clamp(Y + (rgb[1] - Y) * PORTRAIT_SATURATION);
      out[i + 2] = clamp(Y + (rgb[2] - Y) * PORTRAIT_SATURATION);
      out[i + 3] = 255;
    }
  }
  return out;
}

/** Source-over of `top` on `bottom`, both straight-alpha RGBA of the same size. */
function over(top, bottom) {
  const out = Buffer.alloc(top.length);
  for (let i = 0; i < top.length; i += 4) {
    const sa = top[i + 3] / 255;
    const da = bottom[i + 3] / 255;
    const a = sa + da * (1 - sa);
    if (a === 0) continue;
    for (let band = 0; band < 3; band += 1) out[i + band] = clamp((top[i + band] * sa + bottom[i + band] * da * (1 - sa)) / a);
    out[i + 3] = clamp(a * 255);
  }
  return out;
}

/** Soft copies of the graded chips, for the scenes' peel: a chip that flies past the camera crossfades to these by
 *  opacity (lib/motion/blur.ts) instead of animating a CSS blur, which a frame would have to redo. For each full
 *  level there is a mid level at a third of it, so a growing blur goes sharp, mid, full and never shows a crisp
 *  chip inside a halo. Levels are Gaussian sigma in source px of the 1x cut-out; lib/motion/blur.ts picks the full
 *  level nearest to the blur the scene asks for at the chip's drawn width. The canvas grows by PAD sigmas on every
 *  side so the blur is never cut, and the copy is stored at the size where its sigma is STORED_SIGMA px (never
 *  above 1x): a blur has no detail finer than that, so the GPU's upscale loses nothing. Keep the levels, PAD and the
 *  file names in step with lib/motion/blur.ts. */
const BLUR_LEVELS = [14, 22, 34];
const blurMid = (sigma) => Math.round(sigma / 3);
const BLUR_PAD = 3;
const STORED_SIGMA = 4;

async function blurChips() {
  for (const chip of ["chip-code", "chip-cloud", "chip-spark"]) {
    // From the committed graphite master, so the copy is exactly the art on the page, only soft.
    const master = img(`${OUT}${chip}@2x.webp`);
    const { width: W2, height: H2 } = await sharp(master).metadata();
    for (const sigma of BLUR_LEVELS.flatMap((level) => [level, blurMid(level)])) {
      const pad = Math.round(BLUR_PAD * sigma);
      const scale = Math.min(1, STORED_SIGMA / sigma);
      // Padded in 2x px, blurred at 2x, then stored small: three passes, because sharp runs one pipeline in its
      // own order (resize before blur). sharp premultiplies alpha for blur and resize, so the transparent margin
      // never bleeds a dark fringe into the soft edge.
      const padded = await sharp(master)
        .ensureAlpha()
        .extend({ top: pad * 2, bottom: pad * 2, left: pad * 2, right: pad * 2, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
      const blurred = await sharp(padded).blur(sigma * 2).png().toBuffer();
      const width = Math.round((W2 / 2 + 2 * pad) * scale);
      const height = Math.round((H2 / 2 + 2 * pad) * scale);
      const name = `${chip}-blur${sigma}`;
      const path = img(`${OUT}${name}.webp`);
      await sharp(blurred)
        .resize({ width, height, kernel: "lanczos3", fit: "fill" })
        .webp({ quality: 90, alphaQuality: 100, effort: 6 })
        .toFile(path);
      sizes[name] = statSync(path).size;
    }
  }
}

async function bakeAll() {
  const portrait = await gradePortrait();
  const portraitPath = img("anton-iosifov-graphite.webp");
  await sharp(portrait.data, { raw: portrait.info }).webp({ quality: 84 }).toFile(portraitPath);
  sizes["anton-iosifov-graphite"] = statSync(portraitPath).size;

  for (const scale of [1, 2]) {
    const tag = scale === 2 ? "@2x" : "";
    await save(await grade("ribbon", scale, RIBBON, cutRibbon), `ribbon${tag}`);
    for (const chip of ["chip-code", "chip-cloud", "chip-spark"]) await save(await grade(chip, scale, CHIP), `${chip}${tag}`);
    await save(colourScreen(await grade("phone", scale, PENCIL), SCREENS.phone, scale), `phone${tag}`);
    // The shell below is punched from the graphite laptop, so its feathered rim stays bezel-coloured.
    const laptop = await grade("laptop", scale, PENCIL);
    await save(colourScreen(laptop, SCREENS.laptop, scale), `laptop${tag}`);

    if (scale === 2) {
      const { width, height } = laptop.info;
      const quad = LAPTOP_SCREEN.map(([x, y]) => [x * scale, y * scale]);
      const shell = Buffer.from(laptop.data);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          if (!inside(quad, x, y)) continue;
          const a = (y * width + x) * 4 + 3;
          shell[a] = clamp(shell[a] * (1 - Math.min(1, edgeDistance(quad, x, y) / (HOLE_FEATHER * scale))));
        }
      }
      await save({ data: shell, info: laptop.info }, `laptop-shell${tag}`);
      await save({ data: over(shell, warpIntoScreen(portrait, quad, width, height)), info: laptop.info }, `laptop-anton${tag}`);
    }
  }
}

// `--blur` writes only the soft chip copies, from the committed chips, and touches no other file.
if (!process.argv.includes("--blur")) await bakeAll();
await blurChips();

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
for (const [name, bytes] of Object.entries(sizes)) console.log(name.padEnd(26), kb(bytes));
if (sizes.ribbon) {
  const firstPaint = ["ribbon", "laptop", "phone", "chip-code", "chip-cloud", "chip-spark"].reduce((sum, name) => sum + sizes[name], 0);
  console.log("first paint (1x)".padEnd(26), kb(firstPaint));
}
