/** Body text: each one-shot fires as its top passes 88% of the window (checks at 85%). */
const AT_88 = "-12%";
const AT_85 = "-15%";
/** The bottom edge of the window itself. */
const AT_EDGE = "0px";
/** Everything above the window counts as reached too, so a jump, a wipe or a fast fling past an element still
 *  finishes it: an observer only reports a change of state, and below-to-above in one step is none without this. */
const ABOVE = "100000px";
/** The Skills board is one column up to here, and each card then lights as it enters. */
const ONE_COLUMN = "(max-width: 900px)";
/** Fine pointers read a card's logo on hover; everyone else gets it lit as the card comes into view. */
const NO_HOVER = "(hover: none)";

/** Already on screen, or scrolled past, when the layer starts: shown as it is, never hidden after the fact. */
const seen = (el: Element) => el.getBoundingClientRect().top < window.innerHeight;

/** Calls `onIn` once when `el` has reached `line` (an inset from the window's bottom edge) or gone past it
 *  upwards. With `whole`, only once all of it is on screen (or above): a heading low on the screen is never left
 *  hidden while the visitor can see where it should be. Returns a cancel. */
function reached(el: Element, onIn: () => void, { line = AT_88, whole = false }: { line?: string; whole?: boolean } = {}): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onIn();
    return () => {};
  }
  const ratio = whole ? 0.97 : 0;
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= ratio)) return;
      observer.disconnect();
      onIn();
    },
    { rootMargin: `${ABOVE} 0px ${line} 0px`, threshold: whole ? [0, ratio] : 0 },
  );
  observer.observe(el);
  return () => observer.disconnect();
}

/** `ratio` of the element, or of the window when the element is taller than that, is in view. */
const inView = (entry: IntersectionObserverEntry, ratio: number) =>
  entry.isIntersecting && (entry.intersectionRatio >= ratio || entry.intersectionRect.height >= window.innerHeight * ratio);

/** Calls `onIn` once when `ratio` of `el` is in view. Returns a cancel. */
function whenShare(el: Element, ratio: number, onIn: () => void): () => void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => inView(entry, ratio))) return;
      observer.disconnect();
      onIn();
    },
    { threshold: [0, 0.1, 0.2, 0.35, 0.5, 0.75] },
  );
  observer.observe(el);
  return () => observer.disconnect();
}

/** Skills: on a wide board the seven Ceru chips light first and the rest follow (the delays are in the
 *  markup), once 35% of the board is in view. One column: each card lights as it enters. */
function lightSkills(reduced: boolean): () => void {
  const grid = document.querySelector<HTMLElement>(".skills-grid");
  if (!grid) return () => {};
  const groups = [...grid.querySelectorAll<HTMLElement>(".skill-group")];
  const lightAll = () => {
    grid.classList.add("is-lit");
    groups.forEach((group) => group.classList.add("is-lit"));
  };
  if (reduced || seen(grid)) {
    lightAll();
    return () => {};
  }
  if (window.matchMedia(ONE_COLUMN).matches) {
    // The note does not wait on a phone, so the board is marked lit at once and only its rows wait.
    grid.classList.add("is-lit");
    const stops = groups.map((group) => {
      if (seen(group)) {
        group.classList.add("is-lit");
        return () => {};
      }
      return reached(group, () => group.classList.add("is-lit"));
    });
    return () => stops.forEach((stop) => stop());
  }
  return whenShare(grid, 0.35, lightAll);
}

/** Phones have no hover, so a card's logos take their real colour once, when half the card is in view. */
function lightLogosOnTouch(reduced: boolean): () => void {
  if (!window.matchMedia(NO_HOVER).matches) return () => {};
  const stops = [...document.querySelectorAll<HTMLElement>(".xp-card, .edu-card")].map((card) => {
    if (reduced) {
      card.classList.add("is-logo-lit");
      return () => {};
    }
    return whenShare(card, 0.5, () => card.classList.add("is-logo-lit"));
  });
  return () => stops.forEach((stop) => stop());
}

/** The page's one ink fill: the About lead, split into words that each fill as they rise. Plain text
 *  only, and only where scroll timelines exist; elsewhere it stays at full ink. */
function fillInk() {
  if (typeof CSS === "undefined" || !CSS.supports("animation-timeline: view()")) return;
  document.querySelectorAll<HTMLElement>(".about-lead").forEach((lead) => {
    if (lead.classList.contains("is-filling") || lead.children.length) return;
    const words = (lead.textContent ?? "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return;
    lead.replaceChildren(
      ...words.flatMap((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;
        return index < words.length - 1 ? [span, " "] : [span];
      }),
    );
    lead.classList.add("is-filling");
  });
}

const pictureOf = (el: Element) => (el instanceof HTMLImageElement ? el : el.querySelector("img"));

/** A lazy image that the hidden state clips away entirely is never seen by the browser's lazy loader, so it is
 *  asked for here, a screen before it arrives. */
const fetchPicture = (el: Element) => {
  const img = pictureOf(el);
  if (img?.loading === "lazy") img.loading = "eager";
};

/** A picture that opens on screen must be there to open: resolves once it is decoded, could not be, or after
 *  2.5 s at most, so a slow photo never stays hidden. */
const decoded = (el: Element) => {
  const img = pictureOf(el);
  if (!img) return Promise.resolve();
  fetchPicture(img);
  return Promise.race([img.decode().catch(() => undefined), new Promise((resolve) => window.setTimeout(resolve, 2500))]);
};

/** The one-shot reveals of the career sections and of About. Each element is marked once as it comes in;
 *  the hidden states live in 50-career.css under `html.quiet`, which only exists while this layer runs. */
export function startReveals(reduced: boolean): () => void {
  const stops: (() => void)[] = [];
  let stopped = false;

  /** `watch` is what the observer looks at. It must not be the element whose own box the hidden state
   *  clips away: a fully clipped target never reports that it intersects. `picture` waits for the image to be
   *  decoded, so a shutter never opens on an empty box while a lazy photo is still arriving. */
  type Reveal = { line?: string; whole?: boolean; watch?: Element; picture?: boolean };
  const reveal = (el: Element, { line, whole, watch = el, picture = false }: Reveal = {}) => {
    if (el.classList.contains("is-in")) return;
    if (reduced || seen(watch)) {
      el.classList.add("is-in");
      return;
    }
    const show = () => el.classList.add("is-in");
    stops.push(reached(watch, () => (picture ? void decoded(el).then(() => !stopped && show()) : show()), { line, whole }));
  };
  stops.push(() => {
    stopped = true;
  });

  // A heading rises once all of it is on screen: at 85-90% of the window for the large ones, and never later than
  // the moment it is whole, so a short heading low on a tall window is not left as an empty band.
  document.querySelectorAll(".intro").forEach((el) => reveal(el, { watch: el.querySelector(".intro-mask") ?? el, line: AT_EDGE, whole: true }));
  document.querySelectorAll(".xp-points > li").forEach((el) => reveal(el, { line: AT_85 }));
  document.querySelectorAll(".edu-cert-paper").forEach((el) => reveal(el));
  document.querySelectorAll(".gpa").forEach((el) => reveal(el));
  // About belongs to the finale package; each of these is skipped while its element is absent. The photo is
  // fetched a screen early and opens as soon as its card enters, so the column is never an empty box.
  document.querySelectorAll(".about-photo").forEach((el) => {
    const layout = el.closest(".about-layout") ?? el.parentElement ?? el;
    if (!reduced && !el.classList.contains("is-in") && !seen(layout)) stops.push(reached(layout, () => fetchPicture(el), { line: "100%" }));
    reveal(el, { watch: layout, line: AT_EDGE, picture: true });
  });
  document.querySelectorAll(".about-facts").forEach((el) => reveal(el));

  stops.push(lightSkills(reduced), lightLogosOnTouch(reduced));
  if (!reduced) fillInk();

  return () => stops.forEach((stop) => stop());
}
