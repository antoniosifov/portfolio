# Forma-inspired portfolio redesign

## Goal

Bring the entire portfolio into one coherent visual system inspired by Forma's editorial presentation while preserving Anton's content, section order, project descriptions, and personal identity.

## Confirmed direction

- Use the selected **dark hero + light Forma body** direction.
- Preserve the section order: Hero, About, Experience, Projects, Stack, Contact.
- Keep the current coral accent as Anton's identifying color.
- Treat the hero animation as a separate follow-up. This pass reserves and styles the right-hand hero area without inventing a temporary replacement.
- Use the selected **strong carousel controls**: Forma-like rectangular geometry, a muted disabled button, and a solid black active button.

## Visual system

### Color

- Header and hero use a deep near-black background with warm white text.
- All content sections after the hero share one warm off-white background.
- Coral is limited to small labels, section numbers, focus rings, and intentional highlights.
- Dividers use restrained neutral tones instead of high-contrast boxes.

### Typography

- Large, tightly set editorial headings establish hierarchy.
- Supporting copy stays compact, readable, and noticeably quieter than headings.
- Small metadata and section labels use the existing monospace treatment.
- Headings, descriptions, controls, and labels follow consistent sizes across sections.

### Grid and spacing

- Use one shared wide content grid for every section.
- Align section labels, headings, body copy, media, and controls to the same columns.
- Increase vertical whitespace around section introductions.
- Prefer thin rules and open space over decorative cards and repeated containers.

## Section treatment

### Header and hero

- Integrate the header into the dark hero.
- Keep navigation minimal and consistent with the editorial system.
- Keep the hero copy on the left and reserve a composed right-hand stage for the later animation.
- Ensure the hero remains balanced without depending on animation assets.

### About

- Keep the portrait and existing copy.
- Use a clean editorial split layout with shared alignment and a restrained image treatment.

### Experience

- Replace visually heavy containers with a ruled editorial list.
- Make role, company, date, and outcomes scannable without adding decorative badges.

### Projects

- Retain the Forma-like product showcase layout: large project media, focused project copy, and one clear primary action.
- Keep the existing carousel and project content.
- Center the previous/next controls under the showcase and keep “View all work” aligned right.
- Active carousel control: black fill, white arrow, subtle hover motion.
- Disabled carousel control: transparent fill with a light neutral border and arrow; do not use blanket opacity.
- Do not restore the redundant `01 / 06` counter.

### Stack

- Keep the four existing skill groups and content.
- Use a simple grid with thin separators, strong group headings, and compact skill pills only where they improve scanning.
- Do not add per-skill or per-group numbering.

### Contact and footer

- Finish with one strong invitation and clear contact links.
- Use the same grid, typography, rules, and button language as the rest of the site.

## Interaction and accessibility

- Keep motion restrained and purposeful.
- Add clear keyboard focus states using the coral accent.
- Respect `prefers-reduced-motion`.
- Preserve semantic headings, button labels, link purpose, and disabled states.
- Validate layout at desktop, tablet, and mobile widths.

## Technical scope

- Implement within the existing Next.js and TypeScript codebase.
- Reuse existing components and data structures where practical.
- Focus this pass on styling, layout, and interaction consistency; no content rewrite or new hero animation.
- Verify with lint, production build, and visual checks at representative breakpoints.
