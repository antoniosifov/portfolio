import { DESK, PHONE } from "./conditions";
import { Stage, type SceneDef } from "./stage";

/** Keeps the reader's place when the window changes size, or the plan changes under the reader (reduced motion
 *  switched on or off while the tab is open).
 *
 *  A resize moves everything below the runways (their heights are screens of scroll), and a resize that crosses a
 *  plan boundary rebuilds the scenes: gsap.matchMedia kills the last ScrollTrigger, which wipes ScrollTrigger's
 *  memory of the scroll position, and its refresh then leaves the page at 0. So the place is recorded here while
 *  the visitor reads (after each scroll comes to rest) and put back by hand once the new layout stands: after every
 *  ScrollTrigger refresh while a resize is in progress (runtime.ts calls `afterRefresh`), and once more when the
 *  resize is over. Without the runtime (reduced motion, calm, rest-only windows) the timer alone does it.
 *
 *  The place is one of:
 *  - a scene's progress, while a live scene holds the screen (its picture is a function of progress, not of px);
 *  - the element nearest under the header and its distance from the top of the window;
 *  - the top of the page. */

type SceneId = SceneDef["id"];
type Anchor =
  | { kind: "top"; r: number }
  | { kind: "scene"; id: SceneId; p: number; r: number }
  | { kind: "el"; el: Element; offset: number; r: number };

const SCENES: SceneId[] = ["through", "handwriting", "pullback"];
/** A plan can also change with no resize at all: reduced motion switched on or off while the tab is open. */
const PLAN_QUERIES = ["(prefers-reduced-motion: reduce)", DESK, PHONE];
const CANDIDATES = "main :is(h1, h2, h3, p, li, .card, .scene-tall, .dv-set)";
const RECORD_AFTER_MS = 120;
const RESIZE_DONE_MS = 450;
/** Phones resize the window as the toolbar slides away. That is not a new layout, and putting the place back
 *  there would fight the finger (ScrollTrigger ignores the same change with ignoreMobileResize). */
const TOOLBAR_SHARE = 0.25;

let restoreNow: (() => void) | null = null;

/** Called by the runtime after each ScrollTrigger refresh, last, once the scenes have re-measured. */
export function afterRefresh() {
  restoreNow?.();
}

const scrollPad = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

function span(id: SceneId) {
  const trigger = Stage.trigger(id);
  return trigger && trigger.end > trigger.start ? { start: trigger.start, end: trigger.end } : null;
}

function jump(top: number) {
  window.scrollTo({ top: Math.max(0, Math.round(top)), behavior: "instant" });
  Stage.settle();
}

/** Where a resting scene's place goes: the marker of the frame nearest to its progress. Scene A belongs to Work once
 *  the hero's last words have left (.36): from there on the screen is Work coming in. */
function restingScene(id: SceneId, p: number) {
  const selector = id === "through" ? (p < 0.36 ? null : "#work") : id === "pullback" ? (p < 0.5 ? "#about" : "#contact") : ".icu";
  const target = selector ? document.querySelector(selector) : null;
  return target ? target.getBoundingClientRect().top + window.scrollY - scrollPad() : 0;
}

function ratio() {
  return window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
}

function record(): Anchor {
  const y = window.scrollY;
  const r = ratio();
  if (y < 1) return { kind: "top", r };
  for (const id of SCENES) {
    const s = span(id);
    if (s && y >= s.start - 1 && y <= s.end + 1) return { kind: "scene", id, p: Math.min(1, Math.max(0, (y - s.start) / (s.end - s.start))), r };
  }

  // Only what is laid out in place right now: nothing in a layer a live scene holds stuck or moves.
  const through = span("through");
  const handwriting = span("handwriting");
  const pullback = span("pullback");
  const skip = (el: Element) =>
    (through && ((y > through.start + 1 && el.closest(".through > .hero")) || (y < through.end - 1 && el.closest(".through-work")))) ||
    (handwriting && el.closest(".scene-tall .scene-stage")) ||
    (pullback && (el.closest(".finale-contact") || (y > pullback.start + 1 && el.closest(".finale-about"))));

  const line = scrollPad();
  const bottom = window.innerHeight;
  let below: { el: Element; top: number } | null = null;
  let across: { el: Element; top: number } | null = null;
  for (const el of document.querySelectorAll(CANDIDATES)) {
    const box = el.getBoundingClientRect();
    if (box.height <= 0 || box.width <= 0 || box.bottom <= line || box.top >= bottom || box.right <= 0 || box.left >= window.innerWidth) continue;
    const top = box.top;
    if (top >= line - 1 ? below && below.top <= top : across && across.top >= top) continue;
    if (skip(el) || el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true }) === false) continue;
    if (top >= line - 1) below = { el, top };
    else across = { el, top };
  }
  const pick = below ?? across;
  return pick ? { kind: "el", el: pick.el, offset: Math.min(pick.top, bottom - 60), r } : { kind: "top", r: y < 1 ? 0 : r };
}

function restore(anchor: Anchor) {
  if (anchor.kind === "top") {
    jump(anchor.r > 0 ? anchor.r * (document.documentElement.scrollHeight - window.innerHeight) : 0);
    return;
  }
  if (anchor.kind === "scene") {
    const s = span(anchor.id);
    jump(s ? s.start + anchor.p * (s.end - s.start) : restingScene(anchor.id, anchor.p));
    return;
  }

  const { el, offset } = anchor;
  if (!el.isConnected) {
    jump(anchor.r * (document.documentElement.scrollHeight - window.innerHeight));
    return;
  }
  const through = span("through");
  const handwriting = span("handwriting");
  const pullback = span("pullback");
  // A layer a live scene holds is measured where it stands still: the hero at the top, Work where it has landed,
  // About where the pull-back begins. The finished frames are where those layers come to rest.
  if (pullback && el.closest(".finale-contact")) return jump(pullback.end);
  const where = () => el.getBoundingClientRect().top + window.scrollY - offset;
  if (through && el.closest(".through > .hero")) {
    jump(0);
    return jump(Math.min(where(), through.start));
  }
  if (handwriting && el.closest(".scene-tall .scene-stage")) {
    jump(handwriting.start);
    const y = where();
    return jump(y > handwriting.start ? handwriting.end : y);
  }
  if (through && el.closest(".through-work")) {
    jump(through.end);
    return jump(Math.max(where(), through.end));
  }
  if (pullback && el.closest(".finale-about")) {
    jump(pullback.start);
    return jump(Math.min(where(), pullback.start));
  }
  jump(where());
  // Once more, in case the jump itself moved what lies above (a one-shot that changes height on arrival).
  const off = el.getBoundingClientRect().top - offset;
  if (Math.abs(off) > 2) jump(window.scrollY + off);
}

export function startPlace(): () => void {
  const touch = window.matchMedia("(pointer: coarse)").matches && navigator.maxTouchPoints > 0;
  let anchor: Anchor | null = null;
  let width = window.innerWidth;
  let height = window.innerHeight;
  let resizing = false;
  let recordTimer = 0;
  let doneTimer = 0;

  const take = () => {
    // A size this keeper has not settled yet means the layout already moved under the reader: keep the old place.
    if (resizing || window.innerWidth !== width || window.innerHeight !== height) return;
    anchor = record();
  };
  const later = () => {
    window.clearTimeout(recordTimer);
    recordTimer = window.setTimeout(take, RECORD_AFTER_MS);
  };
  const put = () => {
    if (anchor) restore(anchor);
  };
  const done = () => {
    // Make sure ScrollTrigger has the new positions before they are used; that refresh puts the place back too.
    if (!Stage.refreshNow()) put();
    resizing = false;
    restoreNow = null;
    width = window.innerWidth;
    height = window.innerHeight;
    later();
  };
  /** Stops recording, puts the place back after each ScrollTrigger refresh, and once more when things are still. */
  const begin = () => {
    resizing = true;
    restoreNow = put;
    window.clearTimeout(recordTimer);
    window.clearTimeout(doneTimer);
    doneTimer = window.setTimeout(done, RESIZE_DONE_MS);
  };
  const onResize = () => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!resizing && touch && w === width && Math.abs(h - height) <= h * TOOLBAR_SHARE) {
      height = h;
      return;
    }
    if (w === width && h === height && !resizing) return;
    begin();
  };
  const onScroll = () => {
    if (!resizing) later();
  };

  anchor = record();
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  // A plan change reverts the scenes through gsap.matchMedia, whose refresh leaves the page at 0, the same as a resize
  // across a plan boundary. These lists are made here, before the runtime makes its own, so their change events run
  // first and `restoreNow` is already set when that refresh reports back.
  const plans = PLAN_QUERIES.map((query) => window.matchMedia(query));
  plans.forEach((list) => list.addEventListener("change", begin));
  return () => {
    window.clearTimeout(recordTimer);
    window.clearTimeout(doneTimer);
    restoreNow = null;
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    plans.forEach((list) => list.removeEventListener("change", begin));
  };
}
