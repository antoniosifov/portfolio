import { REDUCED } from "@/lib/motion/conditions";
import { startHand } from "./hand";
import { startPrint } from "./print";
import { startReveals } from "./reveal";

/** Entry of the quiet layer, called by `boot`. Returns its teardown.
 *
 *  Every hidden starting state in 50-career.css hangs on `html.quiet`, which only exists while this layer
 *  runs: if the script never arrives, nothing waits for it. Whatever is already on screen when it starts is
 *  marked finished first, so a reveal never hides something the visitor is looking at. */
export function initQuiet(): () => void {
  const html = document.documentElement;
  const reduced = window.matchMedia(REDUCED).matches;
  const stops = [startReveals(reduced), startHand(reduced), startPrint()];
  html.classList.add("quiet");
  return () => {
    stops.forEach((stop) => stop());
    html.classList.remove("quiet");
  };
}
