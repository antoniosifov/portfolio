import { HERO_ART } from "@/components/HeroStage";
import { type Chip, softCopy } from "@/lib/motion/blur";
import {
  type Box,
  dolly,
  growQuad,
  homography,
  ioCubic,
  LAPTOP_NATURAL,
  LAPTOP_SCREEN,
  layoutBox,
  mapQuad,
  type Point,
  type Quad,
  rectQuad,
  seg,
  sineInOut,
} from "@/lib/motion/camera";
import { FINE_POINTER, REDUCED } from "@/lib/motion/conditions";
import { once } from "@/lib/motion/once";
import { type Plan, type RestCtx, type SceneCtx, type SceneDef, Stage } from "@/lib/motion/stage";

/* Scene C, Pull back. About is the laptop's screen seen from up close: the camera pulls back out of it, his
   portrait opens to fill that screen as it shrinks, and the title slide's composition comes back around it, his
   face on the laptop, the second sentence of the heading rolling in once. Every frame is rendered from one
   number, p, by `render`; every size comes from layout in `measure`. Nothing reads layout while scrolling.

   Kept cheap per frame, by scene A's rules (WP7): what moves or fades is its own layer for as long as the scene is
   live; the chips go sharp by crossfading baked soft copies (lib/motion/blur.ts), never an animated filter; floats
   are paused, not re-resolved through --amp, and only the laptop's, which the camera needs at rest, has its pose
   folded into its own transform; the one read a frame can make (that pose, once) comes before any write. */

/** His portrait, graded once (the same file the About card shows), and its natural size. */
const PORTRAIT = "/img/anton-iosifov-graphite.webp";
const PORTRAIT_W = 900;
const PORTRAIT_H = 1200;
/** The laptop screen's proportions, and where the bake (laptop-anton) and the card (.about-photo) put his face. */
const SCREEN_ASPECT = 1.6;
const SCREEN_Y = 0.17;
const COLUMN_Y = 0.18;
/** The card's corner, which the portrait has at its start, on the card's left side. */
const CARD_RADIUS = 14;

/** Where each chip comes back from: never across the copy column. */
const CHIPS: { name: Chip; from: Point }[] = [
  { name: "chip-code", from: [-0.2, -1] },
  { name: "chip-cloud", from: [1, -0.15] },
  { name: "chip-spark", from: [0.15, 1] },
];
const REJOIN_BLUR = 6;

/** The last trace's jog runs at 45° from the trace's right end to the band (or the spark chip riding it) and on under
 *  it by JOG_TUCK, so floats and pointer depth never open a gap: 40-finale.css paints the trace under the stage. Its
 *  length is read from the pictures' alpha along that line, within JOG_REACH; JOG_REST is the drawn default. */
const JOG_REACH = 200;
const JOG_TUCK = 6;
const JOG_ALPHA = 96;
const JOG_REST = 34;
/** The trace's pad on its left end, which the draw also uncovers. */
const TRACE_PAD = 3;

/** The choreography, as fractions of the hold (spec section 5, scene C). */
const T = {
  body: [0.06, 0.16],
  camera: [0.14, 0.72],
  open: [0.18, 0.56],
  ribbon: [0.32, 0.5],
  chips: [0.36, 0.66],
  phone: [0.44, 0.74],
  title: [0.54, 0.68],
  text: [0.59, 0.73],
  button: [0.64, 0.78],
  links: [0.72, 0.87],
  art: [0.9, 0.94],
  trace: [0.9, 0.98],
  amp: [0.94, 1],
} as const;
const STEP = 0.03;
/** As About's words leave, the screen's copy of his photo takes over from the card's and the card's plate goes with
 *  the words, so the pull-back starts from the photo alone, never from an empty card. */
const SWAP = (T.body[0] + T.body[1]) / 2;
/** The heading rolls once from ROLL_ON, but only after its first sentence has been there for ROLL_DWELL (a jump lands
 *  on the second at once). It rolls back unseen: only once the heading has faded out on the way up (its 360 ms fade in
 *  40-finale.css, so after TITLE_FADE), never while it is read. */
const ROLL_ON = 0.66;
const ROLL_DWELL = 1500;
const TITLE_FADE = 420;
/** The phone rises from at least this far below its place (the spec's 520 px), and from wholly below the window
 *  where that is not enough (1440x900 left its top corner 40 px in view), so it can slide in at full opacity: faded
 *  in, the band showed through its screen wherever the scroll stopped. */
const PHONE_DROP = 520;
const PHONE_TURN = -9;
const PHONE_CLEAR = 16;
/** The lime current runs once along the band when the scroll first crosses GLINT_ON, in time, never scrubbed, so it
 *  cannot be left parked on the band; under GLINT_OFF it can run again. */
const GLINT_ON = 0.84;
const GLINT_OFF = 0.8;
const GLINT_MS = 900;
const GLINT_FROM = "translate3d(-120%, 0, 0) skewX(-22deg)";
const GLINT_TO = "translate3d(420%, 0, 0) skewX(-22deg)";
const SHELL_OFF = 0.94;
const ABOUT_OFF = 0.96;
const SCRIM_FROM = 0.1;
const CLEAR_FROM = 0.72;
/** Pictures and copy are drawn (at an invisible opacity) from these points, so their first visible frame does not
 *  raster them. */
const ART_WARM = 0.8;
const SCREEN_WARM = 0.08;
const COPY_WARM = 0.4;

const scaleQuad = (q: Quad, k: number) => mapQuad(q, ([x, y]) => [x * k, y * k]);
const moveQuad = (q: Quad, dx: number, dy: number) => mapQuad(q, ([x, y]) => [x + dx, y + dy]);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const px = (value: number) => `${value.toFixed(2)}px`;
const num = (value: number) => value.toFixed(4);
const at = (p: number, [a, b]: readonly [number, number], shift = 0) => seg(p, a + shift, b + shift);

/** Inline styles with memory: a value is only written when it changes, and everything written can be undone. */
function styles() {
  const written = new Map<HTMLElement, Map<string, string>>();
  const set = (el: HTMLElement | null | undefined, prop: string, value: string) => {
    if (!el) return;
    let props = written.get(el);
    if (!props) written.set(el, (props = new Map()));
    if (props.get(prop) === value) return;
    props.set(prop, value);
    if (value === "") el.style.removeProperty(prop);
    else el.style.setProperty(prop, value);
  };
  const clear = (el: HTMLElement) => {
    written.get(el)?.forEach((_, prop) => el.style.removeProperty(prop));
    written.delete(el);
  };
  return { set, clearAll: () => [...written.keys()].forEach(clear) };
}

function picture(src: string, className: string) {
  const img = document.createElement("img");
  img.className = className;
  img.src = src;
  img.alt = "";
  img.decoding = "async";
  img.draggable = false;
  img.setAttribute("aria-hidden", "true");
  return img;
}

/** How long the last trace's 45° jog must be to reach under the band (or the spark chip) from the trace's right end,
 *  read from the pictures' alpha in their resting layout: up and to the right beside the copy, down and to the right
 *  where the devices sit below it (`down`). Null while a picture is not decoded or when nothing lies within reach;
 *  the jog then keeps its drawn length. */
function jogLength(trace: HTMLElement, frame: HTMLElement, arts: HTMLImageElement[], down = false): number | null {
  if (arts.some((art) => !art.complete || !art.naturalWidth)) return null;
  const size = Math.ceil(JOG_REACH * Math.SQRT1_2) + 2;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) return null;
  const t = layoutBox(trace, frame);
  const x0 = t.x + t.w;
  const y0 = t.y + t.h / 2;
  // The square searched lies above the trace's right end, or below it.
  const top = down ? y0 : y0 - size;
  for (const art of arts) {
    const b = layoutBox(art, frame);
    g.drawImage(art, b.x - x0, b.y - top, b.w, b.h);
  }
  let alpha: Uint8ClampedArray;
  try {
    alpha = g.getImageData(0, 0, size, size).data;
  } catch {
    return null;
  }
  for (let d = 2; d <= JOG_REACH; d++) {
    const x = Math.round(d * Math.SQRT1_2);
    const y = down ? Math.round(d * Math.SQRT1_2) : size - Math.round(d * Math.SQRT1_2);
    if (x >= size || y < 0 || y >= size) break;
    if (alpha[(y * size + x) * 4 + 3] > JOG_ALPHA) return d + JOG_TUCK;
  }
  return null;
}

/** The pictures the last trace reaches for: the band and the chip that rides it under the trace. */
const jogTargets = (stage: ParentNode) =>
  [".el-ribbon .el-art", ".el-chip-spark .el-art"]
    .map((selector) => stage.querySelector<HTMLImageElement>(selector))
    .filter((art): art is HTMLImageElement => Boolean(art));

/** A float stopped where it was: its pose, read once, and that pose at any amplitude (as scene A's `stillOf`). */
type Still = { inverse: DOMMatrix; at(amp: number): DOMMatrix };

function stillOf(float: HTMLElement): Still {
  const style = getComputedStyle(float);
  const pose = style.transform && style.transform !== "none" ? new DOMMatrix(style.transform) : new DOMMatrix();
  const [ox = 0, oy = 0] = style.transformOrigin.split(" ").map(parseFloat);
  const about = (matrix: DOMMatrix) => new DOMMatrix().translate(ox, oy).multiply(matrix).translate(-ox, -oy);
  const turn = (Math.atan2(pose.b, pose.a) * 180) / Math.PI;
  const size = Math.hypot(pose.a, pose.b);
  return {
    inverse: about(pose).inverse(),
    at: (amp) => about(new DOMMatrix().translate(pose.e * amp, pose.f * amp).rotate(turn * amp).scale(1 + (size - 1) * amp)),
  };
}

/** What a piece's fly adds so a held float shows at `amp` (1 as it stopped, 0 at rest). */
const settled = (still: Still | null, amp: number) => (still ? (amp > 0 ? still.at(amp).multiply(still.inverse) : still.inverse) : null);

type Piece = { el: HTMLElement; fly: HTMLElement; float: HTMLElement; art: HTMLImageElement; box: Box };

function pieces(ctx: SceneCtx) {
  const about = ctx.one<HTMLElement>(":scope > .finale-about");
  const contact = ctx.one<HTMLElement>(":scope > .finale-contact");
  const stage = ctx.one<HTMLElement>(".stage-finale", contact);
  const piece = (name: string): Piece => {
    const el = ctx.one<HTMLElement>(`.el-${name}`, stage);
    return {
      el,
      fly: ctx.one<HTMLElement>(":scope > .el-fly", el),
      float: ctx.one<HTMLElement>(".el-float", el),
      art: ctx.one<HTMLImageElement>(".el-art", el),
      box: { x: 0, y: 0, w: 0, h: 0 },
    };
  };
  return {
    about,
    contact,
    stage,
    body: ctx.one<HTMLElement>(".about-body", about),
    photo: ctx.one<HTMLElement>(".about-photo", about),
    card: ctx.one<HTMLElement>(".about-section", about),
    title: ctx.one<HTMLElement>(".contact-title", contact),
    texts: ctx.q<HTMLElement>(".contact-copy > p", contact),
    actions: ctx.one<HTMLElement>(".contact-actions", contact),
    trace: ctx.one<HTMLElement>(".last-trace", contact),
    list: ctx.one<HTMLElement>(".contact-links", contact),
    links: ctx.q<HTMLElement>(".contact-links > li", contact),
    sheen: stage.querySelector<HTMLElement>(".ribbon-sheen"),
    ribbon: piece("ribbon"),
    laptop: piece("laptop"),
    phone: piece("phone"),
    chips: CHIPS.map((chip) => ({ ...piece(chip.name), name: chip.name, from: chip.from })),
  };
}

type Placement = { x: number; y: number; s: number };

type Measure = {
  /** The screen's rectangle: the 1.6 cover of the window, centred. The About layer starts as exactly this. */
  R: Quad;
  /** The laptop's screen at rest, in the window, and the same in the laptop's own box. */
  q0: Quad;
  portalLocal: Quad;
  /** Where the shell starts: its opened screen a hair larger than the window, so its bezel is out of sight. */
  shellStart: Quad;
  /** The portrait's clip at the column (top, right, bottom, left, in the screen's box) and its two placements. */
  clip: [number, number, number, number];
  column: Placement;
  cover: Placement;
  /** Chips travel this far, whatever the window. */
  peel: number;
  /** How far below its place the phone starts: PHONE_DROP, or more, so it starts wholly below the window. */
  phoneDrop: number;
  headerH: number;
  traceW: number;
  /** How far the trace's jog reaches past its right end and above it. */
  jogX: number;
  jogY: number;
};

function build(tl: Parameters<Plan["build"]>[0], ctx: SceneCtx) {
  const dom = pieces(ctx);
  const { about, contact, stage, laptop, ribbon, phone, chips, title } = dom;
  const css = styles();
  const state = { p: 0 };
  let m: Measure | null = null;
  let header: "clear" | "scrim" | null = null;
  let lastP = -1;
  let rolled = false;
  let instantFrame = 0;
  let titleSince = 0;
  let rollTimer = 0;
  let glinted = false;
  let glintRun: Animation | null = null;

  // The punched laptop the camera pulls back through, the screen his portrait opens on, and the lime current for
  // the band. Created here, so React never meets them.
  const shell = picture(`${HERO_ART}/laptop-shell@2x.webp`, "el-shell");
  laptop.float.insertBefore(shell, laptop.art);
  // The art is the baked last frame. Lazy by default, and the visitor reaches it inside a held screen.
  laptop.art.loading = "eager";
  const screen = document.createElement("div");
  screen.className = "about-screen";
  screen.setAttribute("aria-hidden", "true");
  const portrait = picture(PORTRAIT, "");
  portrait.loading = "eager";
  screen.append(portrait);
  about.append(screen);
  const glint = document.createElement("i");
  glint.className = "finale-glint";
  glint.setAttribute("aria-hidden", "true");
  dom.sheen?.append(glint);
  // Each chip's soft copy, for the rejoin: crossfaded by opacity, never an animated filter.
  const softs = chips.map((chip) => softCopy(chip.float, chip.art, chip.name, REJOIN_BLUR));
  // The heading starts on its first sentence; the scene rolls it once.
  title.dataset.roll = "was";
  // The trace's jog is aimed from the band's and the chip's pictures, so it is aimed again when either (re)loads.
  const jogArts = jogTargets(stage);

  const toggle = (el: Element | null, name: string, on: boolean) => {
    if (el && el.hasAttribute(name) !== on) el.toggleAttribute(name, on);
  };

  /** The laptop's float is held while the camera needs it at rest: paused once and its pose folded into the fly
   *  (`settled`), released at the end from the very pose it stopped in. The pose is read before the pause is written. */
  let still: Still | null = null;
  const holdLaptop = (on: boolean) => {
    if (on === Boolean(still)) return still;
    if (!on) {
      still = null;
      css.set(laptop.float, "animation-play-state", "");
      return null;
    }
    const next = stillOf(laptop.float);
    css.set(laptop.float, "animation-play-state", "paused");
    return (still = next);
  };

  /** The other floats only pause where they are and run on from there: nothing measures them. */
  const idle = (piece: Piece, on: boolean) => css.set(piece.float, "animation-play-state", on ? "paused" : "");

  /** Puts a piece on a quad: `local` is the quad in the piece's own box, `to` in the window's. `after` is a held
   *  float's settle, applied before the move. */
  const place = (piece: Piece, local: Quad, to: Quad | null, after: DOMMatrix | null = null) => {
    if (!to) {
      css.set(piece.fly, "transform", after ? after.toString() : "");
      return;
    }
    const matrix = homography(local, moveQuad(to, -piece.box.x, -piece.box.y));
    css.set(piece.fly, "transform", after ? new DOMMatrix(matrix).multiply(after).toString() : matrix);
  };

  /** Copy comes up into place: a short rise and a fade that is readable early (ease out). It is its own layer for
   *  the whole flight, so finishing a rise mid-scroll does not repaint the contact layer around it; at rest it goes
   *  back into the page, where text keeps its subpixel edges.
   *  From `warm` it is drawn at an invisible opacity, so its first visible frame does not raster it; it takes the
   *  pointer only once it is seen. Out of sight it is only transparent: it stays in the accessibility tree and in the
   *  tab order, and focus inside the contact layer takes the scene to its end (lib/motion/anchors.ts). */
  const rise = (el: HTMLElement, t: number, dy: number, flight: boolean, warm: boolean) => {
    // In from a quarter of its rise (so the heading reads at .6, as the spec has it), never left half faded where the
    // visitor stops; 40-finale.css eases it.
    const k = t >= 0.25 ? 1 : 0;
    css.set(el, "opacity", k < 1 ? num(warm ? Math.max(0.001, k) : k) : "");
    css.set(el, "transform", k < 1 ? `translate3d(0, ${px((1 - k) * dy)}, 0)` : "");
    css.set(el, "will-change", flight ? "transform, opacity" : "");
    css.set(el, "pointer-events", k > 0 ? "auto" : "");
  };

  /** The heading's one-shot. A jump (a link, a reload, a fast fling) lands on the sentence without playing it. */
  const roll = (on: boolean, instant: boolean) => {
    rolled = on;
    window.clearTimeout(rollTimer);
    rollTimer = 0;
    cancelAnimationFrame(instantFrame);
    if (instant) title.classList.add("is-instant");
    title.dataset.roll = on ? "now" : "was";
    if (!instant) {
      title.classList.remove("is-instant");
      return;
    }
    instantFrame = requestAnimationFrame(() => {
      instantFrame = requestAnimationFrame(() => {
        instantFrame = 0;
        title.classList.remove("is-instant");
      });
    });
  };

  /** Rolls forward once the first sentence has had its time; until then it waits, in time, not in scroll. */
  const rollWhenRead = () => {
    const wait = ROLL_DWELL - (performance.now() - titleSince);
    if (wait <= 0) return roll(true, false);
    if (rollTimer) return;
    rollTimer = window.setTimeout(() => {
      rollTimer = 0;
      if (!rolled && state.p >= ROLL_ON) roll(true, false);
    }, wait);
  };

  /** Back to the first sentence once the heading's fade out is over, at once and unseen; not if it came back. */
  const rollBackUnseen = () => {
    if (rollTimer) return;
    rollTimer = window.setTimeout(() => {
      rollTimer = 0;
      if (rolled && at(state.p, T.title) < 0.25) roll(false, true);
    }, TITLE_FADE);
  };

  /** The jog's length for this layout, written where 40-finale.css draws it. */
  const aim = () => {
    const length = jogLength(dom.trace, contact, jogArts);
    css.set(dom.trace, "--jog", length ? px(length) : "");
    const reach = (length ?? JOG_REST) * Math.SQRT1_2 + 3;
    if (m) {
      m.jogX = reach;
      m.jogY = reach;
    }
  };
  const reaim = () => {
    aim();
    render(state.p);
  };
  jogArts.forEach((art) => art.addEventListener("load", reaim));

  const measure = () => {
    const VW = contact.offsetWidth || document.documentElement.clientWidth;
    const VH = ctx.lvh();
    // Both layers are stuck at the top of the window while the scene runs: their own boxes are the window's.
    for (const piece of [ribbon, laptop, phone, ...chips]) piece.box = layoutBox(piece.el, contact);
    const W = Math.max(VW, VH * SCREEN_ASPECT);
    const H = W / SCREEN_ASPECT;
    const rx = (VW - W) / 2;
    const ry = (VH - H) / 2;
    const R = rectQuad(rx, ry, rx + W, ry + H);
    const portalLocal = scaleQuad(LAPTOP_SCREEN, laptop.box.w / LAPTOP_NATURAL);
    const q0 = moveQuad(portalLocal, laptop.box.x, laptop.box.y);

    // The photo's column in the About layer, and the 900x1200 picture placed in it as the card places it
    // (cover, 18% down) and on the screen as the bake does (cover of the 1.6 screen, 17% down). Both relative to
    // the screen's own box.
    const col = layoutBox(dom.photo, about);
    const sc = Math.max(col.w / PORTRAIT_W, col.h / PORTRAIT_H);
    const ss = W / PORTRAIT_W;

    // The phone's picture at its start turn, about the centre of its box (as `render` turns it): the highest corner
    // must start PHONE_CLEAR below the window's bottom edge.
    const pic = layoutBox(phone.art, contact);
    const cx = phone.box.x + phone.box.w / 2;
    const cy = phone.box.y + phone.box.h / 2;
    const turn = (PHONE_TURN * Math.PI) / 180;
    const highest = Math.min(
      ...[pic.x, pic.x + pic.w].flatMap((x) => [pic.y, pic.y + pic.h].map((y) => cy + (x - cx) * Math.sin(turn) + (y - cy) * Math.cos(turn))),
    );

    m = {
      R,
      q0,
      portalLocal,
      shellStart: growQuad(R, 1.006),
      clip: [col.y - ry, rx + W - (col.x + col.w), ry + H - (col.y + col.h), col.x - rx],
      column: { x: col.x + (col.w - PORTRAIT_W * sc) / 2 - rx, y: col.y + (col.h - PORTRAIT_H * sc) * COLUMN_Y - ry, s: sc },
      cover: { x: 0, y: -SCREEN_Y * (PORTRAIT_H * ss - H), s: ss },
      peel: 900 * Math.max(1, VW / 1440),
      phoneDrop: Math.max(PHONE_DROP, VH + PHONE_CLEAR - highest),
      headerH: document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0,
      traceW: dom.trace.offsetWidth,
      jogX: 0,
      jogY: 0,
    };
    aim();
    // The shell's opened screen is transparent, but its box would still lie over About for a pointer or a hit test:
    // its screen is cut out of the box too, in the shell's own coordinates (as scene A does).
    const right = (laptop.box.w + 2).toFixed(1);
    const bottom = (laptop.art.offsetHeight + 2).toFixed(1);
    const hole = portalLocal.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
    css.set(shell, "clip-path", `path(evenodd, "M-2 -2H${right}V${bottom}H-2Z${hole}Z")`);
    css.set(screen, "left", px(rx));
    css.set(screen, "top", px(ry));
    css.set(screen, "width", px(W));
    css.set(screen, "height", px(H));
    // A held pose is in px of a size that may just have changed: read it again.
    if (still) still = stillOf(laptop.float);
    softs.forEach((soft) => soft.measure());
    render(state.p);
  };

  const render = (p: number) => {
    if (!m) return;
    // The one read a frame can make, before anything is written: the laptop's pose, on the frame its hold starts.
    const held = holdLaptop(p < 1);
    const done = p >= 1;
    const jump = lastP < 0 || Math.abs(p - lastP) > 0.08;
    lastP = p;
    // Words are in or out and eased there by 40-finale.css; a jump lands without the ease.
    toggle(about, "data-instant", jump);
    toggle(contact, "data-instant", jump);

    // Flags: pointer depth and the white glint stand down while the camera works; the floats wait.
    toggle(stage, "data-flying", !done);
    for (const piece of [ribbon, phone, ...chips]) idle(piece, !done);
    const ground = p <= SCRIM_FROM ? null : p < CLEAR_FROM ? "scrim" : "clear";
    if (ground !== header) Stage.header((header = ground));

    // About's words leave first; the photo stays.
    const leave = at(p, T.body) >= 0.5 ? 1 : 0;
    css.set(dom.body, "opacity", leave ? "0" : "");
    css.set(dom.body, "transform", leave ? "translate3d(0, -14px, 0)" : "");
    // Gone, the words stay in the accessibility tree; 40-finale.css also makes the heading itself transparent once the
    // fade is over, so it is plainly not shown when the layer lies under the last frame.
    toggle(dom.body, "data-gone", leave > 0);
    css.set(dom.body, "will-change", p > 0 && p < T.camera[0] + 0.1 ? "transform, opacity" : "");

    // The camera pulls back: the About layer goes from the window into the laptop's screen while the shell comes
    // in from just past the window's edges to its place. Same dolly, so the screen always holds the layer.
    // At the end the layer is only made transparent: it keeps its place in the accessibility tree.
    const e = ioCubic(at(p, T.camera));
    const aboutOn = p < ABOUT_OFF;
    css.set(about, "transform", e > 0 ? homography(m.R, dolly(m.R, m.q0, e)) : "");
    css.set(about, "will-change", p > 0 && aboutOn ? "transform" : "");
    css.set(about, "opacity", aboutOn ? "" : "0");
    css.set(about, "pointer-events", aboutOn ? "" : "none");
    const qShell = e < 1 ? dolly(m.shellStart, m.q0, e) : null;
    place(laptop, m.portalLocal, qShell, settled(held, sineInOut(at(p, T.amp))));
    css.set(shell, "opacity", p < SHELL_OFF ? "1" : "");

    // His portrait opens from the card's column to the whole screen as the layer shrinks, so it is never seen
    // larger than it was. One picture: the clip and the placement both go between two placements of one image.
    const k = ioCubic(at(p, T.open));
    // From SWAP the screen's copy, at the column, stands in for the card's photo, and the card (its plate, edge and
    // traces) fades out with the words: what the camera pulls back from is the photo alone. 40-finale.css keeps the
    // copy for as long as the card takes to fade back in, so the photo never blinks either way.
    const swapped = p >= SWAP;
    const shown = swapped && aboutOn;
    // Drawn invisibly over the photo from SCREEN_WARM, so the swap's first frame does not raster the picture.
    const drawn = p >= SCREEN_WARM && aboutOn;
    css.set(screen, "visibility", drawn ? "visible" : "");
    css.set(screen, "opacity", drawn && !shown ? "0.001" : "");
    toggle(screen, "data-shown", shown);
    css.set(dom.card, "opacity", swapped ? "0" : "");
    if (drawn) {
      const [t, r, b, l] = m.clip.map((value) => px(value * (1 - k)));
      // The card's corners: the left two from the start, the right two as the plate goes, so the photo alone is a
      // rounded picture, never one cut square on the side where the words were.
      const round = px(CARD_RADIUS * (1 - k));
      const side = px(CARD_RADIUS * seg(p, SWAP, SWAP + 0.03) * (1 - k));
      css.set(screen, "clip-path", `inset(${t} ${r} ${b} ${l} round ${round} ${side} ${side} ${round})`);
      const x = lerp(m.column.x, m.cover.x, k);
      const y = lerp(m.column.y, m.cover.y, k);
      const s = lerp(m.column.s, m.cover.s, k);
      css.set(portrait, "transform", `translate3d(${px(x)}, ${px(y)}, 0) scale(${s.toFixed(5)})`);
    }

    // At the end the baked laptop (his face inside) fades in over the shell and the screen, which then go, so the
    // floats can run on with nothing to match.
    const art = at(p, T.art);
    css.set(laptop.art, "opacity", art >= 1 ? "" : num(Math.max(p >= ART_WARM ? 0.001 : 0, art)));
    css.set(laptop.art, "visibility", art <= 0 && p < ART_WARM ? "hidden" : "");

    // The ribbon comes back riding the laptop's own camera, so its cut ends stay under the bezel.
    const back = at(p, T.ribbon);
    place(ribbon, moveQuad(m.q0, -ribbon.box.x, -ribbon.box.y), qShell);
    css.set(ribbon.fly, "opacity", back < 1 ? num(back) : "");
    css.set(ribbon.fly, "visibility", back <= 0 ? "hidden" : "");

    // The lime current runs once along the band, in time, when the scroll first crosses GLINT_ON (a jump lands without
    // it). Until then it is drawn, invisibly, from the moment the band is back, so the band's mask is rastered then
    // and not on the glint's first frame.
    const ready = back > 0 && p < GLINT_ON;
    css.set(glint, "visibility", ready ? "visible" : "");
    css.set(glint, "opacity", ready ? "0.001" : "");
    css.set(glint, "transform", ready ? GLINT_FROM : "");
    if (p < GLINT_OFF) {
      glinted = false;
      glintRun?.cancel();
      glintRun = null;
    } else if (p >= GLINT_ON && !glinted) {
      glinted = true;
      if (!jump && typeof glint.animate === "function") {
        glintRun = glint.animate(
          [
            { visibility: "visible", opacity: 1, transform: GLINT_FROM },
            { visibility: "visible", opacity: 1, transform: GLINT_TO },
          ],
          { duration: GLINT_MS, easing: "cubic-bezier(.45, 0, .55, 1)" },
        );
        glintRun.onfinish = () => {
          glintRun = null;
        };
      }
    }

    // The phone rises from below the window's edge, turning upright. Opaque all the way: it starts out of sight, so
    // it needs no fade, and a fade let the band show through its screen wherever the scroll stopped.
    const up = easeOut(at(p, T.phone));
    if (up < 1) {
      const a = 1 - up;
      const cx = phone.box.w / 2;
      const cy = phone.box.h / 2;
      css.set(phone.fly, "transform", `translate3d(${px(-120 * a + cx)}, ${px(m.phoneDrop * a + cy)}, 0) rotate(${(PHONE_TURN * a).toFixed(3)}deg) translate3d(${px(-cx)}, ${px(-cy)}, 0)`);
    } else {
      css.set(phone.fly, "transform", "");
    }
    css.set(phone.fly, "visibility", at(p, T.phone) <= 0 ? "hidden" : "");

    chipsRejoin(p);

    // The words of the last frame. Each takes the pointer as soon as it is seen (`rise`): switching it on the whole
    // layer at .6, as first written, restyled all of it in one frame (measured: 14 ms of style at 4x CPU throttle).
    const flight = p > 0 && !done;
    const warm = flight && p >= COPY_WARM;
    const titleIn = at(p, T.title) >= 0.25;
    rise(title, at(p, T.title), 32, flight, warm);
    for (const text of dom.texts) rise(text, at(p, T.text), 28, flight, warm);
    rise(dom.actions, at(p, T.button), 28, flight, warm);
    // The links deal in by opacity alone: switching visibility on them repainted the whole page and the contact layer
    // in the frame each one appeared (27 ms of paint at 4x). The list takes the pointer once the first is dealt.
    // All four are dealt together, in or out, from a quarter into the first one's window; 40-finale.css staggers
    // them, so a stop never leaves half a list or a half faded address.
    const dealt = at(p, T.links) >= 0.25;
    dom.links.forEach((link) => {
      css.set(link, "opacity", dealt ? "" : flight ? "0.001" : "0");
      css.set(link, "transform", dealt ? "" : "translate3d(0, 20px, 0)");
      css.set(link, "will-change", flight ? "transform, opacity" : "");
    });
    css.set(dom.list, "pointer-events", dealt ? "auto" : "");

    // The roll: the first sentence is given time to be read before the second takes its place. On the way back up the
    // heading fades out on the sentence that was read, and only then, unseen, is set back to the first.
    if (!titleIn) titleSince = 0;
    else if (!titleSince) titleSince = performance.now();
    if (rolled) {
      if (titleIn) {
        window.clearTimeout(rollTimer);
        rollTimer = 0;
      } else if (jump) roll(false, true);
      else rollBackUnseen();
    } else if (p >= ROLL_ON) {
      if (jump) roll(true, true);
      else rollWhenRead();
    } else if (rollTimer) {
      window.clearTimeout(rollTimer);
      rollTimer = 0;
    }

    // The trace draws from the ribbon to one gap short of the button: its jog first, from under the band.
    const d = sineInOut(at(p, T.trace));
    css.set(dom.trace, "visibility", d > 0 ? "" : "hidden");
    css.set(
      dom.trace,
      "clip-path",
      d > 0 && d < 1 ? `inset(${px(-m.jogY - 8)} ${px(-m.jogX - 8)} -40px ${px((1 - d) * (m.traceW + m.jogX + TRACE_PAD) - TRACE_PAD)})` : "",
    );
  };

  const chipsRejoin = (p: number) => {
    if (!m) return;
    chips.forEach((chip, i) => {
      const k = ioCubic(at(p, T.chips, i * STEP));
      const away = 1 - k;
      // Sharp as it settles, from blur(6px), by crossfading baked copies (lib/motion/blur.ts).
      softs[i].set(away);
      if (k >= 1) {
        css.set(chip.fly, "transform", "");
        css.set(chip.fly, "opacity", "");
        css.set(chip.fly, "visibility", "");
        return;
      }
      // From three edges of the screen, shrinking as they come in. Scaled about their centre.
      const [dx, dy] = chip.from;
      const scale = 1 + 1.5 * away;
      const dist = m!.peel * away;
      const x = dx * dist - ((scale - 1) * chip.box.w) / 2;
      const y = dy * dist - ((scale - 1) * chip.box.h) / 2;
      css.set(chip.fly, "transform", `translate3d(${px(x)}, ${px(y)}, 0) scale(${num(scale)})`);
      // One that comes down from the top appears below the fixed header instead of passing behind the nav.
      const home = chip.box.y + chip.box.h / 2;
      const clearOf = Math.min(home, m!.headerH + (chip.box.h * scale) / 2 + 8);
      const below = dy < 0 && clearOf > m!.headerH + 1 ? seg(home + dy * dist, m!.headerH, clearOf) : 1;
      const shown = seg(k, 0, 0.3) * below;
      css.set(chip.fly, "opacity", shown < 1 ? num(shown) : "");
      css.set(chip.fly, "visibility", shown <= 0 ? "hidden" : "");
    });
  };

  // On touch the scrub follows the scroll event itself: the picture is drawn once per frame, not once per event.
  const perFrame = !window.matchMedia(FINE_POINTER).matches;
  let drawFrame = 0;
  const draw = () => {
    if (!perFrame) return render(state.p);
    if (!drawFrame)
      drawFrame = requestAnimationFrame(() => {
        drawFrame = 0;
        render(state.p);
      });
  };

  ctx.onMeasure(measure);
  tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: draw }, 0);

  return () => {
    cancelAnimationFrame(drawFrame);
    cancelAnimationFrame(instantFrame);
    window.clearTimeout(rollTimer);
    glintRun?.cancel();
    jogArts.forEach((art) => art.removeEventListener("load", reaim));
    m = null;
    css.clearAll();
    still = null;
    shell.remove();
    screen.remove();
    glint.remove();
    softs.forEach((soft) => soft.remove());
    stage.removeAttribute("data-flying");
    about.removeAttribute("data-instant");
    dom.body.removeAttribute("data-gone");
    contact.removeAttribute("data-instant");
    title.removeAttribute("data-roll");
    title.classList.remove("is-instant");
    if (header) Stage.header(null);
  };
}

/** Calls `onRead` once `ratio` of `el` has been in view for `dwell` ms, the view's bottom 12% left out so the change
 *  happens where it is read, not as it enters at the edge. Out of view before that, the wait starts again when it is
 *  back, so the first sentence is always seen before it rolls. Returns a cancel. */
function whenRead(el: Element, ratio: number, dwell: number, onRead: () => void): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onRead();
    return () => {};
  }
  let timer = 0;
  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (entry.isIntersecting && entry.intersectionRatio >= ratio) {
        if (timer) return;
        timer = window.setTimeout(() => {
          timer = 0;
          observer.disconnect();
          onRead();
        }, dwell);
      } else {
        window.clearTimeout(timer);
        timer = 0;
      }
    },
    // Measured in the top 88% of the window. At -25% a short window (a phone held sideways, 844x390) could never
    // count the heading as in after a nav jump, which parks it 212 px down, and the roll stayed on the first sentence.
    { threshold: [ratio], rootMargin: "0px 0px -12% 0px" },
  );
  observer.observe(el);
  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
  };
}

/** Aims the last trace's jog in a resting last frame: up at the band beside the copy (901 px and wider), down at the
 *  first device picture below it where the frame stacks; again when the frame's size changes or the pictures load.
 *  Stacked with nothing in reach, the jog is not drawn (40-finale.css), so the trace never turns toward empty air.
 *  Returns a cancel. */
function aimAtRest(contact: HTMLElement): () => void {
  const trace = contact.querySelector<HTMLElement>(".last-trace");
  const stage = contact.querySelector<HTMLElement>(".stage-finale");
  if (!trace || !stage) return () => {};
  const arts = jogTargets(stage);
  // Below the copy every picture is in the way, so the jog stops at whichever it meets first.
  const below = [...stage.querySelectorAll<HTMLImageElement>(".el .el-art")];
  const wide = window.matchMedia("(min-width: 901px)");
  let frame = 0;
  const aim = () => {
    frame = 0;
    const length = wide.matches ? jogLength(trace, contact, arts) : jogLength(trace, contact, below, true);
    if (length) trace.style.setProperty("--jog", px(length));
    else trace.style.removeProperty("--jog");
  };
  const later = () => {
    if (!frame) frame = requestAnimationFrame(aim);
  };
  const resize = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(later);
  resize?.observe(contact);
  below.forEach((art) => art.addEventListener("load", later));
  void document.fonts?.ready.then(later);
  later();
  return () => {
    cancelAnimationFrame(frame);
    resize?.disconnect();
    below.forEach((art) => art.removeEventListener("load", later));
    trace.style.removeProperty("--jog");
  };
}

/** The finished composition's extras, where the page is in flow (phone, tablet, calm): the trace's jog reaches the
 *  devices, the devices arrive once as the last frame comes into view, and the heading rolls once it has been 60% in
 *  view for ROLL_DWELL, as on the desk. Under reduced motion only the jog; nothing for what is already on screen or
 *  above it. */
function rest(ctx: RestCtx) {
  const contact = ctx.q<HTMLElement>(":scope > .finale-contact")[0];
  if (!contact) return;
  const stops: (() => void)[] = [aimAtRest(contact)];
  const stop = () => stops.forEach((cancel) => cancel());
  if (window.matchMedia(REDUCED).matches) return stop;
  const title = contact.querySelector<HTMLElement>(".contact-title");
  const stage = contact.querySelector<HTMLElement>(".stage-finale");
  const ahead = (el: Element) => el.getBoundingClientRect().top >= window.innerHeight;

  if (title && ahead(title)) {
    title.dataset.roll = "was";
    stops.push(
      whenRead(title, 0.6, ROLL_DWELL, () => {
        title.dataset.roll = "now";
      }),
    );
  }
  if (stage && ahead(stage)) {
    stage.dataset.enter = "";
    stops.push(once(stage, { rootMargin: "0px 0px -10% 0px", onIn: () => stage.classList.add("is-in") }));
  }

  return () => {
    stop();
    title?.removeAttribute("data-roll");
    stage?.removeAttribute("data-enter");
    stage?.classList.remove("is-in");
  };
}

const plan: Plan = { build };

const pullback: SceneDef = {
  id: "pullback",
  desk: plan,
  phone: "rest",
  warm: [
    ...["ribbon", "phone", "chip-code", "chip-cloud", "chip-spark"].map((name) => `${HERO_ART}/${name}@2x.webp`),
    `${HERO_ART}/laptop-shell@2x.webp`,
    `${HERO_ART}/laptop-anton@2x.webp`,
    PORTRAIT,
  ],
  rest,
};

export default pullback;
