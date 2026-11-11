"use client";

import { useEffect } from "react";
import { startCircuit } from "@/lib/quiet/circuit";

/** The circuit motif, one drawing down the page. It draws into the sections marked `data-circuit` (Hero,
 *  Experience, Education, Skills, About) as inline SVG that scrolls with them: a quiet trace in the hero, then at
 *  every seam a trace from the last cards of the section above to the next heading, each drawn once as its seam
 *  comes up the window. Every line keeps clear of words and cards, and there is no animation loop: the pointer
 *  lights the traces near it and a press sends a pulse along them. Nothing is rendered here; without script the
 *  page simply has no traces. */
export function CircuitField() {
  useEffect(() => startCircuit(), []);
  return null;
}
