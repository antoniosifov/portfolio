import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const page = read("app/page.tsx");
const css = read("app/globals.css");
const logo = read("components/Logo.tsx");
const intro = read("components/Intro.tsx");
const hero = read("components/Hero.tsx");
const stage = read("components/HeroStage.tsx");
const work = read("components/Work.tsx");

// Brand
assert.match(logo, /viewBox="0 0 120 100"/, "Logo must render the ΛI monogram on its 120x100 grid");
assert.match(intro, /className="curtain"/, "Intro must render the brand curtain");
assert.match(css, /@keyframes curtain-up/, "Curtain must lift with the curtain-up animation");
assert.match(page, /<Intro \/>/, "Home page must open with the curtain");

// Hero
assert.match(hero, /solve real problems\./, "Hero headline must keep the approved copy");
assert.match(stage, /<Ring part="back" \/>[\s\S]*<Ring part="front" \/>/, "Hero stage must draw the ring behind and in front of the devices");
assert.match(stage, /className="laptop"[\s\S]*className="phone"/, "Hero stage must show the laptop and the phone");
assert.doesNotMatch(stage, /scene-stage1-chaos|hero-network/, "Old hero scenes must be gone");

// Work
assert.match(work, /projects\.slice\(0, 4\)/, "Selected work shows four featured cards");
assert.match(work, /additionalProjects/, "View all must include the additional projects list");

// Motion safety
assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.curtain \{\s*display: none;/, "Reduced motion must skip the curtain");

console.log("Portfolio visual contract verified.");
