import { education } from "@/data/portfolio";

export function Education() {
  return (
    <section id="education" className="section education-section" aria-labelledby="education-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Foundation</p>
            <h2 id="education-title">Education</h2>
          </div>
        </div>

        <ul className="education">
          {education.map((item) => (
            <li key={item.title}>
              <span className="timeline-period">{item.period}</span>
              <h3>{item.title}</h3>
              <p className="timeline-meta">{item.institution}</p>
              <p>{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
