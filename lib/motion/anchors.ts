import { PHONE, PHONE_LANDED, REDUCED } from "./conditions";
import { lvh, Stage } from "./stage";

const SMOOTH_SCREENS = 1.5;
const WIPE_MS = 180;
const WIPE_HOLD_MS = 60;
const WIPE_EASE = "cubic-bezier(.76,0,.24,1)"; // --ease-in-out

const scrollPad = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** A live scene's scroll range, from the rail in the page. Null while the scene is at rest. `done` is where its
 *  layer is finished: the end of the run, except scene A on the PHONE plan, whose Work is landed from PHONE_LANDED. */
function liveSpan(id: "through" | "pullback") {
  const rail = document.querySelector<HTMLElement>(`.scene[data-scene="${id}"].is-live`);
  if (!rail) return null;
  const box = rail.getBoundingClientRect();
  const start = box.top + window.scrollY;
  const end = start + box.height - lvh();
  const landed = id === "through" && window.matchMedia(PHONE).matches ? PHONE_LANDED : 1;
  return { start, end, done: start + (end - start) * landed };
}

function jump(top: number) {
  window.scrollTo({ top, behavior: "instant" });
  Stage.settle();
}

/** In-page links under the fixed header. A short hop scrolls; a long one is hidden by a wipe, because
 *  a smooth scroll across a scrubbed scene plays it at twenty times speed. The URL and focus follow. */
export function startAnchors(): () => void {
  let wiping = false;
  let arriving = false;

  const arrive = (id: string, target: HTMLElement) => {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);
    const heading = document.getElementById(id === "top" ? "hero-title" : `${id}-title`) ?? (target.classList.contains("run-mark") ? null : target);
    if (!heading) return;
    heading.setAttribute("tabindex", "-1");
    arriving = true;
    heading.focus({ preventScroll: true });
    arriving = false;
  };

  const wipeTo = async (top: number, arrived: () => void) => {
    const wipe = document.querySelector<HTMLElement>(".wipe");
    if (!wipe) {
      jump(top);
      arrived();
      return;
    }
    wiping = true;
    const direction = top > window.scrollY ? 1 : -1;
    wipe.style.visibility = "visible";
    const entering = wipe.animate([{ transform: `translateY(${direction * 100}%)` }, { transform: "none" }], { duration: WIPE_MS, easing: WIPE_EASE, fill: "both" });
    await entering.finished.catch(() => {});
    jump(top);
    arrived();
    await wait(WIPE_HOLD_MS);
    const leaving = wipe.animate([{ transform: "none" }, { transform: `translateY(${direction * -100}%)` }], { duration: WIPE_MS, easing: WIPE_EASE, fill: "both" });
    await leaving.finished.catch(() => {});
    entering.cancel();
    leaving.cancel();
    wipe.style.visibility = "";
    wiping = false;
  };

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    if (!link || link.classList.contains("skip-link")) return;
    const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    if (wiping) return;
    // The new history entry is made before the page moves: the browser files the scroll position under the entry
    // being left, so the back button returns to where the visitor clicked, not to where the link landed.
    if (window.location.hash !== `#${id}`) window.history.pushState(null, "", `#${id}`);

    const top =id === "top" ? 0 : Math.max(0, target.getBoundingClientRect().top + window.scrollY - scrollPad());
    const arrived = () => arrive(id, target);
    if (window.matchMedia(REDUCED).matches) {
      jump(top);
      arrived();
    } else if (Math.abs(top - window.scrollY) <= SMOOTH_SCREENS * window.innerHeight) {
      window.scrollTo({ top, behavior: "smooth" });
      arrived();
    } else {
      void wipeTo(top, arrived);
    }
  };

  /** Tab must always land on something visible, so focus inside a layer a scene is holding back
   *  jumps to the point where that layer is finished. */
  const onFocusIn = (event: FocusEvent) => {
    if (arriving || !(event.target instanceof Element)) return;
    const el = event.target;
    const through = liveSpan("through");
    if (through) {
      if (el.closest(".work-section")) {
        if (window.scrollY < through.done - 1) jump(through.end);
        return;
      }
      if (el.closest(".hero")) {
        if (window.scrollY > through.start + 1) jump(0);
        return;
      }
    }
    if (!el.closest(".finale-contact")) return;
    const pullback = liveSpan("pullback");
    if (pullback && window.scrollY < pullback.end - 1) jump(pullback.end);
  };

  // Back and forward are the browser's own jump: only the scrub needs catching up.
  const onHashChange = () => requestAnimationFrame(() => Stage.settle());

  document.addEventListener("click", onClick);
  document.addEventListener("focusin", onFocusIn);
  window.addEventListener("hashchange", onHashChange);

  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("focusin", onFocusIn);
    window.removeEventListener("hashchange", onHashChange);
  };
}
