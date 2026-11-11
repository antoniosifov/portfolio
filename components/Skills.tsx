import type { CSSProperties } from "react";
import { experience, projects, stackGroups } from "@/data/portfolio";
import { Chip, hasIcon } from "./Brand";
import { SectionIntro } from "./SectionIntro";

/** Stack entries that count as the skill on the board: AWS is the EC2 project's services, and so on. */
const aliases: Record<string, string[]> = {
  AWS: ["Amazon EC2", "AWS SDK v3", "CloudWatch"],
  MongoDB: ["MongoDB Atlas Vector Search"],
  Redux: ["Redux Toolkit"],
  "Vector search": ["MongoDB Atlas Vector Search"],
};

/** Where the work is, in the order the page shows it: the products, then employers. Self-employment is left
 *  out: its stack is the products' own, so it would only repeat them. */
const work = [
  ...projects.map((project) => ({ name: project.shortTitle, stack: project.stack })),
  ...experience.filter((job) => !/self-employed/i.test(job.company)).map((job) => ({ name: job.company.split(" · ")[0], stack: job.stack })),
];

const usesOf = (skill: string) => {
  const names = [skill, ...(aliases[skill] ?? [])];
  const used = work.filter((entry) => entry.stack.some((item) => names.includes(item))).map((entry) => entry.name);
  return used.length ? used.join(", ") : undefined;
};

const ceruStack = new Set(projects.find((project) => project.shortTitle === "Ceru")?.stack ?? []);

/** The lighting order on a wide board: Ceru's chips first, group by group, 90 ms apart; then everything
 *  else from 900 ms, 28 ms apart. `--i` is the chip's place in its own card, for the one-column board. */
const board = (() => {
  let ceru = 0;
  let rest = 0;
  return stackGroups.map((group) => ({
    ...group,
    chips: group.items.filter(hasIcon).map((label, index) => {
      const isCeru = ceruStack.has(label);
      const delay = isCeru ? ceru++ * 90 : 900 + rest++ * 28;
      return { label, isCeru, uses: usesOf(label), style: { "--d": `${delay}ms`, "--i": index } as CSSProperties };
    }),
  }));
})();

/** A flat table recruiters can read at once. It opens with every logo silver; Ceru's seven light first,
 *  then the rest, and all end in their real colour. */
export function Skills() {
  return (
    <section id="skills" className="section lead-section" aria-labelledby="skills-title" data-chapter-mark="skills" data-circuit>
      <div className="shell intro-shell">
        <SectionIntro
          id="skills"
          title="Skills"
          description="Technologies, frameworks, and tools I use to design, develop, and ship real products."
        />
      </div>
      <div className="shell">
        <div className="skills-grid">
          {board.map((group) => (
            <article key={group.label} className="card soft-card skill-group">
              <header>
                <div>
                  <h3>{group.label}</h3>
                  <p>{group.description}</p>
                </div>
              </header>
              <div className="chips">
                <ul>
                  {group.chips.map((chip) => (
                    <Chip key={chip.label} label={chip.label} uses={chip.uses} ceru={chip.isCeru} style={chip.style} />
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="skills-note">
          <span className="pin" aria-hidden="true" />
          <span className="skills-note-text">Ceru runs through all four layers.</span>
        </p>
      </div>
    </section>
  );
}
