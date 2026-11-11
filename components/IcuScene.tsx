import type { ReactNode } from "react";
import type { Project } from "@/data/portfolio";
import { Icon } from "./Icons";

/** The roster as the head nurse used to write it, baked to the capture's own box (1600x900, same fit), so
 *  every handwritten word lands on the pill the app shows for it. */
const SHEET = "/img/projects/icu/handwritten.webp";

function Phone({ src, alt, className }: { src: string; alt: string; className: string }) {
  return (
    <div className={`dv-phone ${className}`}>
      <span className="dv-phone-notch" aria-hidden="true" />
      <img src={src} alt={alt} width="430" height="932" loading="lazy" decoding="async" />
    </div>
  );
}

/** Scene B, "Two days of handwriting, gone": the handwritten roster is swept off the laptop and the app is
 *  under it. Server markup: `lib/scenes/handwriting.ts` plays it, and without that this is the finished
 *  composition (app, phone, the whole statement, details). `.icu-more` repeats the details that follow
 *  the hold on a phone; CSS displays exactly one of the two copies, so they are never read twice. */
export function IcuScene({ project, icons }: { project: Project; icons: ReactNode }) {
  const desktop = project.devices?.desktop ?? project.cover;
  const mobile = project.devices?.mobile;
  const words = project.statement.trim().split(/\s+/);
  const last = words.pop();
  const phoneAlt = `${project.shortTitle} on a phone`;

  return (
    <>
      <section className="scene-tall icu" aria-labelledby="icu-title">
        <div className="scene-stage icu-stage">
          <div className="shell icu-grid">
            <div className="icu-media">
              <div className="dv-set has-phone icu-device">
                <div className="dv-laptop">
                  <div className="dv-laptop-screen">
                    <div className="icu-screen">
                      <img
                        className="icu-app"
                        src={desktop}
                        alt={project.coverAlt ?? `${project.shortTitle} on a laptop`}
                        width="1600"
                        height="900"
                        loading="lazy"
                        decoding="async"
                      />
                      <img className="icu-sheet" src={SHEET} alt="" aria-hidden="true" width="1600" height="900" loading="lazy" decoding="async" />
                      <span className="icu-line" aria-hidden="true" />
                    </div>
                  </div>
                  <span className="dv-laptop-base" aria-hidden="true" />
                </div>
                {mobile ? <Phone src={mobile} alt={phoneAlt} className="is-front icu-phone" /> : null}
              </div>
            </div>

            <div className="icu-copy">
              <p className="slide-status">
                <span aria-hidden="true" />
                {project.status}
              </p>
              <p className="icu-name">{project.shortTitle}</p>
              <h3 id="icu-title" className="icu-statement">
                {words.join(" ")} <em>{last}</em>
              </h3>
              <p className="slide-desc icu-desc">{project.description}</p>
              {icons}
              {project.note ? <p className="icu-note">{project.note}</p> : null}
            </div>
          </div>
        </div>
      </section>

      <div className="icu-more shell">
        {mobile ? <Phone src={mobile} alt={phoneAlt} className="icu-more-phone" /> : null}
        <div className="icu-more-copy">
          <p className="slide-desc">{project.description}</p>
          {icons}
          {project.note ? <p className="icu-note">{project.note}</p> : null}
        </div>
      </div>

      {/* The project's facts, checked like the Experience points, so they read as a list and not as captions. */}
      <ul className="icu-highlights shell">
        {project.highlights.map((item) => (
          <li key={item}>
            <Icon name="check" size={18} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </>
  );
}
