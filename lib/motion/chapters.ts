/** Fires on `window` when the chapter changes. `detail.chapter` is a `data-chapter-mark` value. */
export type ChapterEvent = CustomEvent<{ chapter: string }>;

const LINE = 0.4;
const FIRST_CHAPTER = "top";

/** Keeps `html[data-chapter]` on the last `[data-chapter-mark]` above 40% of the viewport. The marks'
 *  positions are cached and refreshed only when the page's layout changes, so the scroll handler
 *  reads nothing from layout on the frames the scenes are busiest. */
export function startChapters(): () => void {
  const html = document.documentElement;
  let marks: { id: string; top: number }[] = [];
  let current = "";
  let queued = 0;
  // The scroll position is read in the scroll event, before the frame's scene writes, and the window's height
  // on resize. Read in the animation frame instead, after the scenes had written, it forced a whole style and
  // layout pass in the middle of every frame of scene A.
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
    pageY = window.scrollY;
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
