import { stackGroups } from "@/data/portfolio";
import { ChipList } from "./Brand";
import { SectionIntro } from "./SectionIntro";

export function Skills() {
  return (
    <section id="skills" className="section lead-section" aria-labelledby="skills-title">
      <div className="shell intro-shell">
        <SectionIntro
          id="skills"
          title="Skills"
          description="Technologies, frameworks, and tools I use to design, develop, and ship real products."
        />
      </div>
      <div className="shell">
        <div className="skills-grid">
          {stackGroups.map((group) => (
            <article key={group.label} className="card soft-card skill-group">
              <header>
                <div>
                  <h3>{group.label}</h3>
                  <p>{group.description}</p>
                </div>
              </header>
              <ChipList items={group.items} />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
