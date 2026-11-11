import { Fragment } from "react";

/** Each fact is a short list. 40-finale.css wraps a list only before a separator (the <wbr>) and clips the dot that
 *  would then start a line, so no line starts or ends on "·"; the text reads the same as one string. */
const facts: [string, string[]][] = [
  ["Education", ["B.Sc. Computer Science", "HIT", "GPA 90"]],
  ["Languages", ["Russian", "Hebrew", "English"]],
  ["Work modes", ["On-site", "Hybrid", "Remote"]],
  ["Location", ["Rishon LeZion", "Israel"]],
];

/** The card the last scene pulls back from. Its link target is the finale's marker (`#about`), so the section
 *  carries no id. `.about-photo` (shutter), `.about-lead` (plain text, filled word by word) and the facts are the
 *  quiet layer's hooks; the scene reads the photo's column to open the same picture onto the screen. */
export function About() {
  return (
    <section className="section about-section" aria-labelledby="about-title" data-circuit>
      <div className="shell">
        <article className="card about-layout">
          <img
            className="about-photo"
            src="/img/anton-iosifov-graphite.webp"
            alt="Portrait of Anton Iosifov"
            width="900"
            height="1200"
            loading="lazy"
            decoding="async"
          />
          <div className="about-body">
            <h2 id="about-title">
              Thinking in systems. <br />
              Building in code.
            </h2>
            <p className="about-lead">
              I’m a Full-Stack Software Engineer based in Israel, building reliable, production-ready software across
              frontend, backend, data, integrations, and deployment.
            </p>
            <p>
              At Platforma365, I worked across the stack on internal SaaS products. Today, I build client and independent
              products, from multilingual business platforms and a custom real-estate CRM to Ceru, a six-language
              expense-sharing mobile app.
            </p>
            <dl className="about-facts">
              {facts.map(([label, items]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>
                    {items.map((item, i) =>
                      i === 0 ? (
                        <span key={item} className="about-fact">
                          {item}
                        </span>
                      ) : (
                        <Fragment key={item}>
                          <wbr />
                          <span className="about-fact">
                            <span className="about-fact-sep">{" · "}</span>
                            {item}
                          </span>
                        </Fragment>
                      ),
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}
