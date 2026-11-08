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
              Have a product to build <br />
              <em className="h2-accent">or a team to join?</em>
            </h2>
          </div>
          <p className="contact-intro">
            I’m open to full-stack, React/Next.js, Node.js and product-focused engineering opportunities, as well as
            selected client projects.
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
