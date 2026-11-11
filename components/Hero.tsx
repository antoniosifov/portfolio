import type { CSSProperties } from "react";
import { HeroStage } from "./HeroStage";
import { Icon } from "./Icons";
import { Stats } from "./Stats";

const order = (index: number) => ({ "--i": index }) as CSSProperties;

export function Hero() {
  return (
    <section id="top" className="hero" aria-labelledby="hero-title" data-circuit data-chapter-mark="top">
      <div className="shell hero-grid">
        <div className="hero-copy">
          <h1 id="hero-title" style={order(0)}>
            I build products that ship.
          </h1>
          <p className="hero-lede" style={order(1)}>
            Full-stack software engineer. I build with React, TypeScript and Node.js. Recently shipped Ceru to the App Store and a shift-scheduling system used at a public hospital. Looking for my next engineering role.
          </p>
          <div className="hero-actions" style={order(2)}>
            <a className="btn btn-primary" href="#work">
              View my work <Icon name="arrow-right" size={18} />
            </a>
            <a className="link-arrow" href="https://github.com/antoniosifov" target="_blank" rel="noreferrer">
              GitHub <Icon name="arrow-up-right" size={16} />
            </a>
          </div>
        </div>

        <HeroStage />
      </div>

      <Stats />

      <p className="through-line" aria-hidden="true">
        Recently shipped
        <br />
        Ceru to the
        <br />
        App Store
      </p>
    </section>
  );
}
