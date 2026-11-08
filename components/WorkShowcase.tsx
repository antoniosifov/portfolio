"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { additionalProjects, compactProjects, projects, type Category, type Project } from "@/data/portfolio";
import { Icon } from "./Icons";
import { SectionWave } from "./SectionIntro";

type Filter = "all" | Category;

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All Projects" },
  { id: "web", label: "Web" },
  { id: "mobile", label: "Mobile" },
  { id: "ai", label: "AI" },
  { id: "automation", label: "Automation" },
];

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

  return (
    <div className={mobile ? "dv-set has-phone" : "dv-set"}>
      <div className="dv-laptop">
        <div className="dv-laptop-screen">
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
  active,
  eager,
  ready,
  chips,
}: {
  project: Project;
  active: boolean;
  eager: boolean;
  ready: boolean;
  chips: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = `work-details-${project.index}`;

  return (
    <article
      className={`card soft-card slide accent-${project.accent} ${active ? "is-active" : ""}`.trim()}
      aria-roledescription="slide"
      aria-label={project.shortTitle}
      inert={ready && !active}
    >
      <div className="slide-main">
        <div className="slide-media">
          <img className="slide-stone" src="/img/hero/stone.webp" alt="" width="944" height="159" loading="lazy" decoding="async" />
          <Devices project={project} eager={eager} />
        </div>

        <div className="slide-copy">
          <p className="slide-meta">
            {project.index === "01" ? (
              <span className="slide-badge">
                <Icon name="sparkles" size={14} />
                Featured
              </span>
            ) : null}
            <span>{project.type}</span>
          </p>
          <h3>{project.title}</h3>
          <p className="slide-desc">{project.description}</p>
          <p className="slide-statement">{project.statement}</p>
          {chips}
          <p className="slide-status">
            <span aria-hidden="true" />
            {project.status}
          </p>
          <div className="slide-actions">
            {project.live ? (
              <a className="btn btn-primary" href={project.live} target="_blank" rel="noreferrer">
                {project.presentation === "mobile" ? "Visit product site" : "Open live project"}
                <Icon name="arrow-up-right" size={16} />
              </a>
            ) : null}
            {project.github ? (
              <a className="btn btn-outline" href={project.github} target="_blank" rel="noreferrer">
                Source code
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
        <ul>
          {project.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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

export function WorkShowcase({ chips, tools }: { chips: Record<string, ReactNode>; tools: Record<string, ReactNode> }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const matches = (categories: Category[]) => filter === "all" || categories.includes(filter);

  // The carousel needs something to put on the screens; a project without any
  // capture is listed below instead of being shown in an empty laptop.
  const showcase = projects.filter((project) => project.cover && matches(project.categories));
  const compact = compactProjects.filter((project) => matches(project.categories));
  const listed = [
    ...projects
      .filter((project) => !project.cover && matches(project.categories))
      .map((project) => ({
        year: project.year,
        title: project.shortTitle,
        type: project.type,
        description: project.description,
        href: project.live ?? project.github,
      })),
    ...additionalProjects.filter((project) => matches(project.categories)),
  ];

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

  return (
    <section id="work" className="section lead-section work-section" aria-labelledby="work-title">
      <SectionWave id="work" />
      <div className="shell">
        <div className="section-head work-head">
          <div>
            <p className="eyebrow">Featured projects</p>
            <h2 id="work-title">
              Selected <em className="h2-accent">Work</em>
            </h2>
          </div>
          <div className="work-filters" role="group" aria-label="Filter projects">
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
              <div className="work-controls">
                <button type="button" aria-label="Previous project" disabled={active === 0} onClick={() => goTo(active - 1)}>
                  <Icon name="arrow-right" size={18} style={{ transform: "scaleX(-1)" }} />
                </button>
                <button
                  type="button"
                  aria-label="Next project"
                  disabled={active === showcase.length - 1}
                  onClick={() => goTo(active + 1)}
                >
                  <Icon name="arrow-right" size={18} />
                </button>
              </div>

              <div
                ref={trackRef}
                className="slides"
                onScroll={onScroll}
                role="group"
                aria-roledescription="carousel"
                aria-label="Selected projects"
              >
                {showcase.map((project, index) => (
                  <Slide
                    key={project.index}
                    project={project}
                    active={index === active}
                    eager={project.index === "01"}
                    ready={ready}
                    chips={chips[project.index]}
                  />
                ))}
              </div>
            </div>

            <div className="work-dots">
              {showcase.map((project, index) => (
                <button
                  key={project.index}
                  type="button"
                  className={index === active ? "is-active" : undefined}
                  aria-label={`Show ${project.shortTitle}`}
                  aria-current={index === active ? "true" : undefined}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
          </>
        ) : null}

        {compact.length ? (
          <ul className="mini-grid">
            {compact.map((project) => (
              <li key={project.title} className="card soft-card mini-card">
                <p className="mini-kind">
                  <span>
                    <Icon name={project.icon} size={15} />
                  </span>
                  {project.kind}
                </p>
                <h3>
                  {project.href ? (
                    <a className="mini-link" href={project.href} target="_blank" rel="noreferrer">
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
                <p className="mini-desc">{project.description}</p>
                {project.status ? <p className="mini-status">{project.status}</p> : null}
                {project.image ? (
                  <div className="mini-laptop" aria-hidden="true">
                    <div className="mini-screen">
                      <img src={project.image} alt="" width="640" height="400" loading="lazy" decoding="async" />
                    </div>
                    <span className="mini-base" />
                  </div>
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
            <p className="eyebrow">More projects</p>
            <ul className="work-list">
              {listed.map((project) => (
                <li key={project.title}>
                  <MoreRow project={project} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
