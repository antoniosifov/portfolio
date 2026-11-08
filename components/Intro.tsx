"use client";

import { useEffect, useState } from "react";
import { Mark } from "./Logo";

/** Brand curtain: the page opens behind the monogram, then the curtain lifts.
 *  Removed from the DOM once its exit animation ends; skipped entirely when the
 *  visitor prefers reduced motion. A timer backstops the animationend event so a
 *  throttled background tab can never leave the curtain stuck in place. */
export function Intro() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGone(true);
      return;
    }
    const timer = window.setTimeout(() => setGone(true), 3200);
    return () => window.clearTimeout(timer);
  }, []);

  if (gone) return null;

  return (
    <div
      className="curtain"
      aria-hidden="true"
      onAnimationEnd={(event) => {
        if (event.animationName === "curtain-up") setGone(true);
      }}
    >
      <div className="curtain-logo">
        <Mark className="curtain-mark" />
        <span className="curtain-divider" />
        <span className="curtain-name">Anton Iosifov</span>
      </div>
    </div>
  );
}
