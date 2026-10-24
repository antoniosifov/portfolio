# Forma-Inspired Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the complete portfolio into the approved dark-hero/light-editorial Forma-inspired system while preserving content, section order, and the existing hero animation for later replacement.

**Architecture:** Keep the existing React component boundaries and data model. Consolidate the visual system in `app/globals.css`, make only small semantic/class changes in components, and preserve `Projects.tsx` carousel state and accessibility behavior. Validate through TypeScript, a production build, and browser checks at desktop, tablet, and mobile widths.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, global CSS, native browser scrolling.

---

## File map

- `app/globals.css`: design tokens, header/hero styling, shared section grid, editorial treatments, project showcase, responsive rules, focus and reduced-motion states.
- `components/Header.tsx`: existing semantic navigation and three-line menu; no behavior change expected.
- `components/Hero.tsx`: preserve content and `HeroScene`; add one stage class only if the new grid needs it.
- `components/Projects.tsx`: retain carousel logic; expose active/disabled states through existing native buttons and keep the redundant counter absent.
- `components/About.tsx`, `components/Experience.tsx`, `components/Stack.tsx`, `components/Contact.tsx`, `components/Footer.tsx`: preserve copy and markup unless a small wrapper/class is necessary for shared alignment.
- `components/SectionHeading.tsx`: preserve the shared heading structure and use it as the alignment contract for all light sections.

### Task 1: Establish the shared Forma-inspired design system

**Files:**
- Modify: `app/globals.css:1-193`

- [ ] **Step 1: Record the current verification baseline**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: both commands exit `0` before styling changes.

- [ ] **Step 2: Replace the global color, shell, and spacing tokens**

Use this token contract at the top of `app/globals.css`:

```css
:root {
  --ink: #101210;
  --ink-soft: #646760;
  --night: #0a0c0b;
  --night-soft: #141715;
  --paper: #f4f1e9;
  --paper-deep: #e9e4da;
  --white: #fbf9f3;
  --muted: #a9aca4;
  --coral: #ff5838;
  --line-dark: rgba(251, 249, 243, 0.18);
  --line-paper: rgba(16, 18, 16, 0.18);
  --shell: min(1480px, calc(100vw - 72px));
  --section-content-offset: 92px;
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
}
```

Keep the global focus ring coral and retain `scroll-padding-top` for anchored navigation.

- [ ] **Step 3: Restyle the fixed header as a restrained editorial bar**

Replace the floating pill treatment with a wide, lightly blurred dark bar:

```css
.site-header {
  position: fixed;
  z-index: 100;
  top: 18px;
  left: 50%;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  width: min(1480px, calc(100vw - 36px));
  min-height: 58px;
  padding: 0 22px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  background: rgba(10, 12, 11, 0.84);
  backdrop-filter: blur(18px);
  transform: translateX(-50%);
}

.header-contact {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 6px;
  color: var(--white);
  background: transparent;
}
```

Retain the three-line mobile menu and existing ARIA attributes.

- [ ] **Step 4: Run the type checker**

Run: `npm run typecheck`

Expected: exit `0` with no TypeScript errors.

- [ ] **Step 5: Commit the design-system foundation**

```powershell
git add app/globals.css
git commit -m "Restyle portfolio design foundation"
```

### Task 2: Recompose the hero without changing its animation implementation

**Files:**
- Modify: `app/globals.css:194-435`
- Verify: `components/Hero.tsx`
- Verify: `components/HeroScene.tsx`

- [ ] **Step 1: Confirm the existing hero semantics remain intact**

Verify `Hero.tsx` still contains exactly one `h1`, the two CTA links, the profile rail, and `HeroScene`.

- [ ] **Step 2: Rework the hero into a left-copy/right-stage editorial composition**

Apply this layout contract:

```css
.hero {
  min-height: max(820px, 100svh);
  background: var(--night);
}

.hero-content {
  grid-template-columns: minmax(0, 0.96fr) minmax(320px, 0.44fr);
  gap: clamp(44px, 7vw, 110px);
  padding-top: 142px;
  padding-bottom: 104px;
}

.hero h1 {
  max-width: 900px;
  font-size: clamp(64px, 7.4vw, 118px);
  line-height: 0.88;
  letter-spacing: -0.07em;
}

.hero-scene {
  top: 16%;
  right: -6%;
  width: min(58vw, 980px);
}
```

Keep `HeroScene` image cycling unchanged so a future task can replace it independently.

- [ ] **Step 3: Remove decorative competition from the hero**

Reduce the grid opacity, remove the coral radial glow from the section background, and restyle the marquee as a thin dark editorial ticker separated by a neutral rule rather than a solid coral strip.

- [ ] **Step 4: Verify reduced motion**

Keep the existing `prefers-reduced-motion` block so the final scene is static when reduced motion is requested.

- [ ] **Step 5: Commit the hero restyle**

```powershell
git add app/globals.css components/Hero.tsx components/HeroScene.tsx
git commit -m "Recompose portfolio hero"
```

### Task 3: Unify About, Experience, Stack, Contact, and Footer

**Files:**
- Modify: `app/globals.css:436-703`
- Modify: `app/globals.css:1147-1367`
- Verify: `components/About.tsx`
- Verify: `components/Experience.tsx`
- Verify: `components/Stack.tsx`
- Verify: `components/Contact.tsx`
- Verify: `components/Footer.tsx`
- Verify: `components/SectionHeading.tsx`

- [ ] **Step 1: Make all post-hero sections use the same paper background**

Set `.section`, `.section-paper`, `.projects-section`, and `.stack-section` to the warm paper palette with dark text. Keep `.contact-section` visually connected through the same paper background instead of a full coral panel.

- [ ] **Step 2: Standardize the section-heading grid**

Use one shared rule:

```css
.section-heading {
  grid-template-columns: 64px minmax(0, 1fr) minmax(280px, 0.42fr);
  gap: 28px;
  padding-bottom: 72px;
}

.section-heading::after {
  left: var(--section-content-offset);
  background: var(--line-paper);
}

.section-content {
  width: calc(100% - var(--section-content-offset));
  margin-left: var(--section-content-offset);
}
```

Keep the About and Stack titles on one line only where the viewport permits.

- [ ] **Step 3: Simplify About and Experience**

Remove the coral portrait-corner decoration, retain the portrait crop, and use thin rules for facts. Keep Experience as a three-column editorial list with no card backgrounds or shadows.

- [ ] **Step 4: Simplify Stack**

Retain four groups and remove group numbering. Keep a two-column ruled grid on desktop and one column on narrow screens. Skill pills remain neutral until hover, where they invert to black/white.

- [ ] **Step 5: Restyle Contact and Footer**

Use a paper contact section with a large black heading, coral kicker, two-column ruled links, black hover inversion, and a black footer. Remove the decorative orbit pseudo-element.

- [ ] **Step 6: Verify component copy and order**

Run:

```powershell
rg -n "id=\"(about|experience|projects|stack|contact)\"" components
```

Expected: each anchor remains present once and `app/page.tsx` keeps About → Experience → Projects → Stack → Contact.

- [ ] **Step 7: Commit the editorial sections**

```powershell
git add app/globals.css components/About.tsx components/Experience.tsx components/Stack.tsx components/Contact.tsx components/Footer.tsx components/SectionHeading.tsx
git commit -m "Unify portfolio editorial sections"
```

### Task 4: Finalize the Forma-style project carousel and selected controls

**Files:**
- Modify: `app/globals.css:704-1146`
- Modify: `app/globals.css:1613-2110`
- Verify: `components/Projects.tsx`

- [ ] **Step 1: Consolidate duplicate project rules**

Move the later “Forma-style selected work” overrides into the main project section and remove superseded dark-project declarations. The final stylesheet must contain one authoritative rule for each of `.projects-section`, `.project-card-main`, `.project-media`, `.project-copy`, and `.projects-carousel-controls button` outside media queries.

- [ ] **Step 2: Apply the selected control geometry and state styles**

Use this final control contract:

```css
.projects-carousel-controls button {
  display: grid;
  place-items: center;
  width: 76px;
  min-width: 76px;
  min-height: 48px;
  padding: 0;
  border: 1px solid var(--ink);
  border-radius: 7px;
  color: #fff;
  background: var(--ink);
  font-size: 17px;
  cursor: pointer;
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}

.projects-carousel-controls button:hover:not(:disabled) {
  transform: translateY(-2px);
}

.projects-carousel-controls button:disabled {
  cursor: default;
  color: #aaa69f;
  border-color: #cbc7bf;
  background: transparent;
  opacity: 1;
}
```

- [ ] **Step 3: Keep the footer alignment and remove redundant counting**

Keep controls centered in desktop layout and `View all work →` right aligned. Confirm `Projects.tsx` contains no visible `activeProject + 1`, `projects.length`, or `01 / 06` output.

- [ ] **Step 4: Preserve carousel behavior and accessibility**

Keep native `disabled`, `aria-label`, `scroll-snap-type`, and `scrollTo({ behavior: "smooth" })`. Do not replace buttons with clickable divs.

- [ ] **Step 5: Commit the project polish**

```powershell
git add app/globals.css components/Projects.tsx
git commit -m "Polish Forma-style project carousel"
```

### Task 5: Responsive and production verification

**Files:**
- Modify: `app/globals.css:1428-2110`

- [ ] **Step 1: Normalize responsive rules**

Keep three breakpoints (`1100px`, `820px`, `560px`) and ensure each selector is defined in the same order as its desktop rule. At mobile width, use 60px-wide carousel buttons, stack project media above copy, collapse the timeline, and keep contact links in one column.

- [ ] **Step 2: Run static verification**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: both commands exit `0`; `next build` reports a successful production build.

- [ ] **Step 3: Start the local production-equivalent development view**

Run: `npm run dev`

Expected: Next.js reports a local URL and serves the page without runtime errors.

- [ ] **Step 4: Verify desktop layout at 1440px**

Check: dark header/hero, readable hero copy, existing animation unobstructed, aligned section headings, light projects, centered black active carousel button, muted disabled button, and right-aligned `View all work`.

- [ ] **Step 5: Verify tablet layout at 820px**

Check: menu opens and closes, hero remains balanced, project media stacks above copy, section text does not overflow, and carousel buttons remain reachable by keyboard.

- [ ] **Step 6: Verify mobile layout at 390px**

Check: three-line burger, no horizontal page overflow, project device frames remain fully visible, controls do not touch the viewport edge, and contact links remain readable.

- [ ] **Step 7: Verify reduced motion and keyboard focus**

Enable reduced motion in browser emulation and tab through the header, project actions, carousel buttons, and contact links. Expected: no looping scene animation and a visible coral focus ring on every interactive element.

- [ ] **Step 8: Commit responsive fixes**

```powershell
git add app/globals.css
git commit -m "Finish responsive portfolio redesign"
```

- [ ] **Step 9: Review the final diff**

Run:

```powershell
git diff HEAD~4 -- app/globals.css components
git status --short
```

Expected: only approved portfolio styling/component changes and documentation are present; the working tree is clean after the final commit.
