import type { SceneDef } from "@/lib/motion/stage";
import handwriting from "./handwriting";
import pullback from "./pullback";
import through from "./through";

/** Scene modules are in the graph of the boot path too, for `rest()`, so they must never import GSAP
 *  by value. A scene gets it from its context: `ctx.gsap`, `ctx.ScrollTrigger`. */
export const scenes: Record<string, SceneDef> = { through, handwriting, pullback };
