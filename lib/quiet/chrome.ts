import { useEffect, useSyncExternalStore, type RefObject } from "react";
import { lastScrollY } from "@/lib/motion/chapters";

/** How far the page has to move before the header takes a ground. */
const SCROLLED_AFTER = 24;

const onWindow = (type: string, options?: AddEventListenerOptions) => (notify: () => void) => {
  window.addEventListener(type, notify, options);
  return () => window.removeEventListener(type, notify, options);
};

const subscribeChapter = onWindow("chapter");
const subscribeScroll = onWindow("scroll", { passive: true });

const readChapter = () => document.documentElement.dataset.chapter ?? "top";
/** From the scroll event's own reading: `window.scrollY` here forced a restyle and layout after the scenes had
 *  written, in each scrolled frame and in the header's render at every chapter change (a frame of the dive). */
const readScrolled = () => lastScrollY() > SCROLLED_AFTER;

/** The chapter being read, as `lib/motion/chapters` keeps it on `html[data-chapter]`. "top" on the server. */
export function useChapter(): string {
  return useSyncExternalStore(subscribeChapter, readChapter, () => "top");
}

/** True once the page has left its very top. False on the server. */
export function useScrolled(): boolean {
  return useSyncExternalStore(subscribeScroll, readScrolled, () => false);
}

/** The narrow-window menu's manners while it is open: focus goes to its first link (so Tab walks the links, not the
 *  page hidden under the panel), Escape closes it and gives focus back to the button, and a press anywhere outside
 *  the header closes it. */
export function useMenu(
  open: boolean,
  close: () => void,
  header: RefObject<HTMLElement | null>,
  nav: RefObject<HTMLElement | null>,
  button: RefObject<HTMLButtonElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLElement>("a[href]")?.focus({ preventScroll: true });

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const inside = header.current?.contains(document.activeElement) ?? false;
      close();
      if (inside) button.current?.focus({ preventScroll: true });
    };
    const onPress = (event: PointerEvent) => {
      if (event.target instanceof Node && header.current?.contains(event.target)) return;
      close();
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, [open, close, header, nav, button]);
}
