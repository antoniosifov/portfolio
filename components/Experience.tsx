import { experience } from "@/data/portfolio";
import { ChipList } from "./Brand";
import { Icon } from "./Icons";
import { Mark } from "./Logo";
import { SectionIntro } from "./SectionIntro";

/** The cards keep their approved shape: head on top, summary and points in two columns. The quiet layer
 *  adds a rail that fills with the reading position (a lime head, each dot lighting as it is reached) and
 *  checks that draw as their bullet comes in. */
export function Experience() {
  return (
    <section
      id="experience"
      className="section lead-section"
      aria-labelledby="experience-title"
      data-chapter-mark="experience"
      data-circuit
    >
      <div className="shell intro-shell">
        <SectionIntro
          id="experience"
          title="Experience"
          description="Turning ideas into real products, from architecture and development to deployment and production."
        />
      </div>
      <div className="shell">
        <div className="xp-timeline">
          <span className="xp-rail" aria-hidden="true">
            <i className="xp-rail-fill" />
            <i className="xp-rail-head" />
          </span>
          <ol className="xp-list">
            {experience.map((item) => (
              <li key={item.period} className="xp-item">
                <span className={item.current ? "xp-dot is-current" : "xp-dot"} aria-hidden="true" />
                <article className="card soft-card xp-card">
                  <header className="xp-head">
                    <span className="logo-tile">
                      {item.logo ? (
                        <img src={item.logo} alt="" width="48" height="48" loading="lazy" decoding="async" />
                      ) : (
                        <Mark className="tile-mark" />
                      )}
                    </span>
                    <div className="xp-title">
                      <h3>{item.role}</h3>
                      <p className="xp-company">
                        {item.href ? (
                          <a href={item.href} target="_blank" rel="noreferrer">
                            {item.company}
                            <Icon name="external-link" size={15} />
                          </a>
                        ) : (
                          item.company
                        )}
                      </p>
                      <p className="xp-meta">
                        <span>
                          <Icon name="calendar" size={16} />
                          {item.period}
                        </span>
                        <span>
                          <Icon name="map-pin" size={16} />
                          {item.meta}
                        </span>
                      </p>
                    </div>
                    {item.current ? (
                      <span className="xp-current">
                        <span aria-hidden="true" />
                        Current
                      </span>
                    ) : null}
                  </header>

                  <div className="xp-body">
                    <div className="xp-summary">
                      <p>{item.summary}</p>
                      <ChipList items={item.stack} visible={4} />
                    </div>
                    <ul className="xp-points">
                      {item.bullets.map((bullet) => (
                        <li key={bullet}>
                          <Icon name="check" size={18} />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
