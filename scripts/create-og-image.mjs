// Takes the share card from the live hero, once, by hand, with the dev server running:
//   node scripts/create-og-image.mjs [url]
// Writes public/og-image.png, which is committed; CI never runs this. The card is a screenshot, so it can
// never drift from the site: real art, real headline, header reduced to the lockup, nothing else.
//
// Needs Chrome, through the design-taste-frontend skill's CDP client. A local tool only.
import { homedir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const { Browser } = await import(pathToFileURL(join(homedir(), ".claude/skills/design-taste-frontend/scripts/lib/cdp.mjs")).href);

const URL_TO_SHOOT = process.argv[2] ?? "http://localhost:3457/";
const OUTPUT = fileURLToPath(new URL("../public/og-image.png", import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;

// The hero composed for a 1.91:1 card, every entrance and float stopped on its resting frame.
const CARD = `
  .curtain, .curtain-i, nextjs-portal, .site-nav, .header-side, .hero-lede, .hero-actions, .stats-section,
  .circuit-field, .circuit, .ribbon-sheen, .through-line, main > :not(.through), .through-work, .scene-rail, .run-mark { display: none !important; }
  .through { display: block !important; }
  .hero-copy, .hero-copy > *, .el, .el-float, .el-art { animation: none !important; opacity: 1 !important; transform: none !important; }
  .el { translate: none !important; }
  html { scroll-behavior: auto !important; }
  body { background: var(--bg) !important; }
  .site-header { background: none !important; box-shadow: none !important; }
  .header-inner { width: calc(100% - 112px); height: 92px; }
  .hero { position: relative !important; top: 0 !important; height: ${HEIGHT}px !important; min-height: 0 !important; padding: 60px 0 0 !important; align-content: center !important; }
  .hero::before { opacity: 1 !important; background: radial-gradient(48% 62% at 76% 54%, rgba(255, 255, 255, 0.07), transparent 72%) !important; }
  .hero-grid { width: calc(100% - 112px); grid-template-columns: 470px minmax(0, 1fr) !important; gap: 0 !important; }
  .hero h1 { font-size: 80px !important; }
  .stage { width: 640px !important; justify-self: end; margin-right: -36px; }
`;

const browser = await Browser.launch({ width: WIDTH, height: HEIGHT });
const tab = await browser.newPage({ width: WIDTH, height: HEIGHT });
await tab.goto(URL_TO_SHOOT, { settleMs: 1500 });
await tab.eval(async (css) => {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.append(style);
  await document.fonts.ready;
  await Promise.all([...document.images].filter((image) => image.closest(".hero")).map((image) => image.decode().catch(() => {})));
}, CARD);
await new Promise((resolve) => setTimeout(resolve, 500));
const shot = Buffer.from(await tab.screenshot({ format: "png" }), "base64");
await browser.close();

await sharp(shot).png({ compressionLevel: 9, effort: 10 }).toFile(OUTPUT);
console.log(`public/og-image.png written, ${WIDTH}x${HEIGHT}`);
process.exit(0);
