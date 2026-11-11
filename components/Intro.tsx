"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** The monogram's two paths, the same as `Mark` in Logo.tsx. The curtain draws them, so it keeps its own copy. */
const PATH_A =
  "M443 0H508Q516 0 516 8V518Q516 526 508 526H443Q435 526 435 518V116L89 517Q81 527 72 527H6C0 527 -2 521 2.3 515L435.5 4Q439 0 443 0Z";
const PATH_I = "M623 0H688Q696 0 696 8V518Q696 526 688 526H623Q615 526 615 518V8Q615 0 623 0Z";

/** Real time from hydration. The I now gives way at 1800 ms on the curtain's clock (after the headline's rise). */
const BACKSTOP_MS = 3200;

/** What the flight script leaves on `window` for this component: whether the I is in the air, a promise
 *  that settles when it has landed (or was never launched), a way to land it at once, and why it stayed
 *  home if it did ("late": the fonts were not ready in time). */
type Flight = { flying: boolean; skipped: string; done: Promise<void>; land(): void };
type FlightWindow = Window & { __curtainI?: Flight };

/** The I's flight, as an inline script, so it runs from the HTML and never waits for hydration (on a phone
 *  that can be a second, long after the curtain has gone). Times are on the curtain's own clock, its
 *  `curtain-up` animation: the I is drawn by 520 ms, the copy takes its place at 540, the curtain lifts at
 *  560 and the copy lands on the headline's I at 1060. Its straight path runs along the headline's first
 *  line, so the headline's own rise waits for it (HOLD, 1000 ms instead of the CSS 620): the I crosses an
 *  empty line, the rest of the headline rises around it, and the copy gives way to the real I when that
 *  rise has ended (1800 ms), so the swap never shows a step. The lede and the actions wait by the same hold,
 *  80 ms apart after the headline as in CSS, so the title slide still reads headline, lede, button.
 *  If the fonts are not ready by 480 ms, the visitor has scrolled, or anything is missing, the I simply
 *  lifts with the curtain and the headline keeps its CSS time. */
const FLIGHT = `(function(){
var d=document,h=d.documentElement,w=window,resolve,f={flying:false,skipped:"",land:function(){},done:new Promise(function(r){resolve=r})};
w.__curtainI=f;
function skip(why){f.flying=false;f.skipped=why||"error";h.classList.remove("i-flying");resolve()}
try{
if(!h.classList.contains("js")||h.classList.contains("no-curtain")||w.matchMedia("(prefers-reduced-motion: reduce)").matches)return skip("off");
var c=d.querySelector(".curtain"),mi=d.querySelector(".curtain-mark-i"),fly=d.querySelector(".curtain-i");
if(!c||!mi||!fly||!c.getAnimations||!fly.animate||!d.createRange)return skip("missing");
var lift=c.getAnimations().filter(function(a){return a.animationName==="curtain-up"})[0];
if(!lift)return skip("no lift");
var LATEST=480,SWAP=540,LIFT=560,MS=500,HOLD=1000;
var clock=function(){return lift.currentTime==null?0:lift.currentTime};
var parsed=new Promise(function(r){if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",function(){r()},{once:true});else r()});
var ready=Promise.all([parsed,d.fonts?d.fonts.ready:null,lift.ready]).then(function(){return true});
var late=new Promise(function(r){setTimeout(function(){r(false)},Math.max(0,LATEST-clock()))});
Promise.race([ready,late]).then(function(ok){
if(!ok||clock()>=LATEST)return skip("late");
if(w.scrollY>2||lift.startTime==null)return skip("moved");
var h1=d.querySelector(".hero h1");if(!h1)return skip("missing");
var tw=d.createTreeWalker(h1,4),n=tw.nextNode();while(n&&!n.data.trim())n=tw.nextNode();
if(!n)return skip("missing");var at=n.data.search(/\\S/);if(n.data.charAt(at)!=="I")return skip("missing");
var r=d.createRange();r.setStart(n,at);r.setEnd(n,at+1);var g=r.getBoundingClientRect();
var cs=getComputedStyle(h1),cx=d.createElement("canvas").getContext("2d");if(!cx||!g.height)return skip("missing");
cx.font=cs.fontStyle+" "+cs.fontWeight+" "+cs.fontSize+" "+cs.fontFamily;var m=cx.measureText("I");
var sh=cs.transform&&cs.transform!=="none"?new DOMMatrix(cs.transform):new DOMMatrix();
var base=g.top-sh.m42+m.fontBoundingBoxAscent;
var tx=g.left-sh.m41-m.actualBoundingBoxLeft,ty=base-m.actualBoundingBoxAscent,tW=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,tH=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
var s=mi.getBoundingClientRect();
if(!(tW>0&&tH>0&&ty>=0&&ty+tH<=w.innerHeight&&s.width>0&&s.height>0))return skip("out of view");
fly.style.left=s.left+"px";fly.style.top=s.top+"px";fly.style.width=s.width+"px";fly.style.height=s.height+"px";
var to="translate("+(tx-s.left)+"px,"+(ty-s.top)+"px) scale("+(tW/s.width)+","+(tH/s.height)+")";
f.flying=true;h.classList.add("i-flying");
var rise=null,kids=h1.parentElement?[].slice.call(h1.parentElement.children):[h1];
kids.forEach(function(el,k){var a=el.getAnimations().filter(function(x){return x.animationName==="rise"})[0];if(!a||!a.effect||!a.effect.updateTiming)return;var i=parseFloat(getComputedStyle(el).getPropertyValue("--i"));a.effect.updateTiming({delay:HOLD+(isFinite(i)?i:k)*80});a.startTime=lift.startTime;if(el===h1)rise=a});
var list=[fly.animate([{opacity:0},{opacity:1}],{delay:SWAP,duration:1,fill:"both"}),mi.animate([{opacity:1},{opacity:0}],{delay:SWAP,duration:1,fill:"both"}),fly.animate([{transform:"none"},{transform:to}],{delay:LIFT,duration:MS,easing:"cubic-bezier(0.76, 0, 0.24, 1)",fill:"both"})];
list.forEach(function(a){a.startTime=lift.startTime});
var land=function(){if(!f.flying)return;f.flying=false;w.removeEventListener("scroll",land);h.classList.remove("i-flying");list.forEach(function(a){a.cancel()});resolve()};
f.land=land;Promise.all([list[2].finished,rise&&rise.finished.catch(function(){})]).then(land,land);
w.addEventListener("scroll",land,{passive:true});
}).catch(function(){skip("error")});
}catch(e){skip("error")}
})();`;

/** Brand curtain: the monogram draws in stroke order, the curtain lifts, and the monogram's I flies to the
 *  headline's I. Once per tab, never on a link into the page, never under reduced motion. The curtain is CSS
 *  and the flight an inline script, so this component only keeps the bookkeeping: it leaves the page once
 *  the curtain has lifted and the I has landed, and remembers for the tab that the curtain has played. */
export function Intro() {
  const [gone, setGone] = useState(false);
  const curtainRef = useRef<HTMLDivElement>(null);

  // React's development remount resets <html> to the attributes it renders: put the flight's class back.
  useLayoutEffect(() => {
    if ((window as FlightWindow).__curtainI?.flying) document.documentElement.classList.add("i-flying");
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || html.classList.contains("no-curtain")) {
      setGone(true);
      return;
    }

    let disposed = false;
    let lifted = false;
    let landed = false;
    const finish = () => {
      if (disposed || !lifted || !landed) return;
      try {
        sessionStorage.setItem("curtain", "1");
      } catch {
        // Storage can be blocked; the curtain then plays again on the next visit.
      }
      setGone(true);
    };

    const lift = curtainRef.current?.getAnimations().find((animation) => (animation as CSSAnimation).animationName === "curtain-up");
    if (!lift || lift.playState === "finished") lifted = true;
    else
      void lift.finished.then(
        () => {
          lifted = true;
          finish();
        },
        () => {},
      );

    const flight = (window as FlightWindow).__curtainI;
    if (!flight) landed = true;
    else
      void flight.done.then(() => {
        landed = true;
        finish();
      });

    // A throttled background tab may never finish either animation.
    const backstop = window.setTimeout(() => {
      flight?.land();
      lifted = true;
      landed = true;
      finish();
    }, BACKSTOP_MS);

    finish();
    return () => {
      disposed = true;
      window.clearTimeout(backstop);
    };
  }, []);

  if (gone) return null;

  return (
    <>
      <div ref={curtainRef} className="curtain" aria-hidden="true">
        <div className="curtain-logo">
          <svg className="mark curtain-mark" viewBox="0 0 696 527" aria-hidden="true" focusable="false">
            <defs>
              <mask id="curtain-draw-a" maskUnits="userSpaceOnUse" x="-120" y="-120" width="936" height="767">
                <path className="curtain-stroke curtain-stroke-a" d="M7 562L476 9V600" pathLength={1} />
              </mask>
              <mask id="curtain-draw-i" maskUnits="userSpaceOnUse" x="-120" y="-120" width="936" height="767">
                <path className="curtain-stroke curtain-stroke-i" d="M655.5 -40V567" pathLength={1} />
              </mask>
            </defs>
            <path d={PATH_A} fill="currentColor" mask="url(#curtain-draw-a)" />
            <path className="curtain-mark-i" d={PATH_I} fill="currentColor" mask="url(#curtain-draw-i)" />
          </svg>
          <span className="curtain-divider" />
          <span className="curtain-name">Anton Iosifov</span>
        </div>
      </div>
      <span className="curtain-i" aria-hidden="true" suppressHydrationWarning />
      {/* Executed by the parser on the server-rendered page; inert when React renders it on the client. */}
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: FLIGHT }}
      />
    </>
  );
}
