import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

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
for (const name of ["stone", "ribbon", "laptop", "phone", "chip-code", "chip-cloud", "chip-spark", "leaf"]) {
  assert.match(stage, new RegExp(`name: "${name}"`), `Hero stage must render the ${name} cut-out`);
  assert.ok(existsSync(new URL(`../public/img/hero/${name}.webp`, import.meta.url)), `${name}.webp must exist`);
  assert.match(css, new RegExp(`\\.el-${name} \\{[\\s\\S]*?--path: path-`), `${name} needs its own motion path`);
}
assert.doesNotMatch(stage, /scene-stage1-chaos|hero-network/, "Old hero scenes must be gone");

// Work
assert.match(work, /projects\.slice\(0, 4\)/, "Selected work shows four featured cards");
assert.match(work, /additionalProjects/, "View all must include the additional projects list");

// Motion safety
assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.curtain \{\s*display: none;/, "Reduced motion must skip the curtain");

console.log("Portfolio visual contract verified.");
