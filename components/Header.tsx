"use client";

import { useEffect, useState } from "react";
import { navigation } from "@/data/portfolio";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const className = ["site-header", scrolled ? "is-scrolled" : "", open ? "is-open" : ""].filter(Boolean).join(" ");

  return (
    <header className={className}>
      <div className="shell header-inner">
        <Logo />

        <nav id="site-navigation" className="site-nav" aria-label="Primary">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-side">
          <a className="availability" href="#contact">
            <span className="availability-dot" aria-hidden="true" />
            Available for projects
          </a>
          <button
            type="button"
            className="menu-button"
            aria-expanded={open}
            aria-controls="site-navigation"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
