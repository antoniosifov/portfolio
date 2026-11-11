type OnceOptions = {
  /** Default fires when the element's top is 88% of the way down the viewport. */
  rootMargin?: string;
  threshold?: number;
  onIn: (el: Element) => void;
};

/** Runs `onIn` the first time `el` comes into view, then stops watching. Returns a cancel. */
export function once(el: Element, { rootMargin = "0px 0px -12% 0px", threshold = 0, onIn }: OnceOptions): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onIn(el);
    return () => {};
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      onIn(el);
    },
    { rootMargin, threshold },
  );
  observer.observe(el);
  return () => observer.disconnect();
}
