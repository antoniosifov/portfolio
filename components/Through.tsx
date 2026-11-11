import type { ReactNode } from "react";
import { HERO_HEIGHT } from "@/lib/motion/conditions";

/** The runway around Hero and Work. The rail is what scene A's scroll is measured on, and `#work` is
 *  a marker at the end of the run, so a link to Work lands on the finished frame. */
export function Through({ hero, work }: { hero: ReactNode; work: ReactNode }) {
  return (
    <div className="through" suppressHydrationWarning>
      <section className="scene scene-rail" data-scene="through" aria-hidden="true" />
      {hero}
      {/* Executed by the parser on the server-rendered page; inert when React renders it on the client. */}
      <script type={typeof window === "undefined" ? "text/javascript" : "text/plain"} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: HERO_HEIGHT }} />
      <span id="work" className="run-mark" data-chapter-mark="work" aria-hidden="true" />
      <div className="through-work">
        {work}
        <div className="through-tail" aria-hidden="true" />
      </div>
    </div>
  );
}
