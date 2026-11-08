# Ceru Three-Phone Showcase and Network Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match Forma's three-phone Ceru presentation and replace the current photographic hero scene with a lightweight, local animated network background inspired by Forma's hero.

**Architecture:** Keep the existing `HeroScene` and `ProjectVisual` component boundaries. `HeroScene` will render an accessible decorative SVG network with CSS-only motion, while `ProjectVisual` will render three named phone positions using existing local Ceru screenshots. No remote runtime assets or new dependencies are introduced.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, SVG, global CSS.

---

### Task 1: Lock the visual contract

**Files:**
- Create: `scripts/verify-portfolio-visual-contract.mjs`

- [ ] Add source assertions requiring three Ceru phone positions and the new network hero.
- [ ] Run `node scripts/verify-portfolio-visual-contract.mjs` and confirm it fails because the features do not exist yet.

### Task 2: Build the local animated network hero

**Files:**
- Modify: `components/HeroScene.tsx`
- Modify: `app/globals.css`

- [ ] Replace the three photographic frames with one decorative SVG network covering the full hero.
- [ ] Animate slow scene drift, line pulses, and node glow using transforms and opacity only.
- [ ] Keep text legible with a left-to-right vignette and disable all motion under `prefers-reduced-motion`.

### Task 3: Recompose Ceru with three phones

**Files:**
- Modify: `components/Projects.tsx`
- Modify: `data/portfolio.ts`
- Modify: `app/globals.css`

- [ ] Render three gallery entries with `is-left`, `is-center`, and `is-right` slots.
- [ ] Use the group overview, home dashboard, and add-expense screens for a visually dense presentation.
- [ ] Place the center phone in front and slightly larger; rotate and overlap the side phones behind it.
- [ ] Preserve all three devices at tablet and mobile widths without horizontal page overflow.

### Task 4: Verify

**Files:**
- Verify: `scripts/verify-portfolio-visual-contract.mjs`
- Verify: `components/HeroScene.tsx`
- Verify: `components/Projects.tsx`
- Verify: `app/globals.css`

- [ ] Run `node scripts/verify-portfolio-visual-contract.mjs` and expect success.
- [ ] Run `npm run typecheck` and `npm run build` and expect exit code `0`.
- [ ] Inspect hero and Ceru at desktop and mobile widths; confirm no horizontal overflow and reduced-motion compatibility.

