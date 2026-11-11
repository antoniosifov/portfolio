import { HERO_ART } from "@/components/HeroStage";

/** A chip that goes soft as it passes the camera, without animating a CSS filter.
 *
 *  `softCopy` lays two pre-blurred copies of the chip (baked by `node scripts/bake-graphite.mjs --blur`) over its
 *  sharp art, in the same box: one at a third of the blur, one at the full blur. `set(amount)` crossfades sharp to
 *  mid to full by opacity, linearly in blur radius, so a growing blur never shows a crisp chip inside a halo. All
 *  three are their own composited layers, so a frame only changes opacities: Chrome updates those without
 *  re-layering the page or redoing a filter. The copies blend with `plus-lighter` inside the chip's float, so each
 *  crossfade is a true mix, with no dip in opacity halfway.
 *
 *  Usage, from a scene's build (the pieces are the stage's `.el-float` and its `img.el-art`):
 *    const soft = softCopy(float, art, "chip-code");   // creates the copies, picks the blur level
 *    ctx.onMeasure(() => soft.measure());             // re-picks the level after a resize (reads layout)
 *    soft.set(k);                                     // per frame: k as in CSS blur(k * sigma px), 0..1
 *    return () => soft.remove();                      // teardown
 *
 *  `sigma` is the full blur, in CSS px of the chip as drawn (the hero's peel uses 6, the spec's `blur(6px)`). Scale
 *  the chip with a transform on an ancestor, as the stage does: the copies scale with it, like a filter would. */

export type Chip = "chip-code" | "chip-cloud" | "chip-spark";

export type SoftCopy = {
  /** The blur as a fraction of `sigma`, as in CSS `blur(amount * sigma px)`: 0 is the sharp art alone, 1 the full
   *  copy alone. Writes only opacities, and only when they change. */
  set(amount: number): void;
  /** Picks the baked level nearest to `sigma` at the art's drawn width. Reads layout: call it from onMeasure, never
   *  per frame. */
  measure(): void;
  /** Removes the copies and every style written. */
  remove(): void;
};

/** The baked full levels, as Gaussian sigma in px of the 1x cut-out, with their mid levels (a third, rounded) and
 *  the margin every copy carries (PAD sigmas on each side, so the blur is never cut). Keep in step with
 *  BLUR_LEVELS, blurMid and BLUR_PAD in scripts/bake-graphite.mjs. */
const LEVELS = [14, 22, 34];
const midOf = (level: number) => Math.round(level / 3);
const PAD = 3;
/** The 1x cut-outs' sizes (components/HeroStage.tsx). */
const NATURAL: Record<Chip, [number, number]> = {
  "chip-code": [265, 215],
  "chip-cloud": [237, 206],
  "chip-spark": [230, 185],
};

export function softCopy(float: HTMLElement, art: HTMLImageElement, chip: Chip, sigma = 6): SoftCopy {
  const [width, height] = NATURAL[chip];
  const layer = () => {
    const img = document.createElement("img");
    img.className = "el-blur";
    img.alt = "";
    img.decoding = "async";
    img.draggable = false;
    img.setAttribute("aria-hidden", "true");
    Object.assign(img.style, {
      position: "absolute",
      maxWidth: "none",
      height: "auto",
      opacity: "0",
      pointerEvents: "none",
      mixBlendMode: "plus-lighter",
      willChange: "opacity",
    });
    return img;
  };
  const mid = layer();
  const full = layer();
  art.after(mid, full);
  // The art becomes its own layer too, and the float a group of its own, so the blend only meets the art.
  art.style.willChange = "opacity";
  float.style.isolation = "isolate";

  let level = 0;
  /** Where the mid copy sits on the way, as a fraction of the full blur. */
  let stop = 1 / 3;
  let shown = -1;
  /** The opacity last written on the art, the mid copy and the full copy. On each leg of the way one of the three
   *  holds still, so a frame restyles two images, not three. */
  const written = [1, 0, 0];
  const write = (index: number, img: HTMLImageElement, weight: number) => {
    const value = Math.round(weight * 1000) / 1000;
    if (value === written[index]) return;
    written[index] = value;
    if (index === 0 && value >= 1) img.style.removeProperty("opacity");
    else img.style.opacity = String(value);
  };

  const place = (img: HTMLImageElement, sigmaSource: number) => {
    const pad = Math.round(PAD * sigmaSource);
    img.src = `${HERO_ART}/${chip}-blur${sigmaSource}.webp`;
    img.style.left = `${((-pad / width) * 100).toFixed(4)}%`;
    img.style.top = `${((-pad / height) * 100).toFixed(4)}%`;
    img.style.width = `${(((width + 2 * pad) / width) * 100).toFixed(4)}%`;
  };

  const measure = () => {
    const drawn = art.offsetWidth;
    // The blur the scene asks for, in px of the 1x cut-out; nearest full level by ratio.
    const want = drawn ? (sigma * width) / drawn : LEVELS[0];
    const next = LEVELS.reduce((best, candidate) => (Math.abs(Math.log(candidate / want)) < Math.abs(Math.log(best / want)) ? candidate : best));
    if (next === level) return;
    level = next;
    stop = midOf(next) / next;
    place(mid, midOf(next));
    place(full, next);
    const again = shown;
    shown = -1;
    if (again >= 0) set(again);
  };

  const set = (amount: number) => {
    const next = Math.round(Math.min(1, Math.max(0, amount)) * 1000) / 1000;
    if (next === shown) return;
    shown = next;
    // Sharp to mid up to the stop, then mid to full: linear in blur radius, and the weights always sum to one.
    const toMid = next <= stop ? next / stop : 1;
    const toFull = next <= stop ? 0 : (next - stop) / (1 - stop);
    write(0, art, 1 - toMid);
    write(1, mid, toMid - toFull);
    write(2, full, toFull);
  };

  measure();
  return {
    set,
    measure,
    remove() {
      mid.remove();
      full.remove();
      art.style.removeProperty("opacity");
      art.style.removeProperty("will-change");
      float.style.removeProperty("isolation");
    },
  };
}
