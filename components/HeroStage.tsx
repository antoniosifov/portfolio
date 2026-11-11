"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef } from "react";

/** The folder the hero art is read from: the one constant that swaps, or reverts, the whole set. */
export const HERO_ART = "/img/hero/graphite";

/** Paint order is back to front. Width and height are the intrinsic pixels of
 *  each cut-out, so the browser reserves the right box before the file lands. */
const elements = [
  { name: "ribbon", width: 1396, height: 717 },
  { name: "laptop", width: 868, height: 518 },
  { name: "phone", width: 267, height: 467 },
  { name: "chip-code", width: 265, height: 215 },
  { name: "chip-cloud", width: 237, height: 206 },
  { name: "chip-spark", width: 230, height: 185 },
] as const;

const sheenMask = { "--sheen-mask": `url("${HERO_ART}/ribbon.webp")` } as CSSProperties;

/** Every element floats on its own CSS path; this only adds the pointer depth
 *  on top and stops all of it while the stage is off screen. A scene that flies
 *  the pieces sets `data-flying` on the stage, which brings the depth back to zero. */
export function HeroStage({ variant = "hero" }: { variant?: "hero" | "finale" }) {
  const ref = useRef<HTMLDivElement>(null);
  const finale = variant === "finale";

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

    const isFlying = () => node.dataset.flying !== undefined;

    const onMove = (event: PointerEvent) => {
      if (isFlying()) return;
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    // A scene that flies the pieces takes the depth to zero in one write: the stage's own CSS eases the pieces there
    // (20-through.css for the hero). Easing it from here would restyle every piece on every frame of the flight's
    // first second, the busiest frames of the scroll.
    const flight = new MutationObserver(() => {
      if (!isFlying()) return;
      cancelAnimationFrame(frame);
      frame = 0;
      targetX = targetY = 0;
      if (!x && !y) return;
      x = y = 0;
      node.style.setProperty("--mx", "0");
      node.style.setProperty("--my", "0");
    });
    flight.observe(node, { attributes: true, attributeFilter: ["data-flying"] });

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      visibility.disconnect();
      flight.disconnect();
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={`stage stage-${variant}`} aria-hidden="true">
      {elements.map((element) => {
        // The last frame's laptop has his portrait baked in, already at flight resolution.
        const baked = finale && element.name === "laptop";
        return (
          <div key={element.name} className={`el el-${element.name}`}>
            <div className="el-fly">
              <div className="el-float">
                <img
                  className="el-art"
                  src={`${HERO_ART}/${baked ? "laptop-anton@2x" : element.name}.webp`}
                  alt=""
                  width={element.width}
                  height={element.height}
                  loading={finale ? "lazy" : undefined}
                  decoding={finale ? "async" : "sync"}
                  fetchPriority={!finale && (element.name === "laptop" || element.name === "ribbon") ? "high" : "auto"}
                  draggable={false}
                  data-master={baked ? undefined : `${HERO_ART}/${element.name}@2x.webp`}
                />
                {element.name === "ribbon" ? <span className="ribbon-sheen" style={sheenMask} /> : null}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
