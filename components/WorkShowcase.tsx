"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { additionalProjects, compactProjects, projects, type Category, type Project } from "@/data/portfolio";
import { PHONE, PHONE_LANDED } from "@/lib/motion/conditions";
import { once } from "@/lib/motion/once";
import { Icon } from "./Icons";
import { LiveDemo, warmDemo } from "./LiveDemo";

type Filter = "all" | Category;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "ai", label: "AI" },
  { id: "automation", label: "Automation" },
];

/** The slide whose app can be opened in place. */
const DEMO_PROJECT = "04";

/** What a slide shows its project on. Two neighbours of the same shape keep the device still while the
 *  screen changes (30-work.css); any other pair simply slides. */
type Shape = "phones" | "laptop-phone" | "laptop";
const shapeOf = (project: Project): Shape =>
  project.presentation === "mobile" ? "phones" : project.devices?.mobile ? "laptop-phone" : "laptop";

const order = (index: number) => ({ "--i": index }) as CSSProperties;

/** A compact card's source code, from the project it shortens (the card itself links to the live app). */
const sourceOf = (title: string) => projects.find((project) => project.shortTitle === title)?.github;

function PhoneFrame({ src, alt, className = "", eager = false }: { src: string; alt: string; className?: string; eager?: boolean }) {
  return (
    <div className={`dv-phone ${className}`.trim()}>
      <span className="dv-phone-notch" aria-hidden="true" />
      <img src={src} alt={alt} width="430" height="932" loading={eager ? "eager" : "lazy"} decoding="async" />
    </div>
  );
}

function Devices({ project, eager }: { project: Project; eager: boolean }) {
  if (project.presentation === "mobile") {
    const positions = ["is-left", "is-center", "is-right"];
    return (
      <div className="dv-phones">
        {project.gallery?.slice(0, 3).map((screen, index) => (
          <PhoneFrame key={screen.src} src={screen.src} alt={screen.alt} className={positions[index]} eager={eager} />
        ))}
      </div>
    );
  }

  const desktop = project.devices?.desktop ?? project.cover;
  const mobile = project.devices?.mobile;
  // The band a capture wider than the screen leaves under it takes the capture's own page colour (data, 30-work.css).
  const ground = project.screenBg;

  return (
    <div className={mobile ? "dv-set has-phone" : "dv-set"}>
      <div className="dv-laptop">
        <div className="dv-laptop-screen" style={ground ? ({ "--screen-bg": ground } as CSSProperties) : undefined}>
          {desktop ? (
            <img
              src={desktop}
              alt={project.coverAlt ?? `${project.shortTitle} on a laptop`}
              width="1600"
              height="1000"
              loading={eager ? "eager" : "lazy"}
              decoding="async"
            />
          ) : null}
        </div>
        <span className="dv-laptop-base" aria-hidden="true" />
      </div>
      {mobile ? <PhoneFrame src={mobile} alt={`${project.shortTitle} on a phone`} className="is-front" eager={eager} /> : null}
    </div>
  );
}

function Slide({
  project,
  index,
  active,
  eager,
  ready,
  held,
  chips,
  icons,
}: {
  project: Project;
  index: number;
  active: boolean;
  eager: boolean;
  ready: boolean;
  held: { prev: boolean; next: boolean };
  chips: ReactNode;
  icons: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = `work-details-${project.index}`;
  const demo = project.index === DEMO_PROJECT && Boolean(project.live) && Boolean(project.cover);

  return (
    <article
      className={`slide ${active ? "is-active" : ""}`.trim()}
      style={order(index)}
      data-prev={held.prev ? "same" : undefined}
      data-next={held.next ? "same" : undefined}
      aria-roledescription="slide"
      aria-label={project.shortTitle}
      inert={ready && !active}
    >
      <div className="slide-main">
        <div className="slide-media">
          <Devices project={project} eager={eager} />
        </div>

        <div className="slide-copy">
          <p className="slide-status">
            <span aria-hidden="true" />
            {project.status}
          </p>
          <h3>{project.title.split(" — ")[0]}</h3>
          <p className="slide-statement">{project.statement}</p>
          <p className="slide-desc">{project.description}</p>
          {icons}
          <div className={demo ? "slide-actions has-demo" : "slide-actions"}>
            {demo && project.live && project.cover ? <LiveDemo src={project.live} poster={project.cover} name={project.shortTitle} /> : null}
            {project.live ? (
              <a className="btn btn-primary live-link" href={project.live} target="_blank" rel="noreferrer">
                {project.presentation === "mobile" ? "Visit product site" : "Open live project"}
                <Icon name="arrow-up-right" size={16} />
              </a>
            ) : null}
            {/* Beside a Live demo it steps down to a quiet link with View details (30-work.css), so the two
                buttons keep one row. Elsewhere it stays a button and the arrow is not drawn. */}
            {project.github ? (
              <a className="btn btn-outline source-link" href={project.github} target="_blank" rel="noreferrer">
                Source code
                <Icon name="arrow-up-right" size={16} />
              </a>
            ) : null}
            <button
              type="button"
              className="slide-toggle"
              aria-expanded={open}
              aria-controls={detailsId}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? "Hide details" : "View details"}
              <Icon name="arrow-right" size={16} className={open ? "is-open" : undefined} />
            </button>
          </div>
        </div>
      </div>

      <div id={detailsId} className="slide-details" hidden={!open}>
        <ul className="slide-highlights">
          {project.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {chips}
      </div>
    </article>
  );
}

type MoreProject = { year: string; title: string; type: string; description: string; href?: string };

function MoreRow({ project }: { project: MoreProject }) {
  const content = (
    <>
      <span className="work-list-year">{project.year}</span>
      <span className="work-list-main">
        <span className="work-list-title">{project.title}</span>
        <span className="work-list-type">{project.type}</span>
      </span>
      <span className="work-list-desc">{project.description}</span>
    </>
  );

  // Confidential work has nothing public to link to.
  if (!project.href) return <div className="work-list-row">{content}</div>;

  return (
    <a className="work-list-row" href={project.href} target="_blank" rel="noreferrer">
      {content}
      <Icon name="arrow-up-right" size={16} />
    </a>
  );
}

/** True once scene A has landed on Work (or never runs here): the through rail's progress has reached 1,
 *  or the rail is not live. Ceru's phones only float, and Work's one-shot reveals only arm, from then on,
 *  because before that Work is a picture in flight and everything in it would "enter" at once. */
function useLanded() {
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    const rail = document.querySelector<HTMLElement>('.scene[data-scene="through"]');
    if (!rail) {
      setLanded(true);
      return;
    }
    // The rail's style changes on every frame of scene A; only a change of the answer reaches React, so the
    // showcase does not re-render once per frame of the flight.
    // On the PHONE plan the dolly ends, and Work is live, at PHONE_LANDED; the desk lands at 1.
    let last: boolean | null = null;
    const phone = window.matchMedia(PHONE);
    const check = () => {
      const progress = parseFloat(rail.style.getPropertyValue("--p"));
      const next = !rail.classList.contains("is-live") || (phone.matches ? progress >= PHONE_LANDED : progress > 0.999);
      if (next === last) return;
      last = next;
      setLanded(next);
    };
    check();
    const watch = new MutationObserver(check);
    watch.observe(rail, { attributes: true, attributeFilter: ["class", "style"] });
    return () => watch.disconnect();
  }, []);
  return landed;
}

export function WorkShowcase({
  chips,
  icons,
  tools,
  scene,
  sceneCategories = [],
}: {
  chips: Record<string, ReactNode>;
  icons: Record<string, ReactNode>;
  tools: Record<string, ReactNode>;
  /** Scene B, rendered on the server; shown whenever the filter includes its project. */
  scene?: ReactNode;
  sceneCategories?: Category[];
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLSpanElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const wellPlaced = useRef(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState({ grid: false, list: false });
  const landed = useLanded();

  useEffect(() => setReady(true), []);

  const matches = (categories: Category[]) => filter === "all" || categories.includes(filter);

  // A project told as a scene of its own never repeats in the carousel. The carousel needs something to put
  // on the screens; a project without any capture is listed below instead of being shown in an empty laptop.
  const showcase = projects.filter((project) => project.cover && !project.scene && matches(project.categories));
  const compact = compactProjects.filter((project) => matches(project.categories));
  const listed = [
    ...projects
      .filter(
        (project) =>
          !project.cover && !project.scene && matches(project.categories) && !compactProjects.some((card) => card.title === project.shortTitle),
      )
      .map((project) => ({
        year: project.year,
        title: project.shortTitle,
        type: project.type,
        description: project.description,
        href: project.live ?? project.github,
      })),
    ...additionalProjects.filter((project) => matches(project.categories)),
  ];
  const showScene = Boolean(scene) && sceneCategories.length > 0 && matches(sceneCategories);
  const shapes = showcase.map(shapeOf);
  const activeProject = showcase[active]?.index;

  // After React commits, the motion layer re-measures: scene A arms only on Ceru, and a filter can add or
  // remove the ICU scene.
  useEffect(() => {
    window.dispatchEvent(new Event("work:changed"));
  }, [filter, active]);

  useEffect(() => {
    if (activeProject === DEMO_PROJECT) warmDemo();
  }, [activeProject]);

  // One graphite well under the pressed filter, moved from button to button rather than repainted.
  const placeWell = useCallback((animate: boolean) => {
    const group = filtersRef.current;
    const well = wellRef.current;
    const pressed = group?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!group || !well || !pressed) return;
    if (!animate) well.style.transition = "none";
    well.style.width = `${pressed.offsetWidth}px`;
    well.style.height = `${pressed.offsetHeight}px`;
    well.style.transform = `translate(${pressed.offsetLeft}px, ${pressed.offsetTop}px)`;
    if (!animate) {
      void well.offsetWidth; // commit the jump before the transition comes back
      well.style.removeProperty("transition");
    }
    group.dataset.well = "";
  }, []);

  useLayoutEffect(() => {
    placeWell(wellPlaced.current);
    wellPlaced.current = true;
  }, [filter, placeWell]);

  useEffect(() => {
    const group = filtersRef.current;
    if (!group) return;
    const resize = new ResizeObserver(() => placeWell(false));
    resize.observe(group);
    group.querySelectorAll("button").forEach((button) => resize.observe(button));
    return () => resize.disconnect();
  }, [placeWell]);

  // The tallest copy sets every slide's row height, so devices sit at one height and a held laptop never jumps.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const copies = [...track.querySelectorAll<HTMLElement>(".slide-copy")];
    const fit = () => track.style.setProperty("--copy-h", `${Math.max(0, ...copies.map((copy) => copy.offsetHeight))}px`);
    const resize = new ResizeObserver(fit);
    copies.forEach((copy) => resize.observe(copy));
    return () => resize.disconnect();
  }, [filter]);

  // One-shot reveals of the cards and the list, armed only once Work has landed.
  useEffect(() => {
    if (!landed) return;
    const stops: (() => void)[] = [];
    const grid = gridRef.current;
    const list = listRef.current;
    if (grid && !shown.grid) stops.push(once(grid, { onIn: () => setShown((value) => ({ ...value, grid: true })) }));
    if (list && !shown.list) stops.push(once(list, { onIn: () => setShown((value) => ({ ...value, list: true })) }));
    return () => stops.forEach((stop) => stop());
  }, [landed, shown.grid, shown.list, compact.length, listed.length]);

  // The presentation starts over at the title slide: back there the carousel returns to its first project, so scene
  // A always opens on Ceru. Work is hidden at that moment (it wakes from .03), so the jump is never seen. Also on load
  // and on a page restored from the back-forward cache, where a browser (Safari) can bring a sideways scroll back.
  useEffect(() => {
    const toFirst = () => {
      const track = trackRef.current;
      if (!track || track.scrollLeft < 2) return;
      track.scrollLeft = 0;
      setActive(0);
    };
    toFirst();
    const onLoad = () => toFirst();
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) toFirst();
    };
    window.addEventListener("load", onLoad, { once: true });
    window.addEventListener("pageshow", onShow);
    const rail = document.querySelector<HTMLElement>('.scene[data-scene="through"]');
    let atStart = true;
    const check = () => {
      if (!rail?.classList.contains("is-live")) return;
      const p = parseFloat(rail.style.getPropertyValue("--p"));
      const next = !(p > 0.02);
      if (next && !atStart) toFirst();
      atStart = next;
    };
    const watch = rail ? new MutationObserver(check) : null;
    if (rail) watch?.observe(rail, { attributes: true, attributeFilter: ["class", "style"] });
    return () => {
      watch?.disconnect();
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pageshow", onShow);
    };
  }, []);

  const applyFilter = (next: Filter) => {
    setFilter(next);
    setActive(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  };

  const goTo = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(showcase.length - 1, index));
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: track.clientWidth * next, behavior: calm ? "auto" : "smooth" });
    setActive(next);
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setActive(Math.max(0, Math.min(showcase.length - 1, Math.round(track.scrollLeft / track.clientWidth))));
  };

  // Arrow keys move the carousel only while the carousel itself has focus, never page-wide. From a link or button
  // inside a slide they do nothing: the browser's own sideways scroll would carry the focused control into a
  // hidden slide and drop the focus.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const sideways = event.key === "ArrowLeft" || event.key === "ArrowRight";
    if (event.target !== event.currentTarget) {
      if (sideways) event.preventDefault();
      return;
    }
    const to: Record<string, number> = { ArrowLeft: active - 1, ArrowRight: active + 1, Home: 0, End: showcase.length - 1 };
    if (!(event.key in to)) return;
    event.preventDefault();
    goTo(to[event.key]);
  };

  return (
    <>
      <section className="section lead-section work-section" aria-labelledby="work-title" data-landed={landed ? "" : undefined}>
        <div className="shell">
          <div className="section-head work-head">
            <div>
              <h2 id="work-title">Selected work</h2>
            </div>
            <div ref={filtersRef} className="work-filters" role="group" aria-label="Filter projects">
              <span ref={wellRef} className="filter-well" aria-hidden="true" />
              {filters.map((item) => (
                <button key={item.id} type="button" aria-pressed={filter === item.id} onClick={() => applyFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {showcase.length ? (
            <>
              <div className="slides-wrap">
                <div
                  ref={trackRef}
                  className="slides"
                  data-active={active}
                  onScroll={onScroll}
                  onKeyDown={onKeyDown}
                  tabIndex={0}
                  role="group"
                  aria-roledescription="carousel"
                  aria-label="Selected projects"
                >
                  {showcase.map((project, index) => (
                    <Slide
                      key={project.index}
                      project={project}
                      index={index}
                      active={index === active}
                      eager={Math.abs(index - active) <= 1}
                      ready={ready}
                      held={{ prev: index > 0 && shapes[index - 1] === shapes[index], next: shapes[index + 1] === shapes[index] }}
                      chips={chips[project.index]}
                      icons={icons[project.index]}
                    />
                  ))}
                </div>
              </div>

              {/* One project has nothing to page through. At either end the arrow is aria-disabled rather than
                  disabled, so a keyboard user who pressed it keeps focus on it instead of dropping to the page. */}
              {showcase.length > 1 ? (
                <div className="work-nav">
                  <p className="work-count" aria-live="polite">
                    {active + 1} of {showcase.length}
                  </p>
                  <div className="work-controls">
                    <button
                      type="button"
                      aria-label="Previous project"
                      aria-disabled={active === 0}
                      onClick={() => active > 0 && goTo(active - 1)}
                    >
                      <Icon name="arrow-right" size={18} style={{ transform: "scaleX(-1)" }} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next project"
                      aria-disabled={active === showcase.length - 1}
                      onClick={() => active < showcase.length - 1 && goTo(active + 1)}
                    >
                      <Icon name="arrow-right" size={18} />
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {compact.length ? (
            <ul ref={gridRef} className={shown.grid ? "mini-grid is-in" : "mini-grid"}>
              {compact.map((project, index) => (
                <li key={project.title} className="card soft-card mini-card" style={order(index)}>
                  <p className="mini-kind">{project.kind}</p>
                  <h3>
                    {project.href ? (
                      <a className="mini-link" href={project.href} target="_blank" rel="noreferrer">
                        {project.title}
                      </a>
                    ) : (
                      project.title
                    )}
                  </h3>
                  {sourceOf(project.title) ? (
                    <a
                      className="mini-source"
                      href={sourceOf(project.title)}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`${project.title} source code`}
                    >
                      Source code
                      <Icon name="arrow-up-right" size={14} />
                    </a>
                  ) : null}
                  <p className="mini-desc">{project.description}</p>
                  {project.status ? <p className="mini-status">{project.status}</p> : null}
                  {project.image ? (
                    <img className="mini-render" src={project.image} alt="" width="760" height="460" loading="lazy" decoding="async" />
                  ) : null}
                  {tools[project.title]}
                  {project.href ? (
                    <span className="mini-arrow" aria-hidden="true">
                      <Icon name="arrow-right" size={16} />
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {listed.length ? (
            <div className="more-work">
              <h3>More projects</h3>
              <ul ref={listRef} className={shown.list ? "work-list is-in" : "work-list"}>
                {listed.map((project, index) => (
                  <li key={project.title} style={order(index)}>
                    <MoreRow project={project} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {showScene ? scene : null}

        {/* Work was the laptop's screen, so it ends on the laptop's edge. */}
        <div className="chin" aria-hidden="true">
          <div className="chin-bezel">
            <span>Anton Iosifov</span>
          </div>
          <div className="chin-lip" />
          <div className="chin-deck">
            <i className="chin-notch" />
            <i className="chin-ports">
              <b />
              <b />
              <b />
            </i>
          </div>
        </div>
      </section>

      {/* Scene B's rail. Work is sticky through scene A, so a trigger inside it would be measured where Work
          sits at the top of the page; the rail stands outside it, where the scene really plays. */}
      {showScene ? <section className="scene scene-rail icu-rail" data-scene="handwriting" aria-hidden="true" /> : null}
    </>
  );
}
