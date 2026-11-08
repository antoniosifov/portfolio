import sharp from "sharp";

// Light editorial card matching the site: cream paper, the ΛI monogram, bronze italic accent.
const mark = (x, y, scale, fill) => `
  <g transform="translate(${x} ${y}) scale(${scale})" fill="${fill}">
    <path d="M443 0H508Q516 0 516 8V518Q516 526 508 526H443Q435 526 435 518V116L89 517Q81 527 72 527H6C0 527 -2 521 2.3 515L435.5 4Q439 0 443 0Z"/>
    <path d="M623 0H688Q696 0 696 8V518Q696 526 688 526H623Q615 526 615 518V8Q615 0 623 0Z"/>
  </g>`;

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8f4ee"/>
      <stop offset="1" stop-color="#efebe3"/>
    </linearGradient>
    <linearGradient id="bronze" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#7a5730"/>
      <stop offset="0.6" stop-color="#9c7443"/>
      <stop offset="1" stop-color="#8f6a3e"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c9ab74"/>
      <stop offset="0.4" stop-color="#f6ecd8"/>
      <stop offset="1" stop-color="#bf9f66"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#paper)"/>
  <ellipse cx="960" cy="330" rx="330" ry="118" transform="rotate(-16 960 330)" fill="none" stroke="url(#ring)" stroke-width="28" opacity="0.9"/>
  <ellipse cx="960" cy="322" rx="330" ry="118" transform="rotate(-16 960 322)" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.6"/>
  ${mark(64, 58, 0.06, "#20251f")}
  <rect x="124" y="60" width="1" height="26" fill="#20251f" opacity="0.25"/>
  <text x="142" y="80" fill="#20251f" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="600">Anton Iosifov</text>
  <line x1="64" y1="196" x2="92" y2="196" stroke="#ba9367" stroke-width="2"/>
  <text x="104" y="201" fill="#69716b" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700" letter-spacing="3">SOFTWARE ENGINEER</text>
  <text x="62" y="300" fill="#20251f" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="700" letter-spacing="-3">Building digital</text>
  <text x="62" y="392" fill="#20251f" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="700" letter-spacing="-3">products <tspan fill="#5f6761" font-weight="400">that</tspan></text>
  <text x="62" y="484" fill="#85623a" font-family="Georgia, 'Times New Roman', serif" font-size="88" font-style="italic" font-weight="700" letter-spacing="-2">solve real problems.</text>
  <text x="64" y="556" fill="#5f6761" font-family="Arial, Helvetica, sans-serif" font-size="22">Web · Mobile · Cloud · Applied AI — from idea to production</text>
  <rect x="958" y="534" width="178" height="40" rx="20" fill="#586b40"/>
  <text x="1047" y="560" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="700">antoniosifov.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile("public/og-image.png");
console.log("public/og-image.png written");
