"use client";

import { useEffect, useRef, useState } from "react";
import { contactLinks } from "@/data/portfolio";
import { HeroStage } from "./HeroStage";
import { Icon } from "./Icons";

const COPIED_MS = 1600;

const email = contactLinks.find((link) => link.href.startsWith("mailto:"));

/** Writes the address to the clipboard; falls back to a selected field where the async API is missing. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.append(field);
    field.select();
    let done = false;
    try {
      done = document.execCommand("copy");
    } catch {
      done = false;
    }
    field.remove();
    return done;
  }
}

/** "Copy", then "Copied" for 1.6 s. Its state is its own, so a press re-renders this button and nothing else. */
function CopyEmail({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    if (!(await copyText(value))) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
  };

  return (
    <button type="button" className="copy-email" onClick={copy} data-copied={copied ? "" : undefined}>
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

/** The last frame: the title slide's composition again, his face on the laptop, the four ways to reach him in the
 *  stats' place. Its link target is the finale's marker (`#contact`), so the section carries no id. The heading's
 *  first sentence (`.roll-was`) only shows once a scene arms the roll; without one it reads the final sentence. */
export function Contact() {
  return (
    <section className="section contact-section" aria-labelledby="contact-title">
      <div className="shell hero-grid contact-grid">
        <div className="hero-copy contact-copy">
          {/* The label holds the sentence the heading ends on, so a reader hears it whichever line is showing. */}
          <h2 id="contact-title" className="contact-title" aria-label="Looking for an engineer to join your team?">
            <span className="roll">
              <span className="roll-now">Looking for</span>
            </span>{" "}
            <span className="roll">
              <span className="roll-was" aria-hidden="true">
                my next
              </span>{" "}
              <span className="roll-now">an engineer</span>
            </span>{" "}
            <span className="roll">
              <span className="roll-was" aria-hidden="true">
                engineering role.
              </span>{" "}
              <span className="roll-now">to join your team?</span>
            </span>
          </h2>
          <p>
            I’m open to full-stack, React/Next.js, Node.js and product-focused engineering roles. Happy to walk you
            through any project.
          </p>
          <div className="contact-actions">
            <a className="btn btn-primary" href={email?.href ?? "mailto:iosifov.a.14@gmail.com"}>
              Email me <Icon name="arrow-right" size={16} />
            </a>
            <span className="last-trace" aria-hidden="true">
              <i className="last-gap" />
            </span>
          </div>
        </div>

        <HeroStage variant="finale" />
      </div>

      <div className="shell">
        <ul className="contact-links">
          {contactLinks.map((link) => (
            <li key={link.label}>
              <a href={link.href} target={link.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                <span className="contact-label">
                  {link.label}
                  <Icon name="arrow-up-right" size={14} />
                </span>
                <span className="contact-value">{link.value}</span>
              </a>
              {link === email ? <CopyEmail value={link.value} /> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
