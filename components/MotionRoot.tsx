"use client";

import { useEffect, useLayoutEffect } from "react";
import { boot } from "@/lib/motion/boot";
import { PRE_PAINT } from "@/lib/motion/conditions";

/** Renders what the motion layer needs in the page and boots it once React has hydrated. */
export function MotionRoot() {
  // Strict Mode in development resets <html> to the attributes React manages, which clears what the
  // inline script set. Running that same script again restores it; a no-op in production.
  useLayoutEffect(() => {
    if (document.documentElement.classList.contains("js")) return;
    const script = document.createElement("script");
    script.textContent = PRE_PAINT;
    document.head.append(script);
    script.remove();
  }, []);

  useEffect(() => boot(), []);

  return (
    <>
      <div id="lvh-probe" aria-hidden="true" />
      <div className="wipe" aria-hidden="true" />
    </>
  );
}
