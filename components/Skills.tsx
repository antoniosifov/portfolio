import {
  siDocker,
  siExpo,
  siExpress,
  siFastapi,
  siGithubactions,
  siLangchain,
  siLaravel,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPostgresql,
  siReact,
  siRedux,
  siRender,
  siSentry,
  siSpringboot,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
} from "simple-icons";
import { stackGroups } from "@/data/portfolio";

const brandIcons: Record<string, { path: string; hex: string }> = {
  TypeScript: siTypescript,
  React: siReact,
  "Next.js": siNextdotjs,
  "React Native": siReact,
  Expo: siExpo,
  Redux: siRedux,
  "Tailwind CSS": siTailwindcss,
  "Node.js": siNodedotjs,
  Express: siExpress,
  FastAPI: siFastapi,
  Laravel: siLaravel,
  "Spring Boot": siSpringboot,
  PostgreSQL: siPostgresql,
  Supabase: siSupabase,
  MongoDB: siMongodb,
  MySQL: siMysql,
  Docker: siDocker,
  "GitHub Actions": siGithubactions,
  Vercel: siVercel,
  Render: siRender,
  Sentry: siSentry,
  LangChain: siLangchain,
};

export function Skills() {
  return (
    <section id="skills" className="section skills-section" aria-labelledby="skills-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Tech stack</p>
            <h2 id="skills-title">Skills</h2>
          </div>
        </div>

        <div className="skills-grid">
          {stackGroups.map((group) => (
            <article key={group.label} className="card skill-group">
              <h3>{group.label}</h3>
              <ul className="pills">
                {group.items.map((item) => {
                  const icon = brandIcons[item];
                  return (
                    <li key={item}>
                      {icon ? (
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                          <path d={icon.path} fill={`#${icon.hex}`} />
                        </svg>
                      ) : null}
                      {item}
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
