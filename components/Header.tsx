"use client";

import { useCallback, useRef, useState } from "react";
import { navigation } from "@/data/portfolio";
import { useChapter, useMenu, useScrolled } from "@/lib/quiet/chrome";
import { Icon } from "./Icons";
import { Logo } from "./Logo";

/** The fixed header. It never leaves: its ground follows the chapter beneath it and the scenes
 *  (`html[data-chapter]`, `html[data-header]`, styled in 50-career.css), and the link of the chapter
 *  being read is marked as the current location. "Email me" stays graphite until the hand reaches it.
 *  On narrow windows the links open under the header row, edge to edge on the header's own ground. */
export function Header() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled();
  const chapter = useChapter();
  const header = useRef<HTMLElement>(null);
  const nav = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useMenu(open, close, header, nav, button);

  const className = ["site-header", scrolled ? "is-scrolled" : "", open ? "is-open" : ""].filter(Boolean).join(" ");

  return (
    <header ref={header} className={className}>
      <div className="shell header-inner">
        <Logo />

        <nav ref={nav} id="site-navigation" className="site-nav" aria-label="Primary">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={item.href === `#${chapter}` ? "location" : undefined}
              onClick={close}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-side">
          <a className="btn btn-quiet btn-sm" href="mailto:iosifov.a.14@gmail.com">
            Email me
          </a>
          <button
            ref={button}
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
