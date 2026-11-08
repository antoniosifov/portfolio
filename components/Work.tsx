"use client";

import { useRef, useState } from "react";
import { additionalProjects, projects, type Project } from "@/data/portfolio";
import { Icon } from "./Icons";

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

function Slide({ project, active, index }: { project: Project; active: boolean; index: number }) {
  const [open, setOpen] = useState(false);
  const detailsId = `work-details-${project.index}`;

  return (
    <article
      className={`slide accent-${project.accent} ${active ? "is-active" : ""}`.trim()}
      aria-roledescription="slide"
      aria-label={project.shortTitle}
    >
      <div className="slide-main">
        <div className="slide-media">
          <Devices project={project} eager={index === 0} />
        </div>

        <div className="slide-copy">
          <p className="slide-meta">
            {project.type} <span aria-hidden="true">·</span> {project.status}
          </p>
          <h3>{project.title}</h3>
          <p className="slide-desc">{project.description}</p>
          <p className="slide-statement">{project.statement}</p>
          <ul className="slide-stack" aria-label={`${project.shortTitle} technologies`}>
            {project.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="slide-actions">
            {project.live ? (
              <a className="btn btn-primary btn-sm" href={project.live} target="_blank" rel="noreferrer">
                {project.presentation === "mobile" ? "Visit product site" : "Open live project"}
                <Icon name="arrow-up-right" size={16} />
              </a>
            ) : null}
            {project.github ? (
              <a className="btn btn-outline btn-sm" href={project.github} target="_blank" rel="noreferrer">
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
              {open ? "Hide details" : "What I built"}
              <span aria-hidden="true">{open ? "−" : "+"}</span>
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

export function Work() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // The carousel needs something to put on the screens; a project without any
  // capture is listed below instead of being shown in an empty laptop.
  const showcase = projects.filter((project) => project.cover);
  const listed = [
    ...projects
      .filter((project) => !project.cover)
      .map((project) => ({
        year: project.year,
        title: project.shortTitle,
        type: project.type,
        href: project.live ?? project.github ?? "#contact",
      })),
    ...additionalProjects,
  ];

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
    <section id="work" className="section work-section" aria-labelledby="work-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured projects</p>
            <h2 id="work-title">Selected work</h2>
          </div>
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
            <Slide key={project.index} project={project} active={index === active} index={index} />
          ))}
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

        <div className="more-work">
          <p className="eyebrow">More projects</p>
          <ul className="work-list">
            {listed.map((project) => (
              <li key={project.title}>
                {project.href ? (
                  <a className="work-list-row" href={project.href} target="_blank" rel="noreferrer">
                    <span className="work-list-year">{project.year}</span>
                    <span className="work-list-title">{project.title}</span>
                    <span className="work-list-type">{project.type}</span>
                    <Icon name="arrow-up-right" size={16} />
                  </a>
                ) : (
                  <div className="work-list-row">
                    <span className="work-list-year">{project.year}</span>
                    <span className="work-list-title">{project.title}</span>
                    <span className="work-list-type">{project.type}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
