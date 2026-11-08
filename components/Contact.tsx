import { contactLinks } from "@/data/portfolio";
import { Icon } from "./Icons";
import { Landscape } from "./Landscape";
import { OliveBranch } from "./OliveBranch";

export function Contact() {
  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <div className="shell">
        <div className="contact-banner">
          <Landscape className="cta-landscape" />
          <OliveBranch className="leaf leaf-cta" />
          <div className="contact-banner-copy">
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">
              Looking for an engineer <br />
              to join your team?
            </h2>
            <p>
              I’m open to full-stack, React/Next.js, Node.js and product-focused engineering roles. Happy to walk you
              through any project.
            </p>
            <div className="contact-banner-actions">
              <a className="btn btn-light btn-sm" href="mailto:iosifov.a.14@gmail.com">
                Email me <Icon name="arrow-right" size={16} />
              </a>
            </div>
          </div>
        </div>

        <ul className="contact-links">
          {contactLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                <span className="contact-label">{link.label}</span>
                <span className="contact-value">{link.value}</span>
                <Icon name="arrow-up-right" size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
