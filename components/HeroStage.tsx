"use client";

import { useEffect, useRef } from "react";

/** Paint order is back to front. Width and height are the intrinsic pixels of
 *  each cut-out, so the browser reserves the right box before the file lands. */
const elements = [
  { name: "stone", width: 944, height: 159 },
  { name: "ribbon", width: 1396, height: 717 },
  { name: "laptop", width: 868, height: 518 },
  { name: "phone", width: 267, height: 467 },
  { name: "chip-code", width: 265, height: 215 },
  { name: "chip-cloud", width: 237, height: 206 },
  { name: "chip-spark", width: 230, height: 185 },
  { name: "leaf", width: 552, height: 244 },
] as const;

/** Every element floats on its own CSS path; this only adds the pointer depth
 *  on top and stops all of it while the hero is off screen. */
export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const visibility = new IntersectionObserver(([entry]) => {
      node.toggleAttribute("data-paused", !entry.isIntersecting);
    });
    visibility.observe(node);

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (calm || !fine) return () => visibility.disconnect();

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;

    const tick = () => {
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      node.style.setProperty("--mx", x.toFixed(4));
      node.style.setProperty("--my", y.toFixed(4));
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      visibility.disconnect();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className="stage" aria-hidden="true">
      <div className="stage-shadow" />
      {elements.map((element) => (
        <div key={element.name} className={`el el-${element.name}`}>
          <div className="el-float">
            <img
              src={`/img/hero/${element.name}.webp`}
              alt=""
              width={element.width}
              height={element.height}
              decoding="sync"
              fetchPriority={element.name === "laptop" || element.name === "ribbon" ? "high" : "auto"}
              draggable={false}
            />
            {element.name === "ribbon" ? <span className="ribbon-sheen" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
