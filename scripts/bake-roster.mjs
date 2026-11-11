// Draws the head nurse's handwritten roster. Run once by hand from the repo root:
//   node scripts/bake-roster.mjs
// Writes public/img/projects/icu/handwritten.webp, which is committed; CI never runs this.
// The sheet is the same size as public/img/projects/icu/laptop.webp, and every rule and word sits where
// the capture has its table line and pill, so the sweep turns each word into the pill underneath it.
// The names are the capture's own fictional staff list: nothing here is real.
//
// Needs Chrome and the network (Amatic SC comes from Google Fonts), through the design-taste-frontend
// skill's CDP client. It is a local tool only: nothing in the app imports it.
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const { Browser } = await import(pathToFileURL(join(homedir(), ".claude/skills/design-taste-frontend/scripts/lib/cdp.mjs")).href);

const OUTPUT = fileURLToPath(new URL("../public/img/projects/icu/handwritten.webp", import.meta.url));
const WIDTH = 1600;
const HEIGHT = 900;

const GROUND = "#34363b";
const PENCIL = (alpha) => `rgba(239,238,233,${alpha})`;
const WRITTEN = 0.82;
const RULED = 0.13;

/** Seeded, so a re-bake draws the same sheet. */
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(20261109);
const jitter = (amount) => (random() - 0.5) * amount;

// ── The capture, read off its pixels ────────────────────────────────────────

const MORNING = "בוקר";
const EVENING = "ערב";
const NIGHT = "לילה";
const COURSE = "קורס";

/** Column centres in the capture. */
const COLUMN = { total: 298, sa: 373, fr: 457, th: 553, we: 662, tu: 790, mo: 905, su: 1011 };
const DAYS = { sa: "שבת", fr: "שישי", th: "חמישי", we: "רביעי", tu: "שלישי", mo: "שני", su: "ראשון" };

/** Where the capture's table lines run. */
const VERTICALS = [267, 331, 415, 500, 605, 718, 862, 947, 1076, 1333];
const HORIZONTALS = [200, 245, 278, 323, 368, 413, 458, 503, 548, 583, 628, 673, 718, 763, 808, 853];

/** y of the row's pills, the name, its shifts, and the shift total the capture counts at the left. */
const STAFF = [
  [300, "אורית לוי", { sa: MORNING, we: MORNING }, 3],
  [345, "מיכל ברקוביץ'", { fr: MORNING, th: NIGHT, mo: NIGHT }, 3],
  [390, "יעל אברהמי", { sa: NIGHT, th: COURSE, we: NIGHT, tu: EVENING }, 3],
  [435, "שירה מזרחי", { th: EVENING, mo: EVENING, su: MORNING }, 3],
  [480, "דנה שגיא", { sa: EVENING, fr: MORNING }, 4],
  [525, "רונית שפירא", { th: MORNING, we: NIGHT, su: NIGHT }, 3],
  [605, "הילה גולן", { sa: EVENING, we: EVENING, su: EVENING }, 3],
  [650, "נטלי רוזנברג", { fr: EVENING, th: MORNING, mo: MORNING }, 3],
  [695, "ליאת אשכנזי", { sa: MORNING, we: MORNING, tu: NIGHT }, 3],
  [740, "מאיה פרץ", { th: NIGHT, mo: NIGHT, su: EVENING }, 3],
  [785, "אפרת נחמיאס", { sa: NIGHT, fr: EVENING, tu: EVENING }, 3],
  [830, "שני אלמוג", { th: EVENING, we: MORNING, su: MORNING }, 3],
];

/** Shifts somebody changed: "row:day" to what was written first. The capture's word is the correction squeezed in above it. */
const CHANGED = {
  "300:sa": EVENING,
  "390:we": MORNING,
  "435:su": EVENING,
  "480:sa": NIGHT,
  "525:th": EVENING,
  "605:su": MORNING,
  "650:fr": NIGHT,
  "740:th": MORNING,
  "785:tu": MORNING,
};

// ── The hand ────────────────────────────────────────────────────────────────

const number = (value) => value.toFixed(1);

/** A pencil line along a ruler: nearly straight, with a slow bend and a small tremor. */
function ruled(x0, y0, x1, y1) {
  const steps = 26;
  const bend = jitter(3);
  const phase = random() * 6;
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const sway = Math.sin(t * Math.PI) * bend + Math.sin(t * 9 + phase) * 0.5 + jitter(0.7);
    const vertical = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    points.push([x0 + (x1 - x0) * t + (vertical ? sway : 0), y0 + (y1 - y0) * t + (vertical ? 0 : sway)]);
  }
  return `M${points.map(([x, y]) => `${number(x)} ${number(y)}`).join("L")}`;
}

const ruleVertical = (x) => ruled(x + jitter(4), HORIZONTALS[0] - 4 - random() * 12, x + jitter(4), HORIZONTALS.at(-1) + 3 + random() * 14);
const ruleHorizontal = (y) => ruled(VERTICALS[0] - 3 - random() * 14, y + jitter(3.5), VERTICALS.at(-1) + 3 + random() * 14, y + jitter(3.5));

function word(x, y, text, size, { alpha = WRITTEN, tilt = jitter(8), anchor = "middle" } = {}) {
  return `<text x="${number(x)}" y="${number(y)}" font-size="${number(size)}" fill="${PENCIL(alpha)}" text-anchor="${anchor}" transform="rotate(${number(tilt)} ${number(x)} ${number(y)})">${text}</text>`;
}

/** One pass of the pencil across a word that no longer counts. */
const strike = (cx, cy, half) => ruled(cx - half + jitter(6), cy + jitter(7), cx + half + jitter(6), cy + jitter(7));

// ── The sheet ───────────────────────────────────────────────────────────────

let rules = "";
let writing = "";
let marks = "";

for (const x of VERTICALS) rules += `<path d="${ruleVertical(x)}"/>`;
for (const y of HORIZONTALS) rules += `<path d="${ruleHorizontal(y)}"/>`;
// Gone over twice: the line under the day names and the one that closes the name column.
rules += `<path d="${ruleHorizontal(245)}"/><path d="${ruleVertical(1076)}"/>`;

writing += word(1206, 118, "סידור משמרות", 70, { alpha: 0.9, tilt: -1.5 });
marks += `<path d="${ruled(1066, 150, 1344, 145)}"/>`;
writing += word(760, 124, "18/10 - 24/10", 42, { alpha: 0.62, tilt: 1 });

for (const [day, name] of Object.entries(DAYS)) writing += word(COLUMN[day], 223, name, 42, { alpha: 0.86 });
writing += word(1208, 222, "שם מלא", 40, { alpha: 0.7, tilt: 0.6 });
writing += word(COLUMN.total, 223, 'סה"כ', 34, { alpha: 0.6 });
writing += word(1322, 262, "צוות סיעוד", 34, { alpha: 0.66, tilt: -0.8, anchor: "start" });

for (const [y, name, shifts, total] of STAFF) {
  writing += word(1313 + jitter(8), y + jitter(4), name, 42, { tilt: jitter(4), anchor: "start" });
  writing += word(COLUMN.total + jitter(6), y + jitter(5), String(total), 36, { alpha: 0.6, tilt: jitter(6) });
  for (const [day, shift] of Object.entries(shifts)) {
    const cx = COLUMN[day] + jitter(12);
    const cy = y + jitter(6);
    const size = 40 + random() * 10;
    const first = CHANGED[`${y}:${day}`];
    if (first) {
      writing += word(cx, cy + 5, first, size * 0.92, { alpha: 0.5 });
      marks += `<path d="${strike(cx, cy + 5, 33)}"/>`;
      writing += word(cx + jitter(14), cy - 18, shift, 30);
    } else {
      writing += word(cx, cy, shift, size);
    }
  }
}

// Cells where the capture has two things side by side, each written on its own side of the cell.
writing += word(1036, 301, MORNING, 44);
writing += word(980, 298, 'א"מ', 30, { alpha: 0.7, tilt: 3 });
writing += word(826, 481, MORNING, 38, { tilt: -3 });
writing += word(754, 479, NIGHT, 38, { tilt: 2 });

// The week somebody is away: her name, the word, and a line drawn through the days.
writing += word(1313, 566, "תמר בן-דוד", 38, { tilt: -1, anchor: "start" });
writing += word(700, 566, "חופש", 44, { alpha: 0.78, tilt: -2 });
const away = `<path d="${ruled(354, 566, 648, 564)}"/><path d="${ruled(752, 565, 1056, 567)}"/>`;

// The ring and the arrow: someone negotiating a swap.
marks += '<path d="M 505 396 C 500 374, 540 366, 566 368 C 604 370, 612 396, 590 406 C 560 417, 508 416, 503 391 C 502 384, 510 374, 524 370"/>';
marks += '<path d="M 898 356 C 872 370, 852 384, 830 388"/><path d="M 843 376 L 828 388 L 845 396"/>';

const page = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;background:${GROUND}}svg{display:block}
text{font-family:"Amatic SC";font-weight:700;direction:rtl;dominant-baseline:middle}
</style>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <filter id="hand" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.038" numOctaves="2" seed="7" result="bend"/>
      <feDisplacementMap in="SourceGraphic" in2="bend" scale="5" xChannelSelector="R" yChannelSelector="G" result="bent"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="3" result="tooth"/>
      <feDisplacementMap in="bent" in2="tooth" scale="1.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${GROUND}"/>
  <g fill="none" stroke="${PENCIL(RULED)}" stroke-width="1.4" stroke-linecap="round">${rules}</g>
  <g filter="url(#hand)">${writing}</g>
  <g fill="none" stroke="${PENCIL(0.68)}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" filter="url(#hand)">${marks}</g>
  <g fill="none" stroke="${PENCIL(0.42)}" stroke-width="1.7" stroke-linecap="round" filter="url(#hand)">${away}</g>
</svg>`;

const browser = await Browser.launch({ width: WIDTH, height: HEIGHT });
const tab = await browser.newPage({ width: WIDTH, height: HEIGHT });
await tab.goto("about:blank", { settleMs: 100 });
const fontReady = await tab.eval(async (html) => {
  document.open();
  document.write(html);
  document.close();
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&display=block";
  await new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = reject;
    document.head.append(link);
  });
  await document.fonts.load('700 42px "Amatic SC"', "בוקר");
  await document.fonts.ready;
  return document.fonts.check('700 42px "Amatic SC"', "בוקר");
}, page);
if (!fontReady) throw new Error("Amatic SC did not load, so the sheet would fall back to a system font");
await new Promise((resolve) => setTimeout(resolve, 400));
const png = Buffer.from(await tab.screenshot({ format: "png" }), "base64");
await browser.close();

await sharp(png).webp({ quality: 84, effort: 6 }).toFile(OUTPUT);
console.log("public/img/projects/icu/handwritten.webp written");
process.exit(0);
