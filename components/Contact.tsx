import { contactLinks } from "@/data/portfolio";
import { Icon } from "./Icons";

export function Contact() {
  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <div className="shell">
        <div className="section-head">
          <div>
            <p className="eyebrow">Contact</p>
            <h2 id="contact-title">
              Looking for an engineer <br />
              <em className="h2-accent">to join your team?</em>
            </h2>
          </div>
          <p className="contact-intro">
            I’m open to full-stack, React/Next.js, Node.js and product-focused engineering roles. Happy to send my CV or
            walk you through any project.
          </p>
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
