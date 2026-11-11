"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { REDUCED } from "@/lib/motion/conditions";

/** The demo's API sleeps on a free instance and took 22.7 s to answer cold (measured 2026-11-09). */
const HEALTH = "https://aws-cpu-utilization-metrics.onrender.com/health";
const NAME = "demo-device";
/** What the app posts to its parent to close the demo, e.g. on Esc: `parent.postMessage({ type: CLOSE }, "*")`. */
const CLOSE = "portfolio-demo:close";

let warmed = false;

/** Wakes the demo's API ahead of a visit: once per page view when its slide comes into view, and again on
 *  every open. Fire and forget; the answer is never read. */
export function warmDemo(again = false) {
  if (warmed && !again) return;
  warmed = true;
  fetch(HEALTH, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => { finished: Promise<void> };
};

/** "Live demo" on the EC2 slide: the real dashboard opens in a device over the page, morphing out of the
 *  slide's laptop where view transitions run. The iframe exists only while the dialog is open; the capture
 *  holds as its poster until the app has loaded. Shown only to wide, hovering pointers (CSS); everyone else
 *  keeps the plain link beside it. */
export function LiveDemo({ src, poster, name }: { src: string; poster: string; name: string }) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const deviceRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => setMounted(true), []);

  // Keys pressed inside the app never reach this page (another origin), so Esc there cannot close the dialog on
  // its own. The app can ask instead: a close message from its own frame and origin closes the demo. Listened to
  // only while the demo is open.
  useEffect(() => {
    if (!open) return;
    const origin = new URL(src).origin;
    const onMessage = (event: MessageEvent) => {
      const frame = dialogRef.current?.querySelector("iframe");
      if (event.origin !== origin || !frame || event.source !== frame.contentWindow) return;
      const data: unknown = event.data;
      if (typeof data === "object" && data !== null && (data as { type?: unknown }).type === CLOSE) dialogRef.current?.close();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, src]);

  const show = () => {
    const dialog = dialogRef.current;
    const device = deviceRef.current;
    if (!dialog || !device || dialog.open) return;
    warmDemo(true);

    const reveal = () => {
      flushSync(() => {
        setLoaded(false);
        setOpen(true);
      });
      dialog.showModal();
      closeRef.current?.focus();
    };

    const laptop = triggerRef.current?.closest(".slide")?.querySelector<HTMLElement>(".dv-laptop");
    const doc = document as TransitionDocument;
    if (!doc.startViewTransition || !laptop || window.matchMedia(REDUCED).matches) {
      reveal();
      return;
    }
    laptop.style.viewTransitionName = NAME;
    const transition = doc.startViewTransition(() => {
      laptop.style.removeProperty("view-transition-name");
      device.style.viewTransitionName = NAME;
      reveal();
    });
    void transition.finished.finally(() => {
      laptop.style.removeProperty("view-transition-name");
      device.style.removeProperty("view-transition-name");
    });
  };

  // Close, Esc and anything else that closes the dialog end here: the app is unloaded and focus goes back.
  const onClose = () => {
    setOpen(false);
    setLoaded(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  const label = `${name}, live demo`;

  return (
    <>
      <button ref={triggerRef} type="button" className="btn btn-primary live-demo" onClick={show}>
        Live demo
      </button>
      {mounted
        ? createPortal(
            <dialog ref={dialogRef} className="demo" aria-label={label} onClose={onClose}>
              <button ref={closeRef} type="button" className="btn btn-outline btn-sm demo-close" onClick={() => dialogRef.current?.close()}>
                Close
              </button>
              <div ref={deviceRef} className="demo-device">
                <div className="demo-screen">
                  <img src={poster} alt="" decoding="async" />
                  {open ? (
                    <iframe
                      src={src}
                      title={label}
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      className={loaded ? "is-loaded" : undefined}
                      onLoad={() => setLoaded(true)}
                    />
                  ) : null}
                </div>
                <span className="demo-base" aria-hidden="true" />
              </div>
            </dialog>,
            document.body,
          )
        : null}
    </>
  );
}
