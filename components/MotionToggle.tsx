"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icons";

const KEY = "motion-paused";

/** The page has endless decorative motion, so it needs a visible way to stop it.
 *  The attribute lives on <html> because the motion spans several sections. */
export function MotionToggle() {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(KEY) === "1") setPaused(true);
    } catch {
      // Storage can be blocked; the toggle still works for this visit.
    }
  }, []);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-motion-paused", paused);
  }, [paused]);

  const toggle = () => {
    const next = !paused;
    setPaused(next);
    try {
      window.localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      // See above.
    }
  };

  return (
    <button
      type="button"
      className="motion-toggle"
      aria-pressed={paused}
      aria-label={paused ? "Play background animation" : "Pause background animation"}
      onClick={toggle}
    >
      <Icon name={paused ? "play" : "pause"} size={16} />
    </button>
  );
}
