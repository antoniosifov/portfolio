import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projects = readFileSync(new URL("../components/Projects.tsx", import.meta.url), "utf8");
const heroScene = readFileSync(new URL("../components/HeroScene.tsx", import.meta.url), "utf8");
const portfolioData = readFileSync(new URL("../data/portfolio.ts", import.meta.url), "utf8");

assert.match(projects, /slice\(0,\s*3\)/, "Ceru showcase must render three screenshots");
assert.match(projects, /is-left/, "Ceru showcase must include a left phone slot");
assert.match(projects, /is-center/, "Ceru showcase must include a center phone slot");
assert.match(projects, /is-right/, "Ceru showcase must include a right phone slot");
assert.match(
  portfolioData,
  /ceru-home\.webp[\s\S]*ceru-launch\.webp[\s\S]*ceru-analytics\.webp/,
  "Ceru showcase must use the three production screenshots from Forma in the intended order",
);

assert.match(heroScene, /hero-network/, "Hero must render the network background");
assert.doesNotMatch(heroScene, /scene-stage1-chaos/, "Hero must not load the old photographic sequence");

console.log("Portfolio visual contract verified.");
