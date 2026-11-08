"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

/** Content is visible in the server HTML. Only after hydration does a section
 *  that is still below the fold get hidden, so a failed script can never leave
 *  the page blank, and nothing already on screen disappears. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    if (node.getBoundingClientRect().top < window.innerHeight) return;

    setHidden(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8%", threshold: 0.08 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${hidden ? "is-hidden" : ""} ${className}`.trim()}>
      {children}
    </div>
  );
}
