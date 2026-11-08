"use client";

import { useState } from "react";
import { additionalProjects, projects, type Project } from "@/data/portfolio";
import { Icon } from "./Icons";

function WorkCard({ project }: { project: Project }) {
  const href = project.live ?? project.github ?? "#contact";
  const external = href.startsWith("http");
  // Phone products read better as an app screen than as a marketing cover in a small card.
  const thumb = project.presentation === "mobile" && project.gallery?.[0] ? project.gallery[0].src : project.cover;
  return (
    <li className="work-card">
      <div className="work-copy">
        <p className="work-kicker">{project.type}</p>
        <h3>
          <a
            className="work-card-link"
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noreferrer" : undefined}
          >
            {project.shortTitle}
          </a>
        </h3>
        <p>{project.statement}</p>
      </div>
      {thumb ? (
        <img className="work-cover" src={thumb} alt="" width="640" height="400" loading="lazy" decoding="async" />
      ) : (
        <div className="work-cover work-cover-blank" />
      )}
      <span className="work-arrow" aria-hidden="true">
        <Icon name="arrow-up-right" size={18} />
      </span>
    </li>
  );
}

export function Work() {
  const [expanded, setExpanded] = useState(false);
  const featured = projects.slice(0, 4);
  const rest = projects.slice(4);

  return (
    <section id="work" className="section work-section" aria-labelledby="work-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured projects</p>
            <h2 id="work-title">Selected work</h2>
          </div>
          <button
            type="button"
            className="link-arrow"
            aria-expanded={expanded}
            aria-controls="work-more"
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? "Show fewer" : "View all projects"} <Icon name="arrow-right" size={16} />
          </button>
        </div>

        <ul className="work-grid">
          {featured.map((project) => (
            <WorkCard key={project.index} project={project} />
          ))}
        </ul>

        <div id="work-more" className="work-more" hidden={!expanded}>
          <ul className="work-grid">
            {rest.map((project) => (
              <WorkCard key={project.index} project={project} />
            ))}
          </ul>
          <ul className="work-list" aria-label="More projects">
            {additionalProjects.map((project) => (
              <li key={project.title}>
                <a href={project.href} target="_blank" rel="noreferrer">
                  <span className="work-list-year">{project.year}</span>
                  <span className="work-list-title">{project.title}</span>
                  <span className="work-list-type">{project.type}</span>
                  <Icon name="arrow-up-right" size={16} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
