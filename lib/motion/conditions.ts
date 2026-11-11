/** The two motion plans. This is the one source for JavaScript; the same strings are written out
 *  literally in the stylesheets (`@media` cannot read a variable), and the contract script asserts
 *  that both agree. Everything that matches neither gets the finished composition. */
export const DESK =
  "screen and (prefers-reduced-motion: no-preference) and (min-width: 901px) and (min-height: 600px) and (min-aspect-ratio: 5/4)";
export const PHONE =
  "screen and (prefers-reduced-motion: no-preference) and (max-width: 600px) and (min-height: 560px) and (orientation: portrait)";

/** Scene A on the PHONE plan: the dolly ends here with Work exactly on the window, so from this progress on Work
 *  is landed and live to the finger (lib/scenes/through.ts), its focus guard lets it be (anchors.ts) and its
 *  phones may float (WorkShowcase). The desk lands at 1. */
export const PHONE_LANDED = 0.86;

export const REDUCED = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER = "(pointer: fine)";

/** Runs while the HTML is parsed, before the first paint, so the runway heights exist in time and
 *  scroll restoration lands correctly. Written as a literal because it ships as an inline script. */
export const PRE_PAINT = `(function(){var d=document.documentElement,c=d.classList;c.add("js");try{var n=navigator,s=n.connection;if(s&&s.saveData||n.deviceMemory&&n.deviceMemory<=2||sessionStorage.getItem("motion")==="calm")c.add("calm");if(location.hash||sessionStorage.getItem("curtain"))c.add("no-curtain");}catch(e){}try{var m=window.matchMedia;if(!c.contains("calm")&&m("screen and (prefers-reduced-motion: no-preference)").matches&&!m(${JSON.stringify(DESK)}).matches&&!m(${JSON.stringify(PHONE)}).matches)c.add("is-lite");}catch(e){}})();`;

/** Runs right after the hero is parsed (Through.tsx), still before the first paint: writes the hero's real
 *  height on the runway, so a hero taller than the window (1067x677: 702 px) places the rail, the markers and
 *  everything below them where they will stay. Without it they move once the runtime arms, and a reload or
 *  `/#contact` lands that many pixels off. The runtime writes the same two values at every refresh. */
export const HERO_HEIGHT =
  '(function(){try{var s=document.currentScript,t=s&&s.parentNode,h=t&&t.querySelector(":scope > .hero");if(!h)return;var o=h.offsetHeight;t.style.setProperty("--hero-h",o+"px");t.style.setProperty("--hero-over","max(0px, calc("+o+"px - 100svh))");}catch(e){}})();';
