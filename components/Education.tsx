import { education } from "@/data/portfolio";
import { ChipList } from "./Brand";
import { Icon } from "./Icons";
import { SectionIntro } from "./SectionIntro";

export function Education() {
  return (
    <section id="education" className="section lead-section" aria-labelledby="education-title">
      <div className="shell intro-shell">
        <SectionIntro
          id="education"
          eyebrow="Education"
          title="Education"
          description="My academic foundation in computer science and continuous professional growth."
        />
      </div>
      <div className="shell">
        <ul className="education">
          {education.map((item) => (
            <li key={item.title}>
              <article className="card soft-card edu-card">
                <header className="edu-head">
                  <span className="logo-tile">
                    {item.logo ? <img src={item.logo} alt="" width="64" height="50" loading="lazy" decoding="async" /> : <Icon name="layers" size={34} />}
                  </span>
                  <div>
                    <p className="edu-period">{item.period}</p>
                    <h3>{item.title}</h3>
                    <p className="edu-institution">{item.institution}</p>
                  </div>
                </header>

                {item.grade ? (
                  <ul className="edu-badges">
                    <li className="is-grade">
                      <Icon name="graduation-cap" size={20} />
                      Grade: <strong>{item.grade}</strong>
                    </li>
                    <li>
                      <Icon name="award" size={20} />
                      {item.degree}
                    </li>
                  </ul>
                ) : (
                  <ChipList items={item.stack ?? []} />
                )}

                <p className="edu-detail">{item.detail}</p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
