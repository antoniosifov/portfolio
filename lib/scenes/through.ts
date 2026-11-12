import { HERO_ART } from "@/components/HeroStage";
import { projects } from "@/data/portfolio";
import { type Chip, softCopy } from "@/lib/motion/blur";
import {
  type Box,
  centroid,
  dolly,
  growQuad,
  homography,
  ioCubic,
  LAPTOP_NATURAL,
  LAPTOP_SCREEN,
  layoutBox,
  mapQuad,
  PHONE_NATURAL,
  PHONE_SCREEN,
  type Point,
  type Quad,
  quadSize,
  rectQuad,
  seg,
  sineInOut,
} from "@/lib/motion/camera";
import { FINE_POINTER, PHONE_LANDED, REDUCED } from "@/lib/motion/conditions";
import { type Plan, type RestCtx, type SceneCtx, type SceneDef, Stage } from "@/lib/motion/stage";

/* Scene A, Through the screen. The camera goes into the laptop (the phone, on a phone), Work is
   what was on its screen, and the hero's phone lands on Ceru's slide. Every frame is rendered from
   one number, p, by `render`; every size comes from layout in `measure`. Nothing here reads layout
   while scrolling.

   Kept cheap per frame (measured, WP7): everything the flight moves or fades is its own layer from the moment
   the scene is live, and Work is painted and rastered before the first scroll (`shoot`, IDLE_WIDTH and
   20-through.css), so a frame only changes transforms and opacities. The chips go soft by crossfading to baked
   copies (lib/motion/blur.ts) instead of an animated filter. A float the camera needs still is paused once and
   its frozen pose is folded into the piece's own transform (`hold`), instead of re-resolving its keyframes
   through --amp every frame. Reads come first in a frame, before anything is written, and the only one that can
   happen per frame (the slide phone's pose) only happens after a landing. */

const ceru = projects.find((project) => project.shortTitle === "Ceru");
const LAUNCH = ceru?.gallery?.[0]?.src;
const HOME = ceru?.gallery?.[1]?.src;

/** The capture size the phone screens are drawn at before the homography puts them on the phone. */
const SCREEN = rectQuad(430, 932);
/** The laptop screen's proportions: Work is shown at this shape, so a wide window keeps the miniature true. */
const SCREEN_ASPECT = 1.6;

/** Where each chip peels to. On a phone the line sits above the stage, so the code chip leaves to the
 *  upper right instead of straight up through it. On the desk the spark leaves through the bottom edge, steeply:
 *  towards the left (the spec's (-1, .55)) it drifted through the copy column, blurred, right under the held line
 *  while it was read. */
const CHIPS: { name: Chip; desk: Point; phone: Point }[] = [
  { name: "chip-code", desk: [-0.2, -1], phone: [1, -0.45] },
  { name: "chip-cloud", desk: [1, -0.15], phone: [1, -0.15] },
  { name: "chip-spark", desk: [-0.15, 1], phone: [-1, 0.55] },
];

/** The blur a peeling chip reaches, in CSS px of the chip as drawn: the spec's blur(6px). */
const PEEL_BLUR = 6;

/** Before the first scroll Work waits as a strip this many px wide at the window's left edge, every row the screen
 *  will show squeezed into it, at WORK_IDLE opacity: invisible, but drawn, so Chrome paints and rasters it before
 *  the first scroll instead of on it (measured: about 400 ms of GPU raster that made the first frames 80-200 ms).
 *  A layer at opacity 0 is painted but never rastered. The strip is a perspective quad like every pose the camera
 *  gives Work, so the raster is kept at the same scale all the way in; text under 6 px wide is what layout
 *  checkers skip. */
const IDLE_WIDTH = 4;
const WORK_IDLE = 0.001;

const scaleQuad = (q: Quad, k: number) => mapQuad(q, ([x, y]) => [x * k, y * k]);
const moveQuad = (q: Quad, dx: number, dy: number) => mapQuad(q, ([x, y]) => [x + dx, y + dy]);
const boxQuad = (b: Box) => rectQuad(b.x, b.y, b.x + b.w, b.y + b.h);
/** On a phone Work is the phone's screen, so it takes the screen's shape: rounded corners, and a cut where the notch
 *  is, so the phone's own notch shows through. In Work's coordinates the screen is the rectangle (0, 0, w, h).
 *  Measured on the unwarped phone art in 430 x 932 screen units: corners 54, notch 118 to 325 and 38 deep with
 *  15 corners; the cut sits 3 units inside it, so only the notch's black ever shows. `round` takes both away (1 to 0)
 *  as the screen becomes the window. */
const phoneScreenClip = (w: number, h: number, round: number) => {
  const sx = w / 430;
  const sy = h / 932;
  const f = (value: number) => value.toFixed(1);
  const r = 54 * sx * round;
  let path = `M${f(r)} 0H${f(w - r)}A${f(r)} ${f(r)} 0 0 1 ${f(w)} ${f(r)}V${f(h - r)}A${f(r)} ${f(r)} 0 0 1 ${f(w - r)} ${f(h)}H${f(r)}A${f(r)} ${f(r)} 0 0 1 0 ${f(h - r)}V${f(r)}A${f(r)} ${f(r)} 0 0 1 ${f(r)} 0Z`;
  const deep = 35 * sy * round;
  if (deep > 0.5) {
    const left = 121 * sx;
    const right = 322 * sx;
    const c = Math.min(15 * sx, deep);
    path += `M${f(left)} 0V${f(deep - c)}A${f(c)} ${f(c)} 0 0 0 ${f(left + c)} ${f(deep)}H${f(right - c)}A${f(c)} ${f(c)} 0 0 0 ${f(right)} ${f(deep - c)}V0Z`;
  }
  return `path(evenodd, "${path}")`;
};

const px = (value: number) => `${value.toFixed(2)}px`;
const num = (value: number) => value.toFixed(4);

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
  const clear = (el: HTMLElement | null | undefined) => {
    const props = el && written.get(el);
    if (!el || !props) return;
    props.forEach((_, prop) => el.style.removeProperty(prop));
    written.delete(el);
  };
  return { set, clear, clearAll: () => [...written.keys()].forEach(clear) };
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

/** A float stopped where it was: its pose, read once, and that pose at any amplitude. `at(amp)` is exactly the
 *  translate, turn and scale the path keyframes give at that --amp, about the float's own origin, in the box the
 *  float shares with its fly. */
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

/** What a piece's fly adds so a held float shows at `amp` (1 as it stopped, 0 at rest). Null: nothing held. */
const settled = (still: Still | null, amp: number) => (still ? (amp > 0 ? still.at(amp).multiply(still.inverse) : still.inverse) : null);

type Piece = { el: HTMLElement; fly: HTMLElement; float: HTMLElement; art: HTMLImageElement; box: Box };

function hero(ctx: { one: SceneCtx["one"] }) {
  return ctx.one<HTMLElement>(":scope > .hero");
}

function pieces(ctx: SceneCtx) {
  const section = hero(ctx);
  const stage = ctx.one<HTMLElement>(".stage-hero", section);
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
    hero: section,
    stage,
    copy: ctx.one<HTMLElement>(".hero-copy", section),
    stats: section.querySelector<HTMLElement>(".stats-section"),
    line: section.querySelector<HTMLElement>(".through-line"),
    sheen: stage.querySelector<HTMLElement>(".ribbon-sheen"),
    ribbon: piece("ribbon"),
    laptop: piece("laptop"),
    phone: piece("phone"),
    chips: CHIPS.map((chip) => ({ ...piece(chip.name), name: chip.name, desk: chip.desk, phone: chip.phone })),
    work: ctx.one<HTMLElement>(".through-work > .work-section"),
  };
}

/** Ceru's slide, if the phone can land on it: it exists, it is the active slide, the carousel is at
 *  its start, and its centre phone shows the screen the hero phone shows. A missing `data-active`
 *  counts as 0. */
function landingSlot(work: HTMLElement) {
  const slides = work.querySelector<HTMLElement>(".slides");
  const first = slides?.querySelector<HTMLElement>(".slide");
  const img = first?.querySelector<HTMLImageElement>(".dv-phones .is-center img");
  const center = img?.closest<HTMLElement>(".dv-phone");
  if (!slides || !first || !img || !center || !HOME) return null;
  const active = Number(slides.dataset.active ?? 0);
  if ((Number.isFinite(active) ? active : 0) !== 0 || slides.scrollLeft >= 2) return null;
  if (img.getAttribute("src") !== HOME) return null;
  return {
    img,
    center,
    left: first.querySelector<HTMLElement>(".dv-phones .is-left"),
    right: first.querySelector<HTMLElement>(".dv-phones .is-right"),
  };
}

type Slot = NonNullable<ReturnType<typeof landingSlot>>;

/** Where the slide's centre phone is drawn right now, against its layout box. Its float belongs to Work
 *  (WP3): it rests until scene A lands and eases back to rest after, so the hero phone aims at the pose
 *  the phone really has instead of assuming one. */
function poseOf(el: HTMLElement): Point {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === "none") return [0, 0];
  const matrix = new DOMMatrix(transform);
  return [matrix.m41, matrix.m42];
}

type Measure = {
  /** Work's box while it is stuck at the top of the screen, and the rectangle the camera ends on. */
  R: Quad;
  /** Work is clipped to the part the screen shows: its top, at the laptop's shape. */
  clip: string;
  /** The portal's screen at rest, in screen coordinates, and the same in its own box. */
  q0: Quad;
  portalLocal: Quad;
  c0: Point;
  s0: number;
  /** Where the portal and Work end. */
  portalEnd: Quad;
  workStart: Quad;
  /** Work's pose before the first scroll: see `shoot`. */
  workIdle: string;
  phoneLocal: Quad;
  phoneStart: Quad;
  /** Chips travel this far, whatever the window. */
  peel: number;
  /** The fixed header's height: nothing flies behind the nav. */
  headerH: number;
  slot: Slot | null;
  land: Quad | null;
  /** Work's heading is stacked over its filters (1100 px wide and under, WP3): the filter row then lies on the
   *  flying phone's way down, so the phone drops to its landing height first and glides in under the row. */
  dropFirst: boolean;
};

function build(tl: Parameters<Plan["build"]>[0], ctx: SceneCtx) {
  const phonePlan = ctx.plan === "phone";
  const dom = pieces(ctx);
  const { work, stage, sheen, laptop, phone, ribbon, chips } = dom;
  const section = dom.hero;
  const css = styles();
  const state = { p: 0 };
  let m: Measure | null = null;
  let header: "clear" | "scrim" | null = null;
  let sheenPaused = false;
  let stageHeld = false;

  // The punched laptop for the desk, and Ceru's screens for the hero phone. Created here, so
  // React never meets them: HeroStage does not re-render.
  const made: HTMLElement[] = [];
  let shell: HTMLImageElement | null = null;
  let launch: HTMLImageElement | null = null;
  let home: HTMLImageElement | null = null;
  if (!phonePlan) {
    shell = picture(`${HERO_ART}/laptop-shell@2x.webp`, "el-shell");
    laptop.float.insertBefore(shell, laptop.art);
    made.push(shell);
    if (LAUNCH && HOME) {
      launch = picture(LAUNCH, "el-screen el-screen-launch");
      home = picture(HOME, "el-screen el-screen-home");
      phone.float.append(launch, home);
      made.push(launch, home);
    }
  }
  // Each chip's soft copy, for the peel: crossfaded by opacity, never an animated filter.
  const softs = chips.map((chip) => softCopy(chip.float, chip.art, chip.name, PEEL_BLUR));

  const toggle = (el: Element | null, name: string, on: boolean) => {
    if (el && el.hasAttribute(name) !== on) el.toggleAttribute(name, on);
  };
  /** The last progress drawn: a move of more than .08 in one frame (a link, a reload, a fling) is a jump. */
  let lastP = -1;
  /** Without a fine pointer the stage has no pointer depth (HeroStage), so its depth is "flying" (zero) from the
   *  start: the first frame of the flight does not restyle every piece for it. */
  const noDepth = !window.matchMedia(FINE_POINTER).matches;

  /** A float that cannot be seen (riding a move far larger than it) stops ticking. */
  const idle = (piece: Piece, on: boolean) => css.set(piece.float, "animation-play-state", on ? "paused" : "");

  /** Floats the camera needs still: paused once, so they cost nothing per frame from then on, and held at the
   *  pose they stopped in, which `settled` takes to rest through the piece's fly. Released, a float runs on from
   *  that same pose, so nothing jumps either way. */
  const stills = new Map<HTMLElement, Still>();
  const hold = (piece: Piece, on: boolean): Still | null => {
    const held = stills.get(piece.float) ?? null;
    if (on === Boolean(held)) return held;
    if (!on) {
      stills.delete(piece.float);
      css.set(piece.float, "animation-play-state", "");
      return null;
    }
    css.set(piece.float, "animation-play-state", "paused");
    const still = stillOf(piece.float);
    stills.set(piece.float, still);
    return still;
  };

  /** Puts a piece on a quad: `local` is the quad in the piece's own box, `to` in screen coordinates. `after` is a
   *  held float's settle (see `settled`), applied before the move, so a held piece lands where it would at rest. */
  const place = (piece: Piece, local: Quad, to: Quad | null, after: DOMMatrix | null = null) => {
    if (!to) {
      css.set(piece.fly, "transform", after ? after.toString() : "");
      return;
    }
    const matrix = homography(local, moveQuad(to, -piece.box.x, -piece.box.y));
    css.set(piece.fly, "transform", after ? new DOMMatrix(matrix).multiply(after).toString() : matrix);
  };

  /** A piece that keeps its place in the scene while the camera moves: it scales about the camera's
   *  centre by the zoom raised to its depth (under 1 is further away). */
  const follow = (piece: Piece, depth: number, zoom: number, centre: Point) => {
    if (!m || zoom === 1) {
      css.set(piece.fly, "transform", "");
      return;
    }
    const k = Math.pow(zoom, depth);
    const x = centre[0] + (piece.box.x - m.c0[0]) * k;
    const y = centre[1] + (piece.box.y - m.c0[1]) * k;
    css.set(piece.fly, "transform", `translate3d(${px(x - piece.box.x)}, ${px(y - piece.box.y)}, 0) scale(${num(k)})`);
  };

  /** Entrances still running when the visitor scrolls would put a piece away from its measured box: they are
   *  finished on the first scroll. Counted here, at build, so that scroll does not have to ask every piece for its
   *  animations (a style flush in the busiest frame) when, as usual, none is left. */
  const entrances = stage
    .getAnimations({ subtree: true })
    .filter((animation) => (animation as CSSAnimation).animationName?.startsWith("enter-") && animation.playState !== "finished");
  let entering = entrances.length;
  const onEntranceEnd = (event: AnimationEvent) => {
    if (event.animationName.startsWith("enter-")) entering = Math.max(0, entering - 1);
  };
  stage.addEventListener("animationend", onEntranceEnd);
  stage.addEventListener("animationcancel", onEntranceEnd);
  const settleEntrances = () => {
    if (!entering) return;
    entering = 0;
    entrances.forEach((animation) => animation.finish());
  };

  const releaseSlot = (slot: Slot | null) => {
    if (!slot) return;
    for (const el of [slot.center, slot.left, slot.right]) css.clear(el);
  };

  /** While the centre phone's pose still moves under a visible flying phone, render again next frame. */
  let pose: Point = [0, 0];
  let poseFrame = 0;
  /** The centre phone only drifts once Work has landed (WP3). It is followed from a landing until a read finds it
   *  home again; before that its pose is rest, and nothing is read. */
  let poseLive = work.hasAttribute("data-landed");
  const followPose = () => {
    poseFrame = 0;
    render(state.p);
  };

  const measure = () => {
    const VW = work.offsetWidth || document.documentElement.clientWidth;
    const VH = ctx.lvh();
    // The hero is sticky: while the scene runs, its top sits where its `top` says.
    const heroTop = parseFloat(getComputedStyle(section).top) || 0;
    for (const piece of [ribbon, laptop, phone, ...chips]) {
      const box = layoutBox(piece.el, section);
      piece.box = { x: box.x, y: box.y + heroTop, w: box.w, h: box.h };
    }
    const phoneLocal = scaleQuad(PHONE_SCREEN, phone.box.w / PHONE_NATURAL);
    const phoneStart = moveQuad(phoneLocal, phone.box.x, phone.box.y);

    const portal = phonePlan ? phone : laptop;
    const portalLocal = phonePlan ? phoneLocal : scaleQuad(LAPTOP_SCREEN, laptop.box.w / LAPTOP_NATURAL);
    const q0 = moveQuad(portalLocal, portal.box.x, portal.box.y);
    const H = phonePlan ? VH : Math.max(VH, VW / SCREEN_ASPECT);
    const R = rectQuad(0, 0, VW, H);

    const slot = phonePlan ? null : landingSlot(work);
    if (m?.slot && m.slot.center !== slot?.center) releaseSlot(m.slot);
    let land: Quad | null = null;
    if (slot) land = boxQuad(layoutBox(slot.img, work));
    const title = work.querySelector<HTMLElement>("#work-title");
    const filters = work.querySelector<HTMLElement>(".work-filters");
    let dropFirst = false;
    if (slot && title && filters) {
      const head = layoutBox(title, work);
      dropFirst = layoutBox(filters, work).y >= head.y + head.h - 1;
    }

    m = {
      R,
      clip: `inset(0 0 calc(100% - ${px(H)}) 0)`,
      q0,
      portalLocal,
      c0: centroid(q0),
      s0: quadSize(q0),
      portalEnd: phonePlan ? rectQuad(-2, -2, VW + 2, H + 2) : growQuad(R, 1.006),
      workStart: phonePlan ? q0 : growQuad(q0, 1.012),
      workIdle: homography(R, [
        [0, 0],
        [IDLE_WIDTH, 2],
        [IDLE_WIDTH, VH - 2],
        [0, VH],
      ]),
      phoneLocal,
      phoneStart,
      peel: (phonePlan ? 520 : 900) * Math.max(1, VW / 1440),
      headerH: document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0,
      slot,
      land,
      dropFirst,
    };

    const onPhone = homography(SCREEN, phoneLocal);
    css.set(launch, "transform", onPhone);
    css.set(home, "transform", onPhone);
    // The shell's opened screen is transparent, but its box would still sit over Work for a pointer or a
    // hit test: cut the screen out of the box too, in the shell's own coordinates, which never change.
    if (shell) {
      const right = (laptop.box.w + 2).toFixed(1);
      const bottom = (laptop.art.offsetHeight + 2).toFixed(1);
      const hole = portalLocal.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join("");
      css.set(shell, "clip-path", `path(evenodd, "M-2 -2H${right}V${bottom}H-2Z${hole}Z")`);
    }
    // A held float's pose is in px of a size that may just have changed: read it again.
    for (const float of stills.keys()) stills.set(float, stillOf(float));
    softs.forEach((soft) => soft.measure());
    render(state.p);
  };

  const render = (p: number) => {
    if (!m) return;
    const flying = p > 0 && p < 1;
    if (p > 0.005) settleEntrances();

    // Reads, before anything in this frame is written. The centre phone's pose, only while it can be away from
    // rest and the flying phone is near enough to need it; its float eases on its own clock, so it is followed
    // until it stops.
    if (!phonePlan && m.slot && poseLive && p >= 0.6 && p < 1) {
      const now = poseOf(m.slot.center);
      if (Math.abs(now[0] - pose[0]) + Math.abs(now[1] - pose[1]) > 0.05 && !poseFrame) poseFrame = requestAnimationFrame(followPose);
      pose = now;
      if (Math.abs(now[0]) + Math.abs(now[1]) < 0.001) poseLive = false;
    } else {
      pose = [0, 0];
    }
    if (p >= 1) poseLive = true;
    // The floats the camera needs still are held on the first frame they must be (one read each), released at
    // the top: the portal from the first scroll, the landing phone from .7.
    const landing = !phonePlan && Boolean(m.slot && m.land);
    const portalStill = hold(phonePlan ? phone : laptop, p > 0);
    const phoneStill = phonePlan ? portalStill : hold(phone, landing && p > 0.7);

    // Flags: the stage stops its pointer depth while the camera moves; loops a hold hides go quiet.
    toggle(section, "data-flight", flying);
    // Words are never left half faded where the visitor stops: each is in or out, and 20-through.css eases it
    // there. A jump lands without the ease.
    const jump = lastP < 0 || Math.abs(p - lastP) > 0.08;
    lastP = p;
    toggle(section, "data-instant", jump);
    toggle(section, "data-held", p >= 0.97);
    toggle(stage, "data-flying", p > 0 || noDepth);
    if (sheenPaused !== p > 0 && sheen) Stage.pauseLoops(sheen, (sheenPaused = p > 0));
    if (stageHeld !== p >= 0.97) Stage.pauseLoops(stage, (stageHeld = p >= 0.97));
    // On a phone the hero has already scrolled under the header, so it only clears once the copy is gone.
    const clearFrom = phonePlan ? 0.1 : 0;
    const ground = p <= clearFrom || p >= 0.8 ? null : p < 0.4 ? "clear" : "scrim";
    if (ground !== header) Stage.header((header = ground));

    // The title slide's words leave first, from their containers (their children run a CSS rise). Gone,
    // they are hidden outright: nothing invisible stays in the way of a pointer, a reader or Tab. While they leave,
    // a shield keeps the pointer off them (data-shield, 20-through.css): pointer-events would restyle their subtrees.
    const lift = seg(p, 0, 0.1) >= 0.5 ? 1 : 0;
    for (const el of [dom.copy, dom.stats]) {
      css.set(el, "transform", lift ? `translate3d(0, ${px(-36 * lift)}, 0)` : "");
      css.set(el, "opacity", lift ? num(1 - lift) : "");
      toggle(el, "data-shield", p > 0);
      toggle(el, "data-gone", lift >= 1);
    }
    const key = seg(p, 0, 0.14);
    css.set(section, "--key", key ? num(1 - key) : "");

    // Work wakes on the portal's screen. Until then it is invisible, but drawn, its own layer already painted and
    // rastered (`shoot`), so the first scroll only changes numbers. Until it lands a shield keeps the pointer off it
    // (data-shield): switching pointer-events back at the landing restyled all of Work, about 270 elements. Its
    // controls stay in the tab order, so Tab from the hero still reaches Work and lands on its finished frame.
    // The screen turns on at once and eases there (20-through.css), so a stop never leaves Work half faded on it.
    const wake = seg(p, 0.03, 0.14) >= 0.5 ? 1 : 0;
    toggle(work, "data-instant", jump);
    // On a phone the dolly ends at .86 with Work exactly on the window (renderPhone): from there it is landed, crisp
    // and live, instead of a finished picture that ignored taps and swipes for the rest of the hold.
    const done = p >= (phonePlan ? PHONE_LANDED : 1);
    css.set(work, "opacity", done ? "" : num(Math.max(WORK_IDLE, wake)));
    toggle(work, "data-shield", !done);
    css.set(work, "will-change", done ? "" : "transform, opacity");

    if (phonePlan) renderPhone(p, done, portalStill);
    else renderDesk(p, wake, done, portalStill, landing ? phoneStill : null);
  };

  /** Work's camera: its transform and the clip that keeps it to the part a screen shows. At the top of the run it
   *  waits in its warm-up strip (IDLE_WIDTH), from the first scroll it is on the portal's screen. */
  const shoot = (to: Quad, done: boolean, top: boolean, clip = m!.clip) => {
    css.set(work, "transform", done ? "" : top ? m!.workIdle : homography(m!.R, to));
    css.set(work, "clip-path", done ? "" : clip);
  };

  const renderDesk = (p: number, wake: number, done: boolean, laptopStill: Still | null, phoneStill: Still | null) => {
    if (!m) return;
    // The laptop stops floating, then its screen opens: the art fades over the punched shell.
    const still = sineInOut(seg(p, 0, 0.08));
    css.set(laptop.art, "opacity", wake ? num(1 - wake) : "");
    toggle(laptop.art, "data-gone", wake >= 1);
    // Under the art for the whole flight, so the laptop never thins while its picture eases out or back.
    css.set(shell, "opacity", p > 0 ? "1" : "");

    // The dolly: the shell grows until its screen is the window, Work grows from the screen to the page.
    // Once it is the window its bezel is past the edges, so there is nothing left to draw.
    const e = ioCubic(seg(p, 0.12, 0.82));
    const qShell = e > 0 ? dolly(m.q0, m.portalEnd, e) : m.q0;
    place(laptop, m.portalLocal, e > 0 ? qShell : null, settled(laptopStill, 1 - still));
    css.set(laptop.fly, "visibility", e >= 1 ? "hidden" : "");
    shoot(dolly(m.workStart, m.R, e), done, p <= 0);
    const zoom = e > 0 ? quadSize(qShell) / m.s0 : 1;
    const centre = e > 0 ? centroid(qShell) : m.c0;

    chipsPeel(p);
    // In at the copy's own threshold (.05), out by .40, before the phone crosses and the deck reaches the copy
    // column. The two share the column, so CSS sequences them: the line comes 160 ms after the copy starts to go,
    // and the copy comes back 160 ms after the line starts to go (20-through.css). The spec's .16 to .32 was about
    // 0.2 s at a normal wheel pace, after a half screen left empty.
    heldLine(p, [0.03, 0.07], [0.36, 0.4]);

    // The ribbon rides the laptop's own camera move, so its cut ends stay under the bezel all the way in,
    // and it goes as the screen fills the window.
    const gone = seg(p, 0.4, 0.58);
    place(ribbon, moveQuad(m.q0, -ribbon.box.x, -ribbon.box.y), e > 0 ? qShell : null);
    idle(ribbon, e > 0);
    css.set(ribbon.fly, "opacity", gone ? num(1 - gone) : "");
    css.set(ribbon.fly, "visibility", gone >= 1 ? "hidden" : "");

    // The phone wakes on Ceru's launch screen, then Home: the only bright screen on the stage. Each switches at the
    // middle of the spec's ramp and eases there in CSS (20-through.css), so a stop never shows two screens blended.
    css.set(launch, "opacity", p >= 0.11 ? "1" : "");
    css.set(home, "opacity", p >= 0.28 ? "1" : "");

    const slot = m.slot;
    if (slot && m.land) {
      // It crosses in front of everything and lands on the centre phone of Ceru's slide, still by .82.
      const settle = sineInOut(seg(p, 0.7, 0.82));
      // The slide's phones change under the flying one: their own layers, so Work is not repainted.
      for (const el of [slot.center, slot.left, slot.right]) css.set(el, "will-change", p >= 0.78 && !done ? "transform, opacity" : "");
      // Aimed at the phone's real pose once it is near.
      const near = sineInOut(seg(p, 0.6, 0.82));
      const fx = pose[0] * near;
      const fy = pose[1] * near;
      const k = ioCubic(seg(p, 0.36, 0.9));
      const target = moveQuad(m.land, fx, fy);
      let to = k > 0 ? dolly(m.phoneStart, target, k) : null;
      // With the heading stacked, the filter row lies across the phone's way: its height leads its travel (an
      // ease-out by .80, the dolly's own path keeps its size and turn), so it passes under the row, not over it.
      if (to && m.dropFirst) {
        const y0 = centroid(m.phoneStart)[1];
        const y1 = centroid(target)[1];
        const lead = 1 - Math.pow(1 - seg(p, 0.36, 0.8), 2);
        to = moveQuad(to, 0, y0 + (y1 - y0) * lead - centroid(to)[1]);
      }
      // Until it is held it floats on, even if the no-slot path below had paused it.
      if (!phoneStill) idle(phone, false);
      place(phone, m.phoneLocal, to, settled(phoneStill, 1 - settle));
      // The real phone turns solid underneath while the flying one still covers it, then the flying one
      // fades on top: one phone at every frame, never two half-transparent ones.
      const under = seg(p, 0.82, 0.84);
      const swap = seg(p, 0.86, 0.9);
      css.set(phone.fly, "opacity", swap ? num(1 - swap) : "");
      css.set(phone.fly, "visibility", swap >= 1 ? "hidden" : "");
      css.set(slot.center, "opacity", done ? "" : num(under));
      // Its two neighbours slide out from behind it once it is solid.
      const out = ioCubic(seg(p, 0.84, 0.9));
      const seen = seg(p, 0.84, 0.86);
      css.set(slot.left, "translate", done ? "" : `${((1 - out) * 72).toFixed(2)}% 0`);
      css.set(slot.right, "translate", done ? "" : `${((out - 1) * 72).toFixed(2)}% 0`);
      css.set(slot.left, "opacity", done ? "" : num(seen));
      css.set(slot.right, "opacity", done ? "" : num(seen));
    } else {
      // No slot to land on (another slide or filter): the phone leaves with the ribbon.
      follow(phone, 1.12, zoom, centre);
      idle(phone, zoom > 1);
      css.set(phone.fly, "opacity", gone ? num(1 - gone) : "");
      css.set(phone.fly, "visibility", gone >= 1 ? "hidden" : "");
    }
  };

  const renderPhone = (p: number, done: boolean, phoneStill: Still | null) => {
    if (!m) return;
    // The phone holds still and becomes the window; Work grows out of its screen.
    const still = sineInOut(seg(p, 0, 0.06));
    const e = sineInOut(seg(p, 0.06, PHONE_LANDED));
    const qPortal = e > 0 ? dolly(m.q0, m.portalEnd, e) : m.q0;
    place(phone, m.portalLocal, e > 0 ? qPortal : null, settled(phoneStill, 1 - still));
    // The screen's shape holds until the last stretch, then eases square as the screen becomes the window (one
    // clip for most of the flight, so its mask is not redrawn every frame).
    const round = 1 - sineInOut(seg(e, 0.9, 1));
    const [, , [w, h]] = m.R;
    shoot(dolly(m.workStart, m.R, e), done, p <= 0, phoneScreenClip(w, h, Number(round.toFixed(2))));
    const zoom = e > 0 ? quadSize(qPortal) / m.s0 : 1;
    const centre = e > 0 ? centroid(qPortal) : m.c0;

    // The laptop steps out to the right, the ribbon passes the camera.
    const away = ioCubic(seg(p, 0.06, 0.34));
    idle(laptop, away > 0);
    css.set(laptop.fly, "transform", away ? `translate3d(${px(420 * away)}, ${px(-60 * away)}, 0)` : "");
    const laptopGone = seg(p, 0.14, 0.34);
    css.set(laptop.fly, "opacity", laptopGone ? num(1 - laptopGone) : "");
    css.set(laptop.fly, "visibility", laptopGone >= 1 ? "hidden" : "");
    follow(ribbon, 1.1, zoom, centre);
    idle(ribbon, zoom > 1);
    // Gone before the laptop has moved far enough to uncover the band's cut ends (its ease barely starts by .15).
    const ribbonGone = seg(p, 0.05, 0.15);
    css.set(ribbon.fly, "opacity", ribbonGone ? num(1 - ribbonGone) : "");
    css.set(ribbon.fly, "visibility", ribbonGone >= 1 ? "hidden" : "");

    chipsPeel(p);
    heldLine(p, [0.12, 0.2], [0.36, 0.42]);
  };

  const chipsPeel = (p: number) => {
    if (!m) return;
    chips.forEach((chip, i) => {
      const k = ioCubic(seg(p, 0.05 + i * 0.03, 0.38 + i * 0.03));
      idle(chip, k > 0);
      // Soft as it passes the camera, blur(6k) as the spec has it, by crossfading baked copies (lib/motion/blur.ts).
      softs[i].set(k);
      if (!k) {
        css.set(chip.fly, "transform", "");
        css.set(chip.fly, "opacity", "");
        css.set(chip.fly, "visibility", "");
        return;
      }
      // To three edges of the screen, growing as they pass the camera. Scaled about their centre.
      const [dx, dy] = phonePlan ? chip.phone : chip.desk;
      const scale = 1 + 1.5 * k;
      const d = m!.peel * k;
      const x = dx * d - ((scale - 1) * chip.box.w) / 2;
      const y = dy * d - ((scale - 1) * chip.box.h) / 2;
      css.set(chip.fly, "transform", `translate3d(${px(x)}, ${px(y)}, 0) scale(${num(scale)})`);
      // A chip that rises into the fixed header dissolves there instead of passing behind the nav.
      const rest = chip.box.y + chip.box.h / 2;
      const clearOf = Math.min(rest, m!.headerH + (chip.box.h * scale) / 2 + 8);
      const below = dy < 0 && clearOf > m!.headerH + 1 ? seg(rest + dy * d, m!.headerH, clearOf) : 1;
      const shown = (1 - seg(k, 0.7, 1)) * below;
      css.set(chip.fly, "opacity", shown < 1 ? num(shown) : "");
      css.set(chip.fly, "visibility", shown <= 0 ? "hidden" : "");
    });
  };

  const heldLine = (p: number, [inFrom, inTo]: [number, number], [outFrom, outTo]: [number, number]) => {
    // In from the middle of its rise; out as soon as its exit starts, so it is gone before anything crosses it.
    const rise = seg(p, inFrom, inTo) >= 0.5 ? 1 : 0;
    const leave = seg(p, outFrom, outTo) > 0 ? 1 : 0;
    const shown = rise * (1 - leave);
    css.set(dom.line, "opacity", shown ? "1" : "");
    toggle(dom.line, "data-shown", shown > 0);
    css.set(dom.line, "transform", `translate3d(0, ${px((1 - rise) * 24 - leave * 16)}, 0)`);
  };

  // On touch the scrub follows the scroll event itself, and a frame can see several of them: the picture is
  // drawn once per frame, in the frame's own callbacks (same frame, no lag), not once per event. A fine
  // pointer's scrub already updates in GSAP's ticker.
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
    cancelAnimationFrame(poseFrame);
    stage.removeEventListener("animationend", onEntranceEnd);
    stage.removeEventListener("animationcancel", onEntranceEnd);
    m = null;
    css.clearAll();
    stills.clear();
    made.forEach((el) => el.remove());
    softs.forEach((soft) => soft.remove());
    for (const name of ["data-flight", "data-held", "data-instant"]) section.removeAttribute(name);
    for (const el of [work, dom.copy, dom.stats]) el?.removeAttribute("data-shield");
    work.removeAttribute("data-instant");
    for (const el of [dom.copy, dom.stats, laptop.art]) el?.removeAttribute("data-gone");
    dom.line?.removeAttribute("data-shown");
    stage.removeAttribute("data-flying");
    if (sheen) Stage.pauseLoops(sheen, false);
    if (stageHeld) Stage.pauseLoops(stage, false);
    if (header) Stage.header(null);
  };
}

/** The finished composition's one extra: Ceru's home screen on the hero phone, lit by CSS as Work
 *  arrives (a scroll timeline on the hero). Nothing to do without scroll timelines or with reduced motion. */
function rest(ctx: RestCtx) {
  if (!HOME || window.matchMedia(REDUCED).matches) return;
  if (typeof CSS === "undefined" || !CSS.supports("animation-timeline: view()")) return;
  const section = ctx.q<HTMLElement>(":scope > .hero")[0];
  const phone = section?.querySelector<HTMLElement>(".stage-hero .el-phone");
  const float = phone?.querySelector<HTMLElement>(".el-float");
  if (!phone || !float) return;
  const screen = picture(HOME, "el-screen el-screen-home");
  screen.dataset.rest = "";
  float.append(screen);
  ctx.onMeasure(() => {
    screen.style.transform = homography(SCREEN, scaleQuad(PHONE_SCREEN, phone.offsetWidth / PHONE_NATURAL));
  });
  return () => screen.remove();
}

const plan: Plan = { build };

const through: SceneDef = {
  id: "through",
  desk: plan,
  phone: plan,
  warm: [
    ...["ribbon", "laptop", "phone", "chip-code", "chip-cloud", "chip-spark"].map((name) => `${HERO_ART}/${name}@2x.webp`),
    `${HERO_ART}/laptop-shell@2x.webp`,
    ...[LAUNCH, HOME].filter((src): src is string => Boolean(src)),
  ],
  rest,
};

export default through;
