import { layoutBox } from "@/lib/motion/camera";
import { REDUCED } from "@/lib/motion/conditions";
import { FINE } from "./hand";

/** A point in host pixels. */
type Pt = [number, number];
/** A box a trace keeps out of, already grown by its margin. */
type Keep = { x0: number; y0: number; x1: number; y1: number };
/** One drawn line: its corners and length, whether a pad sits at its start and at its end, and when it draws
 *  within its run (ms after the run starts, and for how long). */
type Trace = { points: Pt[]; length: number; startPad: boolean; endPad: boolean; at: number; dur: number };
/** What draws as one: a seam (with the two legs that feed it from a pair of cards) or the hero's trace. */
type Run = Trace[];
/** Where a seam leaves the section above: the point its trace starts from, and the legs that lead there. */
type Start = { x: number; y: number; legs: Trace[]; prefer: number };
/** Where a seam arrives: on a heading's baseline (with a pad, or hooking in towards the word), or on a card's
 *  top edge. `xs` are the columns its last drop may take. */
type End = { y: number; xs: number[]; prefer: number; hookTo: number | null; pad: boolean };

/** One cell of clearance from every word, card and picture. */
const CELL = 40;
/** The heading a seam arrives at may be approached this close, beside its last letter, never over it. */
const NEAR_TITLE = 24;
/** From the sides of the window. */
const EDGE = 20;
/** The 45° corners. */
const JOG = 40;
const HOOK = 20;
/** A leg leaves a card this far inside its bottom edge, past the corner's radius. */
const LEG = 24;
/** How many columns a seam's last drop may try, beside its heading. */
const COLUMNS = 16;
const PAD = 3;
const SAMPLE = 4;
/** Everything a trace stays clear of. */
const AVOID = "h1, h2, h3, p, li, a, button, .card, .chip, img, dl";
/** Pictures of the hero's stage that are not its art: the scene's screens and shell (laid out at their natural
 *  size, then drawn small by a transform, and shown only in flight, when the hero's traces are out) and the chips'
 *  blurred copies. The art beside them covers the same place. */
const SCENE_PIECES = ".stage img:not(.el-art)";
/** The hero's trace leaves the devices where the phone stands on the ribbon: under the band's lowest point, as
 *  fractions of the ribbon picture (its flat bottom runs from .17 to .29 of its width, its lower edge at .982 of its
 *  height there; the phone's foot is above .24). It starts tucked under the opaque band by `TUCK` of the picture's
 *  height, so it reads as wired to it whichever way the float and the pointer move the band (a few pixels). */
const RIBBON_FOOT: Pt = [0.244, 0.982];
const TUCK = 0.03;
/** The anchors themselves: the trace may start under them. */
const HERO_ANCHORS = ".stage :is(.el-ribbon, .el-phone) .el-art";
/** Text blocks are measured by their words, not their box, so the room beside a short heading is free. */
const BY_WORDS = new Set(["H1", "H2", "H3", "P", "A"]);
/** The trace draws as its top passes 70% of the window, at about this pace. */
const DRAW_LINE = "-30%";
const DRAW_PX_PER_MS = 0.6;
const DRAW_MIN = 560;
const DRAW_MAX = 1200;
const LEGS_MS = 280;
/** Everything above the window counts as reached, so a jump past a seam still finds it drawn. */
const ABOVE = "100000px";
/** On a first visit the hero's trace waits for the curtain to lift. */
const CURTAIN_MS = 1150;
const REBUILD_MS = 200;
const FONT_WAIT_MS = 1000;
const FLAT_RETRY_MS = 1200;
const GLOW = 260;
const PULSE = 44;
const PULSE_SPEED = 170;
const PULSES_PER_PRESS = 4;
const PRESS_REACH = 640;
const MAX_PULSES = 16;
const SVG = "http://www.w3.org/2000/svg";

/** Ids stay unique when a host is mounted twice (Strict Mode in development). */
let mounts = 0;

const visible = (el: HTMLElement) => (el.offsetWidth > 0 || el.offsetHeight > 0) && !el.classList.contains("sr-only");
const lengthOf = (points: Pt[]) => points.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - points[i][0], y - points[i][1]), 0);
const durationOf = (length: number) => Math.round(Math.min(DRAW_MAX, Math.max(DRAW_MIN, length / DRAW_PX_PER_MS)));

function trace(points: Pt[], { startPad = false, endPad = true, at = 0 } = {}): Trace {
  const clean = points.filter((p, i) => i === 0 || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
  const length = lengthOf(clean);
  return { points: clean, length, startPad, endPad, at, dur: durationOf(length) };
}

/** The boxes of an element's words: its text nodes only, since a range over the element would also return the
 *  full-width boxes of block spans inside it (a heading's line mask). */
function wordRects(el: HTMLElement): DOMRect[] {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.nodeValue?.trim()) continue;
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) if (rect.width >= 1) rects.push(rect);
  }
  return rects;
}

/** The horizontal run of an element's words, relative to its own left edge and in layout pixels, so a rising
 *  line or a camera scale on an ancestor does not move it. */
function wordsExtent(el: HTMLElement): [number, number] | null {
  const shown = el.getBoundingClientRect();
  if (!shown.width) return null;
  let left = Infinity;
  let right = -Infinity;
  for (const rect of wordRects(el)) {
    left = Math.min(left, rect.left);
    right = Math.max(right, rect.right);
  }
  if (!Number.isFinite(left)) return null;
  const scale = el.offsetWidth / shown.width;
  return [(left - shown.left) * scale, (right - shown.left) * scale];
}

let measure: CanvasRenderingContext2D | null = null;

/** The baseline of a heading's last line, in host pixels: the bottom of its words' boxes less the face's descent,
 *  read relative to the element that carries the words, so the hidden rise of the line does not move it. */
function baselineOf(heading: HTMLElement, host: HTMLElement): number | null {
  const line = heading.querySelector<HTMLElement>(".intro-line") ?? heading;
  let bottom = -Infinity;
  for (const rect of wordRects(line)) bottom = Math.max(bottom, rect.bottom);
  if (!Number.isFinite(bottom)) return null;
  const shown = line.getBoundingClientRect();
  const scale = shown.width ? line.offsetWidth / shown.width : 1;
  const style = getComputedStyle(line);
  measure ??= document.createElement("canvas").getContext("2d");
  let descent = parseFloat(style.fontSize) * 0.22;
  if (measure) {
    measure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const metrics = measure.measureText(line.textContent ?? "");
    if (metrics.fontBoundingBoxDescent) descent = metrics.fontBoundingBoxDescent;
  }
  return layoutBox(line, host).y + (bottom - shown.top) * scale - descent;
}

/** Page offsets from layout only. A host in the finale is measured from the runway, which never sticks: its
 *  About layer does, and an offset read through a stuck layer would move with the scroll. */
const pageBox = (el: HTMLElement) => layoutBox(el, document.body);

function hostOrigin(host: HTMLElement): Pt {
  const x = pageBox(host).x;
  const finale = host.closest<HTMLElement>(".finale");
  if (!finale) return [x, pageBox(host).y];
  let y = 0;
  for (let node: HTMLElement | null = host; node && node !== finale; node = node.offsetParent as HTMLElement | null) {
    y += node.offsetTop;
    if (node.offsetParent instanceof HTMLElement && node.offsetParent.classList.contains("finale-about")) break;
  }
  return [x, pageBox(finale).y + y];
}

/** The boxes to keep out of: the host's words, cards and pictures, each grown by one cell, the heading a seam
 *  arrives at by less. `extra` adds boxes of the section above that a seam passes (the note under Skills). */
function keepsOf(host: HTMLElement, origin: Pt, title: HTMLElement | null, skip: HTMLElement | null, extra: HTMLElement[], ignore = ""): Keep[] {
  const keeps: Keep[] = [];
  const add = (el: HTMLElement, box: { x: number; y: number; w: number; h: number }) => {
    let x0 = box.x;
    let x1 = box.x + box.w;
    if (BY_WORDS.has(el.tagName)) {
      const words = wordsExtent(el);
      if (words) {
        x0 = box.x + words[0];
        x1 = box.x + words[1];
      }
    }
    // The card a seam lands on: its pictures and words sit inside the edge the trace stops at.
    const margin = el === title ? NEAR_TITLE : skip?.contains(el) ? 0 : CELL;
    keeps.push({ x0: x0 - margin, y0: box.y - margin, x1: x1 + margin, y1: box.y + box.h + margin });
  };
  for (const el of host.querySelectorAll<HTMLElement>(AVOID)) {
    if (el === skip || !visible(el) || el.matches(SCENE_PIECES) || (ignore && el.matches(ignore))) continue;
    add(el, layoutBox(el, host));
  }
  for (const el of extra) {
    if (!visible(el)) continue;
    const box = pageBox(el);
    add(el, { x: box.x - origin[0], y: box.y - origin[1], w: box.w, h: box.h });
  }
  return keeps;
}

/** How far a polyline stays from every kept box (beyond its margin), or -1 when it touches one or leaves the
 *  drawable area. Sampled every few pixels along each segment. */
function clearance(points: Pt[], keeps: Keep[], area: Keep): number {
  let least = Infinity;
  for (let i = 1; i < points.length; i += 1) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / SAMPLE));
    for (let s = 0; s <= steps; s += 1) {
      const x = ax + ((bx - ax) * s) / steps;
      const y = ay + ((by - ay) * s) / steps;
      if (x < area.x0 || x > area.x1 || y < area.y0 || y > area.y1) return -1;
      for (const k of keeps) {
        const dx = Math.max(k.x0 - x, 0, x - k.x1);
        const dy = Math.max(k.y0 - y, 0, y - k.y1);
        if (!dx && !dy) return -1;
        least = Math.min(least, Math.hypot(dx, dy));
      }
    }
  }
  return least;
}

/** Down from a start, one 45° corner, across, a second corner, down to the end: a trace with two bends (one,
 *  when start and end are close; none when they line up). */
function zRoute([sx, sy]: Pt, xv: number, yh: number, jog: number): Pt[] | null {
  const dx = xv - sx;
  if (!dx) return [[sx, sy]];
  const side = Math.sign(dx);
  if (yh - jog < sy + 8) return null;
  return [
    [sx, sy],
    [sx, yh - jog],
    [sx + side * jog, yh],
    [xv - side * jog, yh],
    [xv, yh + jog],
  ];
}

/** The best seam from any start to the end: clear of everything, as far from it as the gap allows, and close to
 *  the preferred columns. */
function routeSeam(starts: Start[], ends: End[], keeps: Keep[], area: Keep): Run | null {
  // The ends are in order of preference: the first one any route reaches wins.
  for (const end of ends) {
    let best = null as { score: number; run: Run } | null;
    for (const start of starts) {
      for (const xv of end.xs) {
        const dx = Math.abs(xv - start.x);
        // Lined up, or a real step: never a corner of a few pixels.
        if (dx && dx < 32) continue;
        const tail: Pt[] =
          end.hookTo === null
            ? [[xv, end.y]]
            : [
                [xv, end.y - HOOK],
                [xv - HOOK, end.y],
                [end.hookTo, end.y],
              ];
        if (end.hookTo !== null && xv - HOOK < end.hookTo + 12) continue;
        if (clearance([[xv, tail[0][1] - 8], ...tail], keeps, area) < 0) continue;
        for (const size of dx ? [JOG, 24] : [0]) {
          const jog = Math.min(size, dx / 2);
          // Two corners with a stub between them stutter: one diagonal, or a real run across.
          const across = dx - 2 * jog;
          if (across > 0 && across < 24) continue;
          const from = dx ? start.y + jog + 8 : tail[0][1];
          const to = dx ? tail[0][1] - jog - 8 : tail[0][1];
          for (let yh = from; yh <= to; yh += SAMPLE) {
            const body = zRoute([start.x, start.y], xv, yh, jog);
            if (!body) continue;
            const room = clearance([...body, tail[0]], keeps, area);
            if (room < 0) continue;
            const score =
              Math.min(room, CELL) +
              Math.min(yh - start.y, CELL) +
              jog / 4 -
              Math.abs(xv - end.prefer) * 0.04 -
              Math.abs(start.x - start.prefer) * 0.02 -
              (dx ? 0 : 30);
            if (best && score <= best.score) continue;
            const legsMs = start.legs.length ? LEGS_MS : 0;
            best = { score, run: [...start.legs, trace([...body, ...tail], { endPad: end.pad, at: legsMs })] };
          }
        }
      }
    }
    if (best) return best.run;
  }
  return null;
}

/** The section above a host, whose last row of cards a seam leaves from. */
function sectionAbove(host: HTMLElement): HTMLElement | null {
  const finale = host.closest<HTMLElement>(".finale");
  return ((finale ?? host).previousElementSibling as HTMLElement | null) ?? null;
}

/** Where the seam into `host` leaves the section above: under the laptop's ports when that section is Work
 *  (its chin), from the gap between a pair of cards through a Y of two legs, or from a single card's edge. */
function startsOf(above: HTMLElement, origin: Pt, width: number): Start[] {
  const chin = above.querySelector<HTMLElement>(".chin");
  if (chin) {
    const port = [...chin.querySelectorAll<HTMLElement>(".chin-ports b")].find(visible);
    const box = pageBox(port ?? chin);
    const x = Math.round(box.x + box.w / 2 - origin[0]);
    return [{ x, y: 0, legs: [], prefer: x }];
  }
  const cards = [...above.querySelectorAll<HTMLElement>(".card")].filter(visible).map((el) => {
    const box = pageBox(el);
    return { x0: box.x - origin[0], x1: box.x + box.w - origin[0], y1: box.y + box.h - origin[1] };
  });
  if (!cards.length) return [];
  const bottom = Math.max(...cards.map((card) => card.y1));
  const row = cards.filter((card) => card.y1 >= bottom - 4).sort((a, b) => a.x0 - b.x0);
  const y = Math.round(bottom);
  if (row.length > 1) {
    const starts: Start[] = [];
    for (let i = 1; i < row.length; i += 1) {
      const left = row[i - 1].x1 - LEG;
      const right = row[i].x0 + LEG;
      const x = Math.round((left + right) / 2);
      const drop = x - left;
      const legs = [
        trace([[left, y], [x, y + drop]], { endPad: true }),
        trace([[right, y], [x, y + drop]], { endPad: false }),
      ];
      legs.forEach((leg) => (leg.dur = LEGS_MS));
      starts.push({ x, y: y + drop, legs, prefer: x });
    }
    return starts;
  }
  const [card] = row;
  const starts: Start[] = [];
  // A single card: from a cell inside either bottom corner (two preferred), or from its edge between them when something (the
  // note under Skills on a phone) stands under both.
  const x0 = card.x0 + CELL;
  const x1 = Math.min(card.x1, width) - CELL;
  const between = Math.max(0, Math.min(8, Math.floor((x1 - x0) / CELL) - 1));
  for (const x of [x0, x1, ...Array.from({ length: between }, (_, i) => x0 + ((x1 - x0) * (i + 1)) / (between + 1))]) {
    starts.push({ x: Math.round(x), y, legs: [], prefer: Math.round(x0 + CELL) });
  }
  return starts;
}

/** Where the seam into `host` arrives: beside its heading on the baseline, or on the top edge of its card above
 *  the card's own heading. */
function endOf(host: HTMLElement, width: number, variant: number): { ends: End[]; title: HTMLElement | null; skip: HTMLElement | null } | null {
  const title = host.querySelector<HTMLElement>(".intro h2");
  if (title) {
    const baseline = baselineOf(title, host);
    const words = wordsExtent(title);
    if (baseline === null || !words) return null;
    const box = layoutBox(title, host);
    const right = box.x + words[1];
    const columns = (first: number) => {
      const xs: number[] = [];
      for (let x = first; x <= width - EDGE && xs.length < COLUMNS; x += 8) xs.push(Math.round(x));
      return xs;
    };
    const hookFirst = right + NEAR_TITLE + 8 + HOOK + 2 * CELL;
    const landFirst = right + CELL + 16;
    const hook: End = { y: Math.round(baseline), xs: columns(hookFirst), prefer: hookFirst, hookTo: Math.round(right + NEAR_TITLE + 8), pad: true };
    const land: End = { y: Math.round(baseline), xs: columns(landFirst), prefer: landFirst + CELL, hookTo: null, pad: true };
    // Where the line of context sits under the heading (one column), there is no room beside the baseline: the
    // trace then lands just above the heading's last letters instead.
    const aboveXs: number[] = [];
    const wordsLeft = box.x + words[0];
    for (let x = right - CELL / 2; x >= wordsLeft + CELL / 2 && aboveXs.length < COLUMNS; x -= 8) aboveXs.push(Math.round(x));
    const above: End = { y: Math.round(box.y - NEAR_TITLE - 2), xs: aboveXs, prefer: Math.max(wordsLeft + CELL / 2, right - 2 * CELL), hookTo: null, pad: true };
    return { ends: variant % 2 === 0 ? [hook, land, above] : [land, hook, above], title, skip: null };
  }
  const card = host.querySelector<HTMLElement>(".card");
  if (!card || !visible(card)) return null;
  const box = layoutBox(card, host);
  const heading = card.querySelector<HTMLElement>("h2");
  const prefer = heading ? layoutBox(heading, host).x : box.x + box.w / 2;
  const xs: number[] = [];
  for (let x = box.x + CELL; x <= box.x + box.w - CELL; x += 8) xs.push(Math.round(x));
  return { ends: [{ y: Math.round(box.y) - 1, xs, prefer, hookTo: null, pad: false }], title: null, skip: card };
}

/** The hero's one trace, wired like the seam after Work, which leaves the laptop's ports: it comes out from under
 *  the ribbon's lowest point, where the phone stands on the band, drops through the free band under the devices
 *  with two 45° corners, and lands on a pad above the nearest stat it can reach, on that stat's left edge.
 *  `keeps` leaves out the ribbon and the phone (the trace starts under them); everything else, the other pieces
 *  included, keeps its cell. When no such route fits, no trace: a line that joins nothing is worse than none. */
function heroRun(host: HTMLElement, width: number, height: number, keeps: Keep[]): Run | null {
  const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 76;
  const ribbon = host.querySelector<HTMLElement>(".stage .el-ribbon .el-art");
  if (!ribbon || !visible(ribbon)) return null;
  const band = layoutBox(ribbon, host);
  const sx = Math.round(band.x + band.w * RIBBON_FOOT[0]);
  const low = band.y + band.h * RIBBON_FOOT[1];
  const sy = Math.round(low - band.h * TUCK);
  const stats = [...host.querySelectorAll<HTMLElement>(".stats li")].filter(visible).map((el) => layoutBox(el, host));
  if (!stats.length) return null;
  const foot = Math.round(Math.min(...stats.map((box) => box.y)) - CELL - 4);
  // The first corner leaves room for the line to show under the band first, the last for a short drop into the pad;
  // the run across sits mid-band.
  const first = low + 12;
  const last = foot - 8;
  const middle = (low + foot) / 2;
  // Beside the copy (desktop) it keeps to the right half. Where the stage sits under the copy (tablets), the whole
  // band under the devices is free. Phones get none, as before: their hero has no band to spare.
  if (width <= 600) return null;
  const x0 = band.x > width / 4 ? width / 2 : band.x;
  const area: Keep = { x0, y0: header + CELL, x1: width - EDGE, y1: height - EDGE };

  let best = null as { score: number; points: Pt[] } | null;
  for (const column of stats.map((box) => Math.round(box.x)).filter((x) => x >= x0 - 1)) {
    const dx = Math.abs(column - sx);
    // Lined up, or a real step: never a corner of a few pixels.
    if (dx && dx < 32) continue;
    for (const size of dx ? [JOG, 24] : [0]) {
      const jog = Math.min(size, dx / 2);
      // Two corners with a stub between them stutter: one diagonal, or a real run across.
      const across = dx - 2 * jog;
      if (across > 0 && across < 24) continue;
      for (let yh = first + jog; yh + jog <= last; yh += dx ? SAMPLE : Infinity) {
        const body = zRoute([sx, sy], column, yh, jog);
        if (!body) continue;
        const points: Pt[] = [...body, [column, foot]];
        const room = clearance(points, keeps, area);
        if (room < 0) continue;
        // The nearest stat: the shortest wire. Then the roomiest, with the run across in the middle of the band.
        const score = -dx * 0.5 + jog / 4 + Math.min(room, 16) - Math.abs(yh - middle) * 0.1;
        if (!best || score > best.score) best = { score, points };
      }
    }
  }
  return best ? [trace(best.points, { startPad: false, endPad: true })] : null;
}

const xy = ([x, y]: Pt) => `${Math.round(x)} ${Math.round(y)}`;
const line = (t: Trace) => `M${t.points.map(xy).join("L")}`;
const padAt = ([x, y]: Pt) => `M${Math.round(x) + PAD} ${Math.round(y)}a${PAD} ${PAD} 0 1 0 ${-2 * PAD} 0a${PAD} ${PAD} 0 1 0 ${2 * PAD} 0z`;
const padsOf = (t: Trace) => (t.startPad ? padAt(t.points[0]) : "") + (t.endPad ? padAt(t.points[t.points.length - 1]) : "");

const svgEl = <K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string>) => {
  const el = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) el.setAttribute(key, value);
  return el;
};

/** Lays out a host's runs: the hero's own trace, or the seam that joins the section above to this one. */
function layOut(host: HTMLElement, order: number): Run[] {
  const width = host.offsetWidth;
  const height = host.offsetHeight;
  const origin = hostOrigin(host);
  if (host.classList.contains("hero")) {
    const run = heroRun(host, width, height, keepsOf(host, origin, null, null, [], HERO_ANCHORS));
    return run ? [run] : [];
  }
  const above = sectionAbove(host);
  const target = endOf(host, width, order);
  if (!above || !target) return [];
  const starts = startsOf(above, origin, width);
  if (!starts.length) return [];
  const top = Math.min(...starts.map((start) => start.y), ...starts.flatMap((start) => start.legs.map((leg) => leg.points[0][1])));
  // What the section above holds under its last cards (the note under Skills), when the seam passes it.
  const extra = [...above.querySelectorAll<HTMLElement>(AVOID)].filter((el) => !el.closest(".card") && !el.querySelector(".card") && pageBox(el).y - origin[1] >= top - 2);
  const area: Keep = { x0: EDGE, y0: top - 1, x1: width - EDGE, y1: Math.max(...target.ends.map((end) => end.y)) + CELL };
  // Only what lies in the seam's band matters to it.
  const keeps = keepsOf(host, origin, target.title, target.skip, extra).filter((k) => k.y0 < area.y1 && k.y1 > area.y0);
  const run = routeSeam(starts, target.ends, keeps, area);
  return run ? [run] : [];
}

/** One host: its drawing, rebuilt when the host's size changes, drawn on once as it comes up the window, and its
 *  light and pulses. */
function mountHost(host: HTMLElement, order: number, interactive: boolean, animate: boolean): () => void {
  const id = mounts++;
  const svg = svgEl("svg", { class: "circuit", "aria-hidden": "true", focusable: "false" });
  if (animate) svg.setAttribute("data-draw", "");
  const runsLayer = svgEl("g", { class: "circuit-runs" });
  const lit = svgEl("g", { class: "circuit-lit" });
  const litLine = svgEl("path", { class: "circuit-line" });
  const litPads = svgEl("path", { class: "circuit-pad" });
  lit.append(litLine, litPads);
  let spot: SVGCircleElement | null = null;

  if (interactive) {
    // The light is a radial fade in an SVG mask, so it works wherever SVG does.
    const fade = svgEl("radialGradient", { id: `circuit-fade-${id}` });
    fade.append(svgEl("stop", { offset: "0", "stop-color": "#fff" }), svgEl("stop", { offset: "1", "stop-color": "#fff", "stop-opacity": "0" }));
    spot = svgEl("circle", { r: String(GLOW), cx: "-9999", cy: "-9999", fill: `url(#circuit-fade-${id})` });
    const mask = svgEl("mask", { id: `circuit-glow-${id}`, maskUnits: "userSpaceOnUse", x: "-100000", y: "-100000", width: "200000", height: "200000" });
    mask.append(spot);
    const defs = svgEl("defs", {});
    defs.append(fade, mask);
    lit.setAttribute("mask", `url(#circuit-glow-${id})`);
    svg.append(defs, runsLayer, lit);
  } else {
    svg.append(runsLayer);
  }
  // First child, under everything the host holds; the scene that fades the hero's traces finds it at once.
  host.prepend(svg);

  let runs: Run[] = [];
  let signature = "";
  const drawn = new Set<number>();
  let alive = true;
  let timer = 0;
  let watcher: IntersectionObserver | null = null;
  // The hero's trace draws as soon as it is in view (after the curtain on a first visit); a seam's at 70%.
  const hero = host.classList.contains("hero");
  const firstVisit = hero && !document.documentElement.classList.contains("no-curtain");

  const paintLit = () => {
    const shown = runs.filter((_, index) => drawn.has(index)).flat();
    litLine.setAttribute("d", shown.map(line).join(""));
    litPads.setAttribute("d", shown.map(padsOf).join(""));
  };

  const draw = (group: SVGGElement, instant: boolean) => {
    const index = Number(group.dataset.run);
    if (drawn.has(index) && group.classList.contains("is-drawn")) return;
    if (instant) group.setAttribute("data-instant", "");
    // The page's clock starts at navigation, so this is the time left until the curtain has lifted.
    else if (firstVisit) group.style.setProperty("--wait", `${Math.max(0, Math.round(CURTAIN_MS - performance.now()))}ms`);
    group.classList.add("is-drawn");
    drawn.add(index);
    paintLit();
  };

  const build = () => {
    timer = 0;
    if (!alive) return;
    const width = host.offsetWidth;
    if (!width || !host.offsetHeight) return;
    // Mid camera move the words would be measured through a perspective: try again once the host is flat.
    if (Math.abs(host.getBoundingClientRect().width - width) > width * 0.005) {
      timer = window.setTimeout(build, FLAT_RETRY_MS);
      return;
    }
    const next = layOut(host, order);
    const sign = next.map((run) => run.map(line).join("")).join("|");
    // The same drawing (the observer's first report, a font swap that moved nothing): leave it, and any draw in
    // progress, alone.
    if (sign === signature) return;
    signature = sign;
    runs = next;
    watcher?.disconnect();
    runsLayer.replaceChildren();
    const groups = runs.map((run, index) => {
      const group = svgEl("g", { class: "circuit-run", "data-run": String(index) });
      for (const t of run) {
        const path = svgEl("path", { class: "circuit-line", d: line(t) });
        const len = Math.ceil(t.length) + 2;
        path.style.setProperty("--len", `${len}px`);
        path.style.setProperty("--dur", `${t.dur}ms`);
        path.style.setProperty("--at", `${t.at}ms`);
        group.append(path);
        // A start pad is there as its line sets off; an end pad lands as the line arrives.
        const ends: [boolean, Pt, number][] = [
          [t.startPad, t.points[0], t.at],
          [t.endPad, t.points[t.points.length - 1], t.at + t.dur - 80],
        ];
        for (const [on, at, ms] of ends) {
          if (!on) continue;
          const padPath = svgEl("path", { class: "circuit-pad", d: padAt(at) });
          padPath.style.setProperty("--pad-at", `${ms}ms`);
          group.append(padPath);
        }
      }
      runsLayer.append(group);
      return group;
    });
    // A rebuild (a resize, a font swap, "+ more") redraws nothing the visitor has already seen drawn.
    groups.forEach((group, index) => {
      if (drawn.has(index) || !animate) draw(group, true);
    });
    paintLit();
    const waiting = groups.filter((group) => !group.classList.contains("is-drawn"));
    if (!waiting.length || typeof IntersectionObserver === "undefined") {
      waiting.forEach((group) => draw(group, true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          io.unobserve(entry.target);
          // Gone past while the page jumped: there at once. Coming up the window: drawn as current flowing in.
          draw(entry.target as SVGGElement, entry.boundingClientRect.bottom < 0);
        }
      },
      { rootMargin: `${ABOVE} 0px ${hero ? "0px" : DRAW_LINE} 0px`, threshold: 0 },
    );
    waiting.forEach((group) => io.observe(group));
    watcher = io;
  };
  // The first drawing waits for the faces (words and baselines move when they swap in), at most a moment.
  let started = false;
  const first = () => {
    if (started || !alive) return;
    started = true;
    build();
  };
  const schedule = () => {
    if (!started) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(build, REBUILD_MS);
  };

  const resize = new ResizeObserver(schedule);
  resize.observe(host);
  void (document.fonts?.ready ?? Promise.resolve()).then(first);
  const fontWait = window.setTimeout(first, FONT_WAIT_MS);

  const stopDrawing = () => {
    alive = false;
    window.clearTimeout(timer);
    window.clearTimeout(fontWait);
    watcher?.disconnect();
    resize.disconnect();
  };

  if (!interactive || !spot) {
    return () => {
      stopDrawing();
      svg.remove();
    };
  }

  const light = spot;
  let frame = 0;
  let px = 0;
  let py = 0;
  let over = false;
  const pulses = new Set<SVGPathElement>();

  /** Host pixels from client pixels, through any scale a scene has on the host. */
  const local = (clientX: number, clientY: number): [number, number] => {
    const box = svg.getBoundingClientRect();
    const scale = box.width ? host.offsetWidth / box.width : 1;
    return [(clientX - box.left) * scale, (clientY - box.top) * scale];
  };
  const place = () => {
    frame = 0;
    const [x, y] = local(px, py);
    light.setAttribute("cx", x.toFixed(1));
    light.setAttribute("cy", y.toFixed(1));
  };
  const queue = () => {
    if (!frame) frame = requestAnimationFrame(place);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    px = event.clientX;
    py = event.clientY;
    if (!over) {
      over = true;
      svg.classList.add("is-lit");
      // The page can move under a still pointer; only while it is over this host.
      window.addEventListener("scroll", queue, { passive: true });
    }
    queue();
  };
  const onLeave = () => {
    over = false;
    svg.classList.remove("is-lit");
    window.removeEventListener("scroll", queue);
  };

  const pulse = (t: Trace) => {
    if (pulses.size >= MAX_PULSES) return;
    const path = svgEl("path", { class: "circuit-pulse", d: line(t) });
    path.style.strokeDasharray = `${PULSE} ${t.length + PULSE}`;
    svg.append(path);
    pulses.add(path);
    const run = path.animate([{ strokeDashoffset: `${PULSE}px` }, { strokeDashoffset: `${-t.length}px` }], {
      duration: ((t.length + PULSE) / PULSE_SPEED) * 1000,
      easing: "linear",
    });
    const done = () => {
      path.remove();
      pulses.delete(path);
    };
    run.onfinish = done;
    run.oncancel = done;
  };
  const onPress = (event: PointerEvent) => {
    const shown = runs.filter((_, index) => drawn.has(index)).flat();
    if (event.button !== 0 || event.pointerType === "touch" || !shown.length) return;
    const [x, y] = local(event.clientX, event.clientY);
    shown
      .map((t) => ({ t, away: Math.min(...t.points.map(([tx, ty]) => Math.hypot(tx - x, ty - y))) }))
      .filter(({ away }) => away <= PRESS_REACH)
      .sort((a, b) => a.away - b.away)
      .slice(0, PULSES_PER_PRESS)
      .forEach(({ t }) => pulse(t));
  };

  host.addEventListener("pointermove", onMove, { passive: true });
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("pointerdown", onPress, { passive: true });

  return () => {
    stopDrawing();
    cancelAnimationFrame(frame);
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerleave", onLeave);
    host.removeEventListener("pointerdown", onPress);
    window.removeEventListener("scroll", queue);
    pulses.forEach((path) => path.getAnimations().forEach((run) => run.cancel()));
    svg.remove();
  };
}

/** The circuit motif, drawn into every `[data-circuit]` host as inline SVG, so it scrolls with the page and has no
 *  animation loop. One drawing down the page: a quiet trace in the hero from under the devices to a stat, then at every seam a
 *  trace that leaves the section above from its last cards (under the laptop's ports after Work) and arrives on the
 *  next heading's baseline (on the About card's top edge), each drawn once as its seam comes up the window. Lines
 *  keep clear of every word and card. The light around the pointer and the pulse on a press are for fine pointers
 *  with motion allowed; reduced motion gets the still drawing. */
export function startCircuit(): () => void {
  const reduced = window.matchMedia(REDUCED).matches;
  const interactive = !reduced && window.matchMedia(FINE).matches;
  const stops = [...document.querySelectorAll<HTMLElement>("[data-circuit]")].map((host, order) => mountHost(host, order, interactive, !reduced));
  return () => stops.forEach((stop) => stop());
}
