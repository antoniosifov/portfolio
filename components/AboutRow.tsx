import { siDocker, siNextdotjs, siNodedotjs, siPostgresql, siPython, siReact, siSupabase, siTypescript } from "simple-icons";
import { aboutSummary, alsoWorkWith } from "@/data/portfolio";
import { Icon } from "./Icons";
import { Landscape } from "./Landscape";
import { OliveBranch } from "./OliveBranch";

const skills = [
  { icon: siReact, label: "React" },
  { icon: siNextdotjs, label: "Next.js" },
  { icon: siTypescript, label: "TypeScript" },
  { icon: siNodedotjs, label: "Node.js" },
  { icon: siPostgresql, label: "PostgreSQL" },
  { icon: siSupabase, label: "Supabase" },
  { icon: siDocker, label: "Docker" },
  { icon: siPython, label: "Python" },
];

export function AboutRow() {
  return (
    <section id="about" className="section about-section" aria-label="About, skills and contact">
      <div className="shell row-3">
        <article className="card about-card">
          <img
            className="about-photo"
            src="/img/1758025908213.webp"
            alt="Anton Iosifov"
            width="480"
            height="600"
            loading="lazy"
            decoding="async"
          />
          <div className="about-body">
            <p className="eyebrow">About me</p>
            <p>{aboutSummary}</p>
            <a className="btn btn-outline btn-sm" href="#experience">
              Learn more <Icon name="arrow-right" size={16} />
            </a>
          </div>
          <OliveBranch className="leaf leaf-about" />
        </article>

        <article id="skills" className="card skills-card">
          <p className="eyebrow">Tech stack</p>
          <ul className="pills" aria-label="Core technologies">
            {skills.map((skill) => (
              <li key={skill.label}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d={skill.icon.path} fill={`#${skill.icon.hex}`} />
                </svg>
                {skill.label}
              </li>
            ))}
          </ul>
          <p className="also">
            <span>Also:</span> {alsoWorkWith.join(" · ")}
          </p>
        </article>

        <a className="card cta-card" href="#contact">
          <Landscape className="cta-landscape" />
          <OliveBranch className="leaf leaf-cta" />
          <h2>
            Let’s build <br />
            something together.
          </h2>
          <span className="cta-arrow" aria-hidden="true">
            <Icon name="arrow-right" size={20} />
          </span>
        </a>
      </div>
    </section>
  );
}
