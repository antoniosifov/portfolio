import type { CSSProperties } from "react";
import { education } from "@/data/portfolio";
import { ChipList } from "./Brand";
import { Icon } from "./Icons";
import { SectionIntro } from "./SectionIntro";

/** A figure whose digits roll up to their value once (50-career.css). The strips already sit on the value
 *  in the HTML, so without script it simply reads; screen readers get the plain number. */
function Rolling({ value }: { value: string }) {
  const digits = [...value];
  const columnOf = (index: number) => digits.slice(0, index).filter((ch) => /\d/.test(ch)).length;
  return (
    <>
      <span className="sr-only">{value}</span>
      <span className="digits" aria-hidden="true">
        {digits.map((ch, index) =>
          /\d/.test(ch) ? (
            <span key={index} className="digit-col">
              <span className="digit-strip" style={{ "--d": Number(ch), "--i": columnOf(index) } as CSSProperties}>
                {Array.from({ length: 10 }, (_, n) => (
                  <span key={n}>{n}</span>
                ))}
              </span>
            </span>
          ) : (
            <span key={index}>{ch}</span>
          ),
        )}
      </span>
    </>
  );
}

/** Each certificate sits in a sleeve and slides out once as it comes in, a beat apart; under a fine
 *  pointer it turns a little to face it. Always the same concealed image. */
export function Education() {
  return (
    <section
      id="education"
      className="section lead-section"
      aria-labelledby="education-title"
      data-chapter-mark="education"
      data-circuit
    >
      <div className="shell intro-shell">
        <SectionIntro
          id="education"
          title="Education"
          description="My academic foundation in computer science and continuous professional growth."
        />
      </div>
      <div className="shell">
        <ul className="education">
          {education.map((item, index) => (
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
                      GPA{" "}
                      <strong className="gpa">
                        <Rolling value={item.grade} />
                      </strong>
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

                <a className="edu-cert" href={item.certificate.src} target="_blank" rel="noreferrer">
                  <span className="edu-cert-paper" style={{ "--i": index } as CSSProperties}>
                    <img src={item.certificate.src} alt={item.certificate.alt} width={item.certificate.width} height={item.certificate.height} loading="lazy" decoding="async" />
                  </span>
                  <span className="edu-cert-text">
                    <strong>{item.certificate.label}</strong>
                    <span>{item.certificate.meta}</span>
                    <span className="edu-cert-open">
                      View certificate
                      <Icon name="arrow-up-right" size={16} />
                    </span>
                  </span>
                </a>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
