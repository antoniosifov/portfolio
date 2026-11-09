"use client";

import { useEffect, useRef } from "react";

type Point = [number, number];
/** A `late` trace stays hidden on the first screen and fades in with the scroll. */
type Trace = { points: Point[]; lengths: number[]; total: number; late?: boolean };
type Pulse = { trace: Trace; distance: number };

const CELL = 40;
/** Square pixels of page per trace: higher is calmer. */
const DENSITY = 52000;
/** How far the drawing extends below the window, for the scroll parallax. */
const OVERSCAN = 1500;
const PARALLAX = 0.12;
const MAX_OFFSET = OVERSCAN - 100;
const GLOW_RADIUS = 260;
const PULSE_LENGTH = 44;
const PULSE_SPEED = 170;
const MAX_PULSES = 12;

function makeRandom(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Lays out right-angle runs joined by 45° corners. A trace that would come
 *  near one already placed is thrown away, which is what keeps it from looking busy. */
function layOut(width: number, height: number): Trace[] {
  const random = makeRandom(20261109);
  const taken = new Set<string>();
  const key = (col: number, row: number) => `${col}:${row}`;
  const wanted = Math.round((width * height) / DENSITY);
  const traces: Trace[] = [];

  for (let attempt = 0; attempt < wanted * 12 && traces.length < wanted; attempt += 1) {
    let col = Math.floor(random() * (width / CELL));
    let row = Math.floor(random() * (height / CELL));
    const direction = random() > 0.5 ? 1 : -1;
    const points: Point[] = [[col * CELL, row * CELL]];
    const cells: [number, number][] = [];
    const legs = 2 + Math.floor(random() * 3);

    for (let leg = 0; leg < legs; leg += 1) {
      const run = 3 + Math.floor(random() * 7);
      for (let step = 0; step < run; step += 1) {
        col += direction;
        cells.push([col, row]);
      }
      points.push([col * CELL, row * CELL]);
      if (leg === legs - 1) break;

      const slant = 1 + Math.floor(random() * 3);
      const vertical = random() > 0.5 ? 1 : -1;
      for (let step = 0; step < slant; step += 1) {
        col += direction;
        row += vertical;
        cells.push([col, row]);
      }
      points.push([col * CELL, row * CELL]);
    }

    const blocked = cells.some(([c, r]) => [-1, 0, 1].some((dr) => taken.has(key(c, r + dr))));
    if (blocked) continue;
    cells.forEach(([c, r]) => [-1, 0, 1].forEach((dr) => taken.add(key(c, r + dr))));

    const lengths = points.slice(1).map((point, index) => Math.hypot(point[0] - points[index][0], point[1] - points[index][1]));
    traces.push({ points, lengths, total: lengths.reduce((sum, length) => sum + length, 0) });
  }
  return traces;
}

function pointAt(trace: Trace, distance: number): Point {
  let left = Math.max(0, Math.min(trace.total, distance));
  for (let index = 0; index < trace.lengths.length; index += 1) {
    const length = trace.lengths[index];
    if (left <= length) {
      const [x0, y0] = trace.points[index];
      const [x1, y1] = trace.points[index + 1];
      const share = left / length;
      return [x0 + (x1 - x0) * share, y0 + (y1 - y0) * share];
    }
    left -= length;
  }
  return trace.points[trace.points.length - 1];
}

/** The whole-page circuit behind the content: traces light up around the pointer,
 *  a press sends pulses out of the nearest ones, and scrolling drifts the drawing. */
export function CircuitField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let traces: Trace[] = [];
    let lines = new Path2D();
    let pads = new Path2D();
    let lateLines = new Path2D();
    let latePads = new Path2D();
    let pulses: Pulse[] = [];
    let frame = 0;
    let last = 0;
    let nextPulse = 0;
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, glow: 0, targetGlow: 0 };

    const build = () => {
      traces = layOut(width, Math.max(window.innerHeight, window.screen.height) + OVERSCAN);
      pulses = [];
      lines = new Path2D();
      pads = new Path2D();
      lateLines = new Path2D();
      latePads = new Path2D();
      const screen = window.innerHeight;
      traces.forEach((trace, order) => {
        const { points } = trace;
        // The first screen keeps a few traces beside the devices, clear of the menu, the text and the stats.
        const onFirstScreen = points.some(([, y]) => y < screen);
        const nearContent = points.some(([x, y]) => x < width * 0.46 || y < screen * 0.12 || y > screen * 0.82);
        trace.late = onFirstScreen && (order % 3 !== 0 || nearContent);

        const path = trace.late ? lateLines : lines;
        const dots = trace.late ? latePads : pads;
        points.forEach(([x, y], index) => (index ? path.lineTo(x, y) : path.moveTo(x, y)));
        [points[0], points[points.length - 1]].forEach(([x, y]) => {
          dots.moveTo(x + 3, y);
          dots.arc(x, y, 3, 0, Math.PI * 2);
        });
      });
    };

    /** 0 on the first screen, 1 once the visitor has scrolled away from it. */
    const lateAmount = () => (calm ? 0 : Math.min(1, Math.max(0, (window.scrollY - height * 0.15) / (height * 0.55))));

    const scrollOffset = () => Math.min(window.scrollY * PARALLAX, MAX_OFFSET);

    const visibleTraces = (offset: number) =>
      traces.filter(({ points, late }) => (!late || lateAmount() > 0.5) && points.some(([, y]) => y > offset - 40 && y < offset + height + 40));

    const paint = (delta: number) => {
      const offset = calm ? 0 : scrollOffset();
      context.setTransform(ratio, 0, 0, ratio, 0, -offset * ratio);
      context.clearRect(0, offset, width, height);
      context.lineWidth = 1;

      context.strokeStyle = "rgba(216, 176, 131, 0.24)";
      context.fillStyle = "rgba(216, 176, 131, 0.42)";
      context.stroke(lines);
      context.fill(pads);

      const late = lateAmount();
      if (late > 0.01) {
        context.globalAlpha = late;
        context.stroke(lateLines);
        context.fill(latePads);
        context.globalAlpha = 1;
      }

      if (pointer.glow > 0.01) {
        const y = pointer.y + offset;
        const light = context.createRadialGradient(pointer.x, y, 0, pointer.x, y, GLOW_RADIUS);
        light.addColorStop(0, `rgba(215, 255, 95, ${0.95 * pointer.glow})`);
        light.addColorStop(1, "rgba(215, 255, 95, 0)");
        context.strokeStyle = light;
        context.fillStyle = light;
        context.lineWidth = 1.4;
        context.stroke(lines);
        context.fill(pads);
        // The pointer also reveals the traces still hidden on the first screen.
        context.stroke(lateLines);
        context.fill(latePads);
      }

      context.strokeStyle = "#d7ff5f";
      context.lineWidth = 2;
      context.lineCap = "round";
      pulses = pulses.filter((pulse) => pulse.distance - PULSE_LENGTH < pulse.trace.total);
      pulses.forEach((pulse) => {
        pulse.distance += PULSE_SPEED * delta;
        context.beginPath();
        for (let sample = 0; sample <= 6; sample += 1) {
          const [x, y] = pointAt(pulse.trace, pulse.distance - (PULSE_LENGTH * sample) / 6);
          if (sample) context.lineTo(x, y);
          else context.moveTo(x, y);
        }
        context.stroke();
      });
    };

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      pointer.x += (pointer.targetX - pointer.x) * 0.16;
      pointer.y += (pointer.targetY - pointer.y) * 0.16;
      pointer.glow += (pointer.targetGlow - pointer.glow) * 0.08;

      if (now > nextPulse && pulses.length < MAX_PULSES) {
        const pool = visibleTraces(scrollOffset());
        if (pool.length) pulses.push({ trace: pool[Math.floor(Math.random() * pool.length)], distance: 0 });
        nextPulse = now + 1100;
      }

      paint(delta);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (calm || frame || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    let builtWidth = 0;
    const resize = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      // clientWidth leaves out the scrollbar, so the drawing stays under the pointer.
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      // A phone's address bar changes the height while scrolling; only a new width needs a new layout.
      if (width !== builtWidth) {
        builtWidth = width;
        build();
      }
      if (calm) paint(0);
    };

    const onMove = (event: PointerEvent) => {
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      if (pointer.glow < 0.02) {
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      }
      pointer.targetGlow = 1;

      const card = event.target instanceof Element ? event.target.closest<HTMLElement>(".card, .contact-links a") : null;
      if (card) {
        const box = card.getBoundingClientRect();
        card.style.setProperty("--x", `${event.clientX - box.left}px`);
        card.style.setProperty("--y", `${event.clientY - box.top}px`);
      }
    };

    const onLeave = () => {
      pointer.targetGlow = 0;
    };

    const onPress = (event: PointerEvent) => {
      const offset = scrollOffset();
      const y = event.clientY + offset;
      const nearest = traces
        .map((trace) => ({ trace, away: Math.min(...trace.points.map(([px, py]) => Math.hypot(px - event.clientX, py - y))) }))
        .sort((a, b) => a.away - b.away)
        .slice(0, 4);
      nearest.forEach(({ trace }) => pulses.push({ trace, distance: 0 }));
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    window.addEventListener("resize", resize);

    if (!calm) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerdown", onPress, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      document.addEventListener("visibilitychange", onVisibility);
      start();
    }

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onPress);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className="circuit-field" aria-hidden="true" />;
}
