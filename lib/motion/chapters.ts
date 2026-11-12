/** Fires on `window` when the chapter changes. `detail.chapter` is a `data-chapter-mark` value. */
export type ChapterEvent = CustomEvent<{ chapter: string }>;

const LINE = 0.4;
const FIRST_CHAPTER = "top";

let lastY = 0;
let following = false;

/** The page's scroll position as the last scroll event found it. It is read once, first thing in that event (a
 *  capture listener on the window runs before every other scroll listener), while nothing in the frame has been
 *  written yet; everyone else who only needs the number uses this. Each read of `window.scrollY` after a write forces
 *  the browser to restyle and lay out on the spot: the chapter line and the header each did that in every scrolled
 *  frame, after the scenes' scroll triggers had written. */
export function lastScrollY(): number {
  if (!following && typeof window !== "undefined") {
    following = true;
    lastY = window.scrollY;
    window.addEventListener(
      "scroll",
      (event) => {
        // Capturing on the window also hears every scrolling element (the carousel): only the page counts.
        if (event.target === document) lastY = window.scrollY;
      },
      { capture: true, passive: true },
    );
  }
  return lastY;
}

/** Keeps `html[data-chapter]` on the last `[data-chapter-mark]` above 40% of the viewport. The marks'
 *  positions are cached and refreshed only when the page's layout changes, so the scroll handler
 *  reads nothing from layout on the frames the scenes are busiest. */
export function startChapters(): () => void {
  const html = document.documentElement;
  let marks: { id: string; top: number }[] = [];
  let current = "";
  let queued = 0;
  // The scroll position comes from the scroll event, before the frame's scene writes (lastScrollY), and the window's
  // height from resize. Read in the animation frame instead, after the scenes had written, it forced a whole style
  // and layout pass in the middle of every frame of scene A.
  let pageY = window.scrollY;
  let viewH = window.innerHeight;

  const update = () => {
    queued = 0;
    const line = pageY + viewH * LINE;
    let next = FIRST_CHAPTER;
    for (const mark of marks) if (mark.top <= line) next = mark.id;
    if (next === current) return;
    current = next;
    html.dataset.chapter = next;
    window.dispatchEvent(new CustomEvent("chapter", { detail: { chapter: next } }));
  };

  const measure = () => {
    pageY = window.scrollY;
    viewH = window.innerHeight;
    marks = [...document.querySelectorAll<HTMLElement>("[data-chapter-mark]")].map((el) => ({
      id: el.dataset.chapterMark ?? FIRST_CHAPTER,
      top: el.getBoundingClientRect().top + pageY,
    }));
    update();
  };

  const onScroll = () => {
    pageY = lastScrollY();
    if (!queued) queued = requestAnimationFrame(update);
  };

  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", measure);
  window.addEventListener("work:changed", measure);
  const layout = new ResizeObserver(measure);
  const main = document.querySelector("main");
  if (main) layout.observe(main);

  return () => {
    cancelAnimationFrame(queued);
    layout.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", measure);
    window.removeEventListener("work:changed", measure);
    delete html.dataset.chapter;
  };
}
