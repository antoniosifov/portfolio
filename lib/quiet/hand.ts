/** Only a mouse or a pen has a pointer to follow; touch gets the finished state of each of these. */
export const FINE = "(hover: hover) and (pointer: fine)";

const TILT_MAX_DEG = 4;
/** Long enough to cross the gap between two chips without the note flicking back to its own line. */
const CAPTION_RESTORE_MS = 140;

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** The light on a card's 1 px rim follows the pointer (`--x`, `--y`, read by the rim in 10-look.css). */
function rimLight(): () => void {
  let card: HTMLElement | null = null;
  let x = 0;
  let y = 0;
  let frame = 0;

  const paint = () => {
    frame = 0;
    if (!card) return;
    const box = card.getBoundingClientRect();
    card.style.setProperty("--x", `${Math.round(x - box.left)}px`);
    card.style.setProperty("--y", `${Math.round(y - box.top)}px`);
  };

  const onMove = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    card = event.target instanceof Element ? event.target.closest<HTMLElement>(".card") : null;
    x = event.clientX;
    y = event.clientY;
    if (card && !frame) frame = requestAnimationFrame(paint);
  };

  document.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    cancelAnimationFrame(frame);
    document.removeEventListener("pointermove", onMove);
  };
}

/** A certificate turns up to 4° to face the pointer while it is over its link. The image never changes. */
function certificateTilt(): () => void {
  const stops = [...document.querySelectorAll<HTMLElement>(".edu-cert")].map((link) => {
    const paper = link.querySelector<HTMLElement>(".edu-cert-paper");
    if (!paper) return () => {};
    let frame = 0;
    let x = 0;
    let y = 0;

    const tilt = () => {
      frame = 0;
      const box = paper.getBoundingClientRect();
      if (!box.width || !box.height) return;
      const dx = clamp((x - (box.left + box.width / 2)) / (box.width / 2));
      const dy = clamp((y - (box.top + box.height / 2)) / (box.height / 2));
      paper.style.setProperty("--tilt-x", `${(-dy * TILT_MAX_DEG).toFixed(2)}deg`);
      paper.style.setProperty("--tilt-y", `${(dx * TILT_MAX_DEG).toFixed(2)}deg`);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(tilt);
    };

    const onLeave = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      paper.style.removeProperty("--tilt-x");
      paper.style.removeProperty("--tilt-y");
    };

    link.addEventListener("pointermove", onMove, { passive: true });
    link.addEventListener("pointerleave", onLeave);
    return () => {
      link.removeEventListener("pointermove", onMove);
      link.removeEventListener("pointerleave", onLeave);
      onLeave();
    };
  });
  return () => stops.forEach((stop) => stop());
}

/** Pointing at a skill swaps the note under the board for where it was used ("React Native: Ceru"). A chip
 *  without a recorded use leaves the note as it is. The same words are in each chip for screen readers. */
function chipCaptions(): () => void {
  const grid = document.querySelector<HTMLElement>(".skills-grid");
  const text = document.querySelector<HTMLElement>(".skills-note-text");
  if (!grid || !text) return () => {};
  const resting = text.textContent ?? "";
  let restore = 0;

  const show = (caption: string) => {
    window.clearTimeout(restore);
    if (text.textContent !== caption) text.textContent = caption;
  };
  const rest = () => {
    window.clearTimeout(restore);
    restore = window.setTimeout(() => show(resting), CAPTION_RESTORE_MS);
  };

  const onOver = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const chip = event.target instanceof Element ? event.target.closest<HTMLElement>(".chip") : null;
    const caption = chip?.dataset.caption;
    if (caption) show(caption);
    else rest();
  };

  grid.addEventListener("pointerover", onOver);
  grid.addEventListener("pointerleave", rest);
  return () => {
    window.clearTimeout(restore);
    grid.removeEventListener("pointerover", onOver);
    grid.removeEventListener("pointerleave", rest);
    text.textContent = resting;
  };
}

/** What answers the hand: the rim light, the certificate tilt and the chip captions. Fine pointers only;
 *  the tilt is motion, so it also waits on reduced motion. */
export function startHand(reduced: boolean): () => void {
  if (!window.matchMedia(FINE).matches) return () => {};
  const stops = [rimLight(), chipCaptions()];
  if (!reduced) stops.push(certificateTilt());
  return () => stops.forEach((stop) => stop());
}
