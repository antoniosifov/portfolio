import { compactProjects, projects } from "@/data/portfolio";
import { BrandIcon, ChipList, StackIcons } from "./Brand";
import { WorkShowcase } from "./WorkShowcase";

/** Logos are rendered here, on the server, so the icon data never reaches the
 *  browser bundle of the interactive carousel. */
export function Work() {
  const chips = Object.fromEntries(projects.map((project) => [project.index, <ChipList key={project.index} items={project.stack} />]));
  const icons = Object.fromEntries(projects.map((project) => [project.index, <StackIcons key={project.index} items={project.stack} />]));
  const tools = Object.fromEntries(
    compactProjects
      .filter((project) => project.tools)
      .map((project) => [
        project.title,
        <ul key={project.title} className="mini-tools" aria-label="Connected tools">
          {project.tools?.map((tool) => (
            <li key={tool} title={tool}>
              <BrandIcon label={tool} />
              <span className="sr-only">{tool}</span>
            </li>
          ))}
        </ul>,
      ]),
  );

  return <WorkShowcase chips={chips} icons={icons} tools={tools} />;
}
