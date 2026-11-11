import type { ReactNode } from "react";

/** The runway around About and Contact. Each link lands on a marker: About at the start of the
 *  pull-back, Contact at its end. */
export function Finale({ about, contact }: { about: ReactNode; contact: ReactNode }) {
  return (
    <div className="finale">
      <section className="scene scene-rail" data-scene="pullback" aria-hidden="true" />
      <span id="about" className="run-mark" data-chapter-mark="about" aria-hidden="true" />
      <div className="finale-about">{about}</div>
      <span id="contact" className="run-mark" data-chapter-mark="contact" aria-hidden="true" />
      <div className="finale-contact">{contact}</div>
    </div>
  );
}
