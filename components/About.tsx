import { OliveBranch } from "./OliveBranch";

const facts = [
  ["Education", "B.Sc. Computer Science · HIT · Grade 90"],
  ["Languages", "Russian · Hebrew · English"],
  ["Work modes", "On-site · Hybrid · Remote"],
  ["Location", "Rishon LeZion · Israel"],
];

export function About() {
  return (
    <section id="about" className="section about-section" aria-labelledby="about-title">
      <div className="shell">
        <article className="card about-layout">
          <img
            className="about-photo"
            src="/img/anton-iosifov.webp"
            alt="Portrait of Anton Iosifov"
            width="900"
            height="1200"
            loading="lazy"
            decoding="async"
          />
          <div className="about-body">
            <p className="eyebrow">About me</p>
            <h2 id="about-title">
              Thinking in systems. <br />
              <em className="h2-accent">Building in code.</em>
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
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <OliveBranch className="leaf leaf-about" />
        </article>
      </div>
    </section>
  );
}
