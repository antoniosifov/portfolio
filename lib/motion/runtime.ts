import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scenes } from "@/lib/scenes";
import { afterRefresh } from "./place";
import { installEngine, runMeasures, sceneHost, Stage } from "./stage";

const SLOW_FRAME_MS = 50;
const FRAME_WINDOW = 60;
const SLOW_FRAMES_ALLOWED = 12;
const STILL_AFTER_MS = 150;

function afterLoadAndIdle(run: () => void) {
  const idle = () => (window.requestIdleCallback ? window.requestIdleCallback(() => run(), { timeout: 2000 }) : window.setTimeout(run, 200));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

/** Counts frames over 50 ms while `isScrubbing` holds. More than 12 in a rolling 60 means this device
 *  cannot carry the flight, and `trip` takes the page to its finished compositions for the session. */
function startFrameGuard(isScrubbing: () => boolean, trip: () => void): () => void {
  const frames = new Uint8Array(FRAME_WINDOW);
  let cursor = 0;
  let slow = 0;
  let raf = 0;
  let last = 0;
  let lastScroll = 0;

  const tick = (now: number) => {
    raf = 0;
    if (last) {
      const isSlow = now - last > SLOW_FRAME_MS ? 1 : 0;
      slow += isSlow - frames[cursor];
      frames[cursor] = isSlow;
      cursor = (cursor + 1) % FRAME_WINDOW;
      if (slow > SLOW_FRAMES_ALLOWED) {
        trip();
        return;
      }
    }
    last = now;
    if (now - lastScroll < STILL_AFTER_MS && isScrubbing()) raf = requestAnimationFrame(tick);
  };

  const onScroll = () => {
    lastScroll = performance.now();
    if (raf || document.hidden || !isScrubbing()) return;
    last = 0;
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
  };
}

/** Starts GSAP and every scene. `onFail` is the way out when a scene cannot be built: boot then takes
 *  the whole page to its finished compositions. Returns a full teardown. */
export function startRuntime(onFail: () => void): () => void {
  const html = document.documentElement;
  const through = document.querySelector<HTMLElement>(".through");
  const hero = through?.querySelector<HTMLElement>(":scope > .hero") ?? null;
  const main = document.querySelector("main");
  let alive = true;
  let failed = false;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  installEngine({
    gsap,
    ScrollTrigger,
    fail(error) {
      console.error(error);
      if (failed) return;
      failed = true;
      // After the current build finishes, so the teardown can reach everything it started.
      queueMicrotask(() => {
        if (alive) onFail();
      });
    },
  });

  const host = sceneHost(scenes, (def, root) => Stage.scene(def, root));

  // In `refreshInit`, before ScrollTrigger measures, so the rail is already where it will end up.
  // A new hero height moves the rail and everything below it. The first paint used the height measured as the hero
  // was parsed, often in the fallback font (1067x677 in production: 729 px, then 702 once Geist is in), so a reload
  // or a link to /#work landed that far off. The visitor is kept where they were: `drift` is how far the content
  // below the hero moved, and is scrolled back once ScrollTrigger has put the raw position back (it records the
  // scroll before refreshInit and restores it after measuring).
  const rail = through?.querySelector<HTMLElement>(":scope > .scene-rail") ?? null;
  let drift = 0;
  const writeHeroHeight = () => {
    if (!through || !hero) return;
    const from = rail?.offsetTop ?? 0;
    through.style.setProperty("--hero-h", `${hero.offsetHeight}px`);
    through.style.setProperty("--hero-over", `max(0px, calc(${hero.offsetHeight}px - 100svh))`);
    if (window.scrollY > from) drift += (rail?.offsetTop ?? 0) - from;
  };
  const keepPlace = () => {
    const by = drift;
    drift = 0;
    if (Math.abs(by) >= 1) window.scrollTo({ top: window.scrollY + by, behavior: "instant" });
  };

  const onWorkChanged = () => {
    host.sync();
    runMeasures();
    Stage.refresh();
  };

  const layout = new ResizeObserver(() => Stage.refresh());
  if (main) layout.observe(main);
  if (hero) layout.observe(hero);

  ScrollTrigger.addEventListener("refreshInit", writeHeroHeight);
  ScrollTrigger.addEventListener("refresh", keepPlace);
  ScrollTrigger.addEventListener("refresh", runMeasures);
  // Last, so a resize puts the reader back on the place they were reading, after the scenes have re-measured.
  ScrollTrigger.addEventListener("refresh", afterRefresh);
  window.addEventListener("work:changed", onWorkChanged);

  const stopGuard = startFrameGuard(
    () => Stage.trigger("through")?.isActive === true,
    () => {
      try {
        sessionStorage.setItem("motion", "calm");
      } catch {
        // Storage can be blocked; the class still holds for this page view.
      }
      html.classList.add("calm");
      stopGuard();
      host.stop();
      host.sync();
      const work = document.getElementById("work");
      if (work) {
        const pad = parseFloat(getComputedStyle(html).scrollPaddingTop) || 0;
        window.scrollTo({ top: work.getBoundingClientRect().top + window.scrollY - pad, behavior: "instant" });
      }
    },
  );

  // The first write is outside a refresh, so the place is kept at once, net of anything scroll anchoring did.
  const startY = window.scrollY;
  writeHeroHeight();
  const startDrift = drift - (window.scrollY - startY);
  drift = 0;
  if (Math.abs(startDrift) >= 1) window.scrollTo({ top: window.scrollY + startDrift, behavior: "instant" });
  host.sync();
  ScrollTrigger.refresh();
  Stage.settle();
  html.classList.add("is-armed");

  void document.fonts?.ready.then(() => {
    if (alive) Stage.refresh();
  });

  afterLoadAndIdle(() => {
    if (!alive) return;
    const urls = new Set<string>();
    document.querySelectorAll<HTMLElement>(".scene.is-live[data-scene]").forEach((root) => {
      scenes[root.dataset.scene ?? ""]?.warm?.forEach((url) => urls.add(url));
    });
    if (!urls.size) return;
    void Stage.warm([...urls]).then(() => {
      if (alive) Stage.refresh();
    });
  });

  return () => {
    alive = false;
    stopGuard();
    layout.disconnect();
    window.removeEventListener("work:changed", onWorkChanged);
    ScrollTrigger.removeEventListener("refreshInit", writeHeroHeight);
    ScrollTrigger.removeEventListener("refresh", keepPlace);
    ScrollTrigger.removeEventListener("refresh", runMeasures);
    ScrollTrigger.removeEventListener("refresh", afterRefresh);
    host.stop();
    installEngine(null);
    html.classList.remove("is-armed");
    through?.style.removeProperty("--hero-h");
    through?.style.removeProperty("--hero-over");
  };
}
