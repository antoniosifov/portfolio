import { projects } from "@/data/portfolio";
import { layoutBox, seg } from "@/lib/motion/camera";
import type { Plan, SceneDef } from "@/lib/motion/stage";

/** Scene B, "Two days of handwriting, gone" (closes Work). The handwritten roster covers the laptop; one lime
 *  line sweeps it off from right to left, Sunday's column first, and the app is under it. Then "gone." takes
 *  the lime, the phone rises at the laptop's corner and the details follow. The text column never moves.
 *
 *  The scene runs on a rail (`.icu-rail`, a sibling of `.work-section`), not on `.icu` itself: Work is sticky
 *  through scene A, and ScrollTrigger measures with the page at 0, where `.icu` sits a whole run higher than
 *  where it plays. The rail is placed where `.icu` is once Work has landed, before every measure. */

const SHEET = "/img/projects/icu/handwritten.webp";
const told = projects.find((project) => project.scene);

const INK = [239, 238, 233, 0.45]; // --ink at 45%
const LIME = [215, 255, 95, 1]; // --accent

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
const mix = (a: number[], b: number[], t: number) => {
  const [r, g, bl, alpha] = a.map((value, i) => value + (b[i] - value) * t);
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(bl)}, ${alpha.toFixed(3)})`;
};

const build: Plan["build"] = (tl, ctx) => {
  const rail = ctx.root;
  const icu = ctx.one(".icu");
  const work = ctx.one(".work-section");
  const screen = ctx.one(".icu-screen", icu);
  const sheet = ctx.one(".icu-sheet", icu);
  const line = ctx.one(".icu-line", icu);
  const gone = ctx.one(".icu-statement em", icu);
  const app = ctx.one(".icu-app", icu);
  const phone = ctx.q(".icu-phone", icu);
  // The description stays from the start: it explains the sheet being swept, and a hidden one left a hole under
  // the statement. Only the logos and the note rise once the roster is gone.
  const rising = ctx.q(".icu-copy > .stack-icons, .icu-copy > .icu-note", icu);
  const moved = [sheet, line, gone, app, ...phone, ...rising];
  const stage = ctx.one(".icu-stage", icu);

  // The stage's sticky top. On both plans the stage is only as tall as its content, so what follows comes right
  // after the hold, and the list before it keeps a fixed run-in (30-work.css). CSS centres it under the header from
  // its own height (capped on tall desk windows). A sticky offset moves no layout, so the page keeps its height
  // before and after this.
  const pin = () => {
    stage.style.setProperty("--icu-h", `${stage.offsetHeight}px`);
    return parseFloat(getComputedStyle(stage).top) || 0;
  };

  // Where `.icu` stands once Work has landed: a sticky Work ends at the bottom of its runway. The stage pins when it
  // reaches its sticky top, so the rail starts that much before `.icu` reaches the top of the window.
  const place = () => {
    const top = pin();
    const runway = rail.offsetParent as HTMLElement | null;
    if (!runway) return;
    const workTop = getComputedStyle(work).position === "sticky" ? runway.clientHeight - work.offsetHeight : layoutBox(work, runway).y;
    rail.style.setProperty("--icu-at", `${Math.round(workTop + icu.offsetTop - top)}px`);
  };
  place();
  ctx.ScrollTrigger.addEventListener("refreshInit", place);
  icu.classList.add("is-live");

  // The screen's width, from layout; the line travels across it.
  let width = 0;
  ctx.onMeasure(() => {
    width = screen.offsetWidth;
  });

  let lastP = -1;
  const render = (p: number) => {
    // .12 to .72: the sweep, linear. The line is the sheet's right edge. The app is clipped to the swept side,
    // so the two pictures never overlap: stacked, the white app would show through the sheet's soft edges.
    const sweep = seg(p, 0.12, 0.72);
    sheet.style.clipPath = `inset(0 ${(sweep * 100).toFixed(2)}% 0 0)`;
    app.style.clipPath = `inset(0 0 0 ${((1 - sweep) * 100).toFixed(2)}%)`;
    line.style.transform = `translate3d(${((1 - sweep) * width).toFixed(1)}px, 0, 0)`;
    line.style.opacity = Math.min(seg(p, 0.12, 0.15), 1 - seg(p, 0.72, 0.76)).toFixed(3);

    // Latched states ease there in CSS (30-work.css); a jump lands at once.
    const jump = lastP < 0 || Math.abs(p - lastP) > 0.08;
    lastP = p;
    icu.toggleAttribute("data-instant", jump);

    // .72 to .84: solved. The app to full light and the phone up at the corner, scrubbed. "gone." turns lime the
    // moment the sweep ends and the phone is opaque from its first pixel of rise: scrubbed, a stop part way left
    // "gone." olive and the laptop's table showing through the phone.
    const solved = seg(p, 0.72, 0.84);
    gone.style.color = mix(INK, LIME, sweep >= 1 ? 1 : 0);
    app.style.filter = `brightness(${(0.92 + 0.08 * solved).toFixed(3)})`;
    const rise = easeOut(solved);
    phone.forEach((el) => {
      el.style.opacity = solved > 0 ? "1" : "0";
      el.style.transform = `translate3d(0, ${(40 * (1 - rise)).toFixed(1)}px, 0)`;
    });

    // .80 to .90: the logos, then the note. Each is in or out, never left half faded where the visitor stops: in
    // from the middle of its rise, eased there by 30-work.css.
    rising.forEach((el, i) => {
      const t = seg(p, 0.8 + i * 0.02, 0.88 + i * 0.02) >= 0.5 ? 1 : 0;
      el.style.opacity = String(t);
      el.style.transform = `translate3d(0, ${12 * (1 - t)}px, 0)`;
    });
  };

  const state = { p: 0 };
  tl.to(state, { p: 1, duration: 1, ease: "none", onUpdate: () => render(state.p) }, 0);
  render(state.p);

  return () => {
    ctx.ScrollTrigger.removeEventListener("refreshInit", place);
    icu.classList.remove("is-live");
    icu.removeAttribute("data-instant");
    stage.style.removeProperty("--icu-h");
    rail.style.removeProperty("--icu-at");
    for (const el of moved) {
      for (const property of ["clip-path", "transform", "opacity", "color", "filter"]) el.style.removeProperty(property);
    }
  };
};

const handwriting: SceneDef = {
  id: "handwriting",
  desk: { build },
  phone: { build },
  warm: [SHEET, told?.devices?.desktop, told?.devices?.mobile].filter((url): url is string => Boolean(url)),
};

export default handwriting;
