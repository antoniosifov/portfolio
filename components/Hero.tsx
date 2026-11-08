import type { CSSProperties } from "react";
import { capabilities } from "@/data/portfolio";
import { HeroStage } from "./HeroStage";
import { Icon } from "./Icons";

const order = (index: number) => ({ "--i": index }) as CSSProperties;

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero-bg" aria-hidden="true" />
      <img className="leaf leaf-corner" src="/img/hero/leaf.webp" alt="" width="552" height="244" aria-hidden="true" />
      <img className="leaf leaf-left" src="/img/hero/leaf.webp" alt="" width="552" height="244" aria-hidden="true" />

      <div className="shell hero-grid">
        <div className="hero-copy">
          <p className="eyebrow" style={order(0)}>
            Full-stack software engineer · Israel
          </p>
          <h1 id="hero-title" style={order(1)}>
            Building digital products <span className="h1-soft">that</span>
            <br className="hero-br" /> <em className="h1-accent">solve real problems.</em>
          </h1>
          <p className="hero-lede" style={order(2)}>
            I build with React, TypeScript and Node.js. My work includes Ceru, released on the App Store, and a shift-scheduling system used at a public hospital. Looking for my next engineering role.
          </p>
          <div className="hero-actions" style={order(3)}>
            <a className="btn btn-primary" href="#work">
              View my work <Icon name="arrow-right" size={18} />
            </a>
            <a className="btn btn-outline" href="/Anton_Iosifov_CV.pdf" target="_blank" rel="noreferrer">
              Download CV
            </a>
            <a className="btn btn-outline" href="mailto:iosifov.a.14@gmail.com">
              Email me
            </a>
          </div>
          <ul className="capabilities" style={order(4)} aria-label="What I do">
            {capabilities.map((item) => (
              <li key={item.label}>
                <Icon name={item.icon} size={20} />
                <span>
                  <strong>{item.label}</strong>
                  {item.detail}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <HeroStage />
      </div>
    </section>
  );
}
