import { initQuiet } from "@/lib/quiet";
import { startAnchors } from "./anchors";
import { startChapters } from "./chapters";
import { DESK, PHONE } from "./conditions";
import { startPlace } from "./place";
import { restScene, type RestCtx, runMeasures, sceneHost } from "./stage";

const ARM_TIMEOUT_MS = 8000;
const REMEASURE_DEBOUNCE_MS = 150;

/** A window that matches neither plan still gets a light scroll scene, written in CSS with scroll timelines
 *  (app/styles/25-lite.css). It runs while this class is on <html>: no plan matches, motion is allowed on
 *  screen, and the page is not calm. */
const LITE = "is-lite";
const MOTION_ALLOWED = "screen and (prefers-reduced-motion: no-preference)";

/** Every scene as its finished composition, with no GSAP on the page. */
function startRest(plan: () => RestCtx["plan"]): () => void {
  let stopped = false;
  let timer = 0;
  let host: ReturnType<typeof sceneHost> | undefined;

  const mark = () => document.querySelectorAll(".scene[data-scene]").forEach((root) => root.classList.add("is-rest"));
  const remeasure = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(runMeasures, REMEASURE_DEBOUNCE_MS);
  };
  const onWorkChanged = () => {
    mark();
    host?.sync();
    runMeasures();
  };

  mark();
  // Only the extras of the finished compositions live in that chunk: the page is complete without them.
  import("@/lib/scenes")
    .then(({ scenes }) => {
      if (stopped) return;
      host = sceneHost(scenes, (def, root) => restScene(def, root, plan()));
      host.sync();
    })
    .catch((error) => console.error(error));

  window.addEventListener("resize", remeasure);
  window.addEventListener("work:changed", onWorkChanged);
  if (document.readyState !== "complete") window.addEventListener("load", remeasure, { once: true });
  void document.fonts?.ready.then(() => {
    if (!stopped) remeasure();
  });

  return () => {
    stopped = true;
    window.clearTimeout(timer);
    window.removeEventListener("resize", remeasure);
    window.removeEventListener("load", remeasure);
    window.removeEventListener("work:changed", onWorkChanged);
    host?.stop();
    document.querySelectorAll(".scene[data-scene]").forEach((root) => root.classList.remove("is-rest"));
  };
}

/** Runs after hydration and keeps GSAP out of the first load: anchors, chapters and the quiet layer
 *  start at once, the runtime chunk only the first time a window matches a motion plan. */
export function boot(): () => void {
  const html = document.documentElement;
  const desk = window.matchMedia(DESK);
  const phone = window.matchMedia(PHONE);
  const allowed = window.matchMedia(MOTION_ALLOWED);
  const stops = [startAnchors(), startChapters(), initQuiet(), startPlace()];
  const planNow = (): RestCtx["plan"] => (desk.matches ? "desk" : phone.matches ? "phone" : "none");

  let disposed = false;
  let requested = false;
  let armTimer = 0;
  let stopRuntime: (() => void) | undefined;
  let stopRest: (() => void) | undefined;

  /** Follows every plan change both ways, also after the runtime owns the plans. calm arrives before boot, in
   *  giveUp (which calls this), or from the frame guard while a plan matches, so reading it on each change is enough. */
  const lite = () => {
    html.classList.toggle(LITE, allowed.matches && !desk.matches && !phone.matches && !html.classList.contains("calm"));
  };

  const rest = () => {
    stopRest ??= startRest(planNow);
  };

  /** No runtime, or no working one: the runways collapse to the finished compositions. */
  const giveUp = () => {
    window.clearTimeout(armTimer);
    if (disposed) return;
    html.classList.add("calm");
    lite();
    stopRuntime?.();
    stopRuntime = undefined;
    rest();
  };

  const sync = () => {
    if (requested) return; // From here on gsap.matchMedia owns every plan change.
    if (html.classList.contains("calm") || (!desk.matches && !phone.matches)) {
      rest();
      return;
    }
    stopRest?.();
    stopRest = undefined;
    requested = true;
    armTimer = window.setTimeout(() => {
      if (!html.classList.contains("is-armed")) giveUp();
    }, ARM_TIMEOUT_MS);
    import("./runtime")
      .then(({ startRuntime }) => {
        if (disposed || html.classList.contains("calm")) return;
        stopRuntime = startRuntime(giveUp);
      })
      .catch((error) => {
        console.error(error);
        giveUp();
      });
  };

  lite();
  sync();
  desk.addEventListener("change", sync);
  phone.addEventListener("change", sync);
  for (const query of [desk, phone, allowed]) query.addEventListener("change", lite);

  return () => {
    disposed = true;
    window.clearTimeout(armTimer);
    desk.removeEventListener("change", sync);
    phone.removeEventListener("change", sync);
    for (const query of [desk, phone, allowed]) query.removeEventListener("change", lite);
    html.classList.remove(LITE);
    stopRuntime?.();
    stopRest?.();
    stops.forEach((stop) => stop());
  };
}
