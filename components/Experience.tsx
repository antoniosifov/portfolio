import { experience } from "@/data/portfolio";

export function Experience() {
  return (
    <section id="experience" className="section experience-section" aria-labelledby="experience-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Career</p>
            <h2 id="experience-title">Experience</h2>
          </div>
          <a className="link-arrow" href="/Anton_Iosifov_CV.pdf" target="_blank" rel="noreferrer">
            Download CV
          </a>
        </div>

        <ol className="timeline">
          {experience.map((item) => (
            <li key={item.period} className="timeline-item">
              <span className="timeline-period">{item.period}</span>
              <div>
                <h3>{item.role}</h3>
                <p className="timeline-meta">
                  {item.company} · {item.meta}
                </p>
              </div>
              <div>
                <p className="timeline-summary">{item.summary}</p>
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
