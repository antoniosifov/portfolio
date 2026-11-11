/** The stage every scroll scene runs on: a TS port of the shared `stage.js`. This module has no GSAP
 *  in its import graph (types only), so anchors and the boot path can use `Stage` before, or without,
 *  the runtime chunk; `runtime.ts` hands GSAP in through `installEngine`. */
import type gsapEngine from "gsap";
import type { ScrollTrigger as ScrollTriggerClass } from "gsap/ScrollTrigger";
import { DESK, FINE_POINTER, PHONE } from "./conditions";

type Gsap = typeof gsapEngine;
type ScrollTriggerStatic = typeof ScrollTriggerClass;

type CommonCtx = {
  /** The `.scene` element. */
  root: HTMLElement;
  /** `:scope > .scene-stage`, null for rails. */
  stage: HTMLElement | null;
  /** Searches `within`; by default the runway for a rail (`.through`, `.finale`), otherwise `root`. */
  q<T extends Element = HTMLElement>(selector: string, within?: ParentNode): T[];
  /** Same scope as `q`. Throws when nothing matches, so a scene never half-builds. */
  one<T extends Element = HTMLElement>(selector: string, within?: ParentNode): T;
  /** One lvh screen in px, from `#lvh-probe`. */
  lvh(): number;
  /** Runs now, at every ScrollTrigger refresh, on `work:changed`, after fonts and images. */
  onMeasure(fn: () => void): void;
};

export type SceneCtx = CommonCtx & {
  plan: "desk" | "phone";
  /** Screens of scroll the stage is held for. Read from CSS, never set from JS. */
  hold: number;
  gsap: Gsap;
  ScrollTrigger: ScrollTriggerStatic;
};

/** What `rest()` gets. It can run on a page where GSAP was never loaded, so there is none here. */
export type RestCtx = CommonCtx & {
  /** The plan the window matches; "none" for a window that matches neither. */
  plan: "desk" | "phone" | "none";
};

export type Plan = {
  /** Default .4 on fine pointers, true on touch. */
  scrub?: number | boolean;
  build(tl: gsap.core.Timeline, ctx: SceneCtx): void | (() => void);
};

export type SceneDef = {
  id: "through" | "handwriting" | "pullback";
  desk: Plan | "rest";
  phone: Plan | "rest";
  /** Fetched and decoded after load, on live plans only. */
  warm?: string[];
  /** JS-side extras of the finished composition. */
  rest?(ctx: RestCtx): void | (() => void);
};

type Engine = { gsap: Gsap; ScrollTrigger: ScrollTriggerStatic; fail(error: unknown): void };

const HOLD_VARIABLE: Record<SceneDef["id"], string> = {
  through: "--hold-through",
  handwriting: "--hold-icu",
  pullback: "--hold-pull",
};
const REFRESH_DEBOUNCE = 150;

let engine: Engine | null = null;
let refreshTimer = 0;
const measures = new Set<() => void>();
const timelines = new Set<gsap.core.Timeline>();
const triggers = new Map<SceneDef["id"], ScrollTrigger>();

export function installEngine(next: Engine | null) {
  engine = next;
  if (!next) window.clearTimeout(refreshTimer);
}

export function lvh() {
  return document.getElementById("lvh-probe")?.offsetHeight || window.innerHeight;
}

export function runMeasures() {
  measures.forEach((fn) => fn());
  // A refresh moves a timeline with events suppressed, so a page that loads or re-measures part way
  // through a run would otherwise keep its old picture until the next scroll.
  timelines.forEach((timeline) => timeline.render(timeline.totalTime(), false, true));
}

function commonCtx(def: SceneDef, root: HTMLElement): { ctx: CommonCtx; dispose(): void } {
  const scope: ParentNode = root.classList.contains("scene-rail") ? (root.parentElement ?? root) : root;
  const own: (() => void)[] = [];
  return {
    ctx: {
      root,
      stage: root.querySelector<HTMLElement>(":scope > .scene-stage"),
      q: <T extends Element = HTMLElement>(selector: string, within: ParentNode = scope) => [...within.querySelectorAll<T>(selector)],
      one: <T extends Element = HTMLElement>(selector: string, within: ParentNode = scope) => {
        const found = within.querySelector<T>(selector);
        if (!found) throw new Error(`Scene "${def.id}": nothing matches ${selector}`);
        return found;
      },
      lvh,
      onMeasure(fn) {
        own.push(fn);
        measures.add(fn);
        fn();
      },
    },
    dispose() {
      own.forEach((fn) => measures.delete(fn));
    },
  };
}

/** A scene as its finished composition. Needs no GSAP, so the boot path shares it. */
export function restScene(def: SceneDef, root: HTMLElement, plan: RestCtx["plan"]): () => void {
  root.classList.remove("is-live");
  root.classList.add("is-rest");
  const { ctx, dispose } = commonCtx(def, root);
  const undo = def.rest?.({ ...ctx, plan });
  return () => {
    if (typeof undo === "function") undo();
    dispose();
    root.classList.remove("is-rest");
  };
}

function liveScene(def: SceneDef, root: HTMLElement, plan: Plan, name: "desk" | "phone", { gsap, ScrollTrigger, fail }: Engine): () => void {
  const { ctx, dispose } = commonCtx(def, root);
  const hold = parseFloat(getComputedStyle(root).getPropertyValue(HOLD_VARIABLE[def.id])) || 0;
  root.classList.remove("is-rest");
  root.classList.add("is-live");

  // No invalidateOnRefresh: a scene renders from one state and re-measures in onMeasure, and reverting
  // that state on every refresh would snap the picture back to p=0.
  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: root,
      start: "top top",
      // Ends exactly where the sticky releases, even with a phone toolbar in play.
      end: () => `+=${hold * lvh()}`,
      scrub: plan.scrub ?? (window.matchMedia(FINE_POINTER).matches ? 0.4 : true),
      onUpdate: (self) => root.style.setProperty("--p", self.progress.toFixed(4)),
    },
  });
  let undo: void | (() => void);
  try {
    undo = plan.build(timeline, { ...ctx, plan: name, hold, gsap, ScrollTrigger });
    // Padded to exactly 1, so positions in build() read as fractions of the hold.
    if (timeline.duration() < 1) timeline.to({}, { duration: 1 - timeline.duration() }, timeline.duration());
    timelines.add(timeline);
    if (timeline.scrollTrigger) triggers.set(def.id, timeline.scrollTrigger);
  } catch (error) {
    fail(error);
  }

  return () => {
    if (typeof undo === "function") undo();
    dispose();
    timelines.delete(timeline);
    triggers.delete(def.id);
    root.classList.remove("is-live");
    root.style.removeProperty("--p");
    Stage.header(null);
  };
}

export const Stage = {
  /** Sets `html[data-header]`: the ground under the fixed header while a scene owns the screen. */
  header(state: "clear" | "scrim" | null) {
    const html = document.documentElement;
    if (state) html.dataset.header = state;
    else delete html.dataset.header;
  },

  /** Sets `data-paused`, for loops an IntersectionObserver cannot see stop during a hold. */
  pauseLoops(el: Element, paused: boolean) {
    el.toggleAttribute("data-paused", paused);
  },

  /** Jumps every scrub tween to its end, so an instant jump never replays a scene. */
  settle() {
    if (!engine) return;
    engine.ScrollTrigger.update();
    for (const trigger of engine.ScrollTrigger.getAll()) {
      // The scrub tween is 0 for `scrub: true`, so optional chaining is not enough here.
      const tween = trigger.getTween();
      if (tween) tween.progress(1);
    }
  },

  /** Debounced `ScrollTrigger.refresh`. */
  refresh() {
    if (!engine) return;
    window.clearTimeout(refreshTimer);
    refreshTimer = window.setTimeout(() => engine?.ScrollTrigger.refresh(), REFRESH_DEBOUNCE);
  },

  /** `ScrollTrigger.refresh` at once, in place of a pending debounced one. False when there is no engine. */
  refreshNow(): boolean {
    if (!engine) return false;
    window.clearTimeout(refreshTimer);
    engine.ScrollTrigger.refresh();
    return true;
  },

  /** Fetches and decodes, then swaps any `.el-art` whose `data-master` is that URL to the master. */
  async warm(urls: string[]): Promise<void> {
    await Promise.all(
      urls.map(async (url) => {
        try {
          const image = new Image();
          image.src = url;
          await image.decode();
        } catch {
          return; // A master that cannot be loaded leaves the 1x art in place.
        }
        document.querySelectorAll<HTMLImageElement>(".el-art[data-master]").forEach((art) => {
          if (art.dataset.master !== url) return;
          art.src = url;
          delete art.dataset.master;
        });
      }),
    );
  },

  /** Runs one scene through every plan change. Needs the engine. Returns a full revert. */
  scene(def: SceneDef, root: HTMLElement): () => void {
    if (!engine) throw new Error("Stage.scene needs the runtime");
    const running = engine;
    const media = running.gsap.matchMedia();
    // `any` is the catch-all: without it a window matching neither plan would not run the callback.
    media.add({ desk: DESK, phone: PHONE, any: "all" }, (context) => {
      const { desk, phone } = context.conditions as { desk: boolean; phone: boolean };
      const name = desk ? "desk" : phone ? "phone" : null;
      const plan = name ? def[name] : "rest";
      if (!name || plan === "rest" || document.documentElement.classList.contains("calm")) {
        return restScene(def, root, name ?? "none");
      }
      return liveScene(def, root, plan, name, running);
    });
    return () => media.revert();
  },

  /** The ScrollTrigger of a scene that is live right now. */
  trigger(id: SceneDef["id"]) {
    return triggers.get(id);
  },
};

/** Keeps one running scene per `.scene[data-scene]` in the document. `sync` picks up scenes that a
 *  filter brought back and retires the ones it removed, since React replaces those nodes. */
export function sceneHost(registry: Record<string, SceneDef>, start: (def: SceneDef, root: HTMLElement) => () => void) {
  const running = new Map<HTMLElement, () => void>();
  return {
    sync() {
      for (const [root, stop] of running) {
        if (root.isConnected) continue;
        stop();
        running.delete(root);
      }
      document.querySelectorAll<HTMLElement>(".scene[data-scene]").forEach((root) => {
        if (running.has(root)) return;
        const def = registry[root.dataset.scene ?? ""];
        if (def) running.set(root, start(def, root));
      });
    },
    stop() {
      running.forEach((stopScene) => stopScene());
      running.clear();
    },
  };
}
