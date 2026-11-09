import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const page = read("app/page.tsx");
const css = read("app/globals.css");
const logo = read("components/Logo.tsx");
const intro = read("components/Intro.tsx");
const hero = read("components/Hero.tsx");
const stage = read("components/HeroStage.tsx");
const work = read("components/WorkShowcase.tsx");

// Brand
assert.match(logo, /viewBox="0 0 696 527"/, "Logo must render the traced AI monogram");
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
assert.match(work, /dv-laptop/, "Selected work must show projects on a laptop");
assert.match(work, /dv-phones/, "Mobile products must show a set of phones");
const wording = read("components/Header.tsx") + hero + read("components/About.tsx") + read("components/Contact.tsx");
assert.doesNotMatch(wording, /Available for projects|client projects|build something together/, "Copy must speak to employers, not clients");
assert.match(work, /additionalProjects/, "View all must include the additional projects list");

// Palette: every text colour must stay readable on the page background
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const token = (name) => css.match(new RegExp(`--${name}: (#[0-9a-f]{6});`))[1];
for (const name of ["ink", "ink-2", "muted", "olive-700", "bronze"]) {
  assert.ok(contrast(token(name), token("bg")) >= 4.5, `--${name} must reach 4.5:1 on the page background`);
}
assert.ok(contrast("#ffffff", token("olive")) >= 4.5, "White text must reach 4.5:1 on the primary button");

// Content must be readable before and without hydration
assert.doesNotMatch(css, /\.reveal \{[^}]*opacity: 0/, "Reveal must not hide content by default");

assert.doesNotMatch(css, /background-clip: text/, "Headings use solid colour, not gradient text");

// Each project appears in one place only
const data = read("data/portfolio.ts");
const compactTitles = [...data.slice(data.indexOf("export const compactProjects"), data.indexOf("export const additionalProjects")).matchAll(/title: "([^"]+)"/g)].map((match) => match[1]);
const showcased = [...data.matchAll(/shortTitle: "([^"]+)",[\s\S]*?(?=index: "|export const)/g)].filter((match) => /cover: "/.test(match[0])).map((match) => match[1]);
for (const title of compactTitles) assert.ok(!showcased.includes(title), `${title} must not repeat in the carousel and the cards`);

// Privacy: originals with personal data must never be published
const published = readdirSync(new URL("../public/", import.meta.url), { recursive: true }).map(String);
assert.ok(!published.some((file) => file.toLowerCase().endsWith(".pdf")), "PDF originals must not be published");

// Motion safety
assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]*\.curtain \{\s*display: none;/, "Reduced motion must skip the curtain");

console.log("Portfolio visual contract verified.");
