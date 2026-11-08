import { Icon } from "./Icons";
import { Landscape } from "./Landscape";
import { Mark } from "./Logo";
import { OliveBranch } from "./OliveBranch";

/** One ring drawn twice: the half behind the devices and the half in front of
 *  them, so the band appears to wrap around the scene. Both halves clip the
 *  same ellipse in its own rotated space. */
function Ring({ part }: { part: "back" | "front" }) {
  const clipId = `ring-clip-${part}`;
  return (
    <svg className={`ring ring-${part}`} viewBox="0 0 700 500" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ring-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9ab74" />
          <stop offset="0.36" stopColor="#f6ecd8" />
          <stop offset="0.62" stopColor="#e4eae2" />
          <stop offset="1" stopColor="#bf9f66" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x="-250" y={part === "back" ? -250 : 250} width="1200" height="500" />
        </clipPath>
      </defs>
      <g transform="rotate(-16 350 250)" clipPath={`url(#${clipId})`}>
        <ellipse cx="350" cy="250" rx="330" ry="118" fill="none" stroke="url(#ring-gold)" strokeWidth="30" opacity="0.94" />
        <ellipse cx="350" cy="241" rx="330" ry="118" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="5" />
        <ellipse cx="350" cy="263" rx="330" ry="118" fill="none" stroke="rgba(120,90,50,0.16)" strokeWidth="3" />
      </g>
    </svg>
  );
}

function Screen() {
  return (
    <div className="screen">
      <Landscape className="screen-img" />
      <Mark className="screen-mark" />
    </div>
  );
}

export function HeroStage() {
  return (
    <div className="stage" aria-hidden="true">
      <div className="stage-glow" />
      <Ring part="back" />
      <div className="stone" />
      <div className="laptop">
        <div className="laptop-lid">
          <Screen />
        </div>
        <div className="laptop-base" />
      </div>
      <div className="phone">
        <Screen />
        <span className="phone-notch" />
      </div>
      <Ring part="front" />
      <div className="chip chip-code">
        <Icon name="code" size={30} />
      </div>
      <div className="chip chip-cloud">
        <Icon name="cloud" size={32} />
      </div>
      <div className="chip chip-spark">
        <Icon name="sparkles" size={26} />
      </div>
      <OliveBranch className="leaf leaf-stage" />
    </div>
  );
}
