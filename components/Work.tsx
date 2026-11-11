import { compactProjects, projects } from "@/data/portfolio";
import { BrandIcon, ChipList, StackIcons } from "./Brand";
import { IcuScene } from "./IcuScene";
import { WorkShowcase } from "./WorkShowcase";

/** Logos are rendered here, on the server, so the icon data never reaches the
 *  browser bundle of the interactive carousel. So is scene B: the showcase only
 *  decides whether the current filter includes it. */
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

  const told = projects.find((project) => project.scene);

  return (
    <WorkShowcase
      chips={chips}
      icons={icons}
      tools={tools}
      scene={told ? <IcuScene project={told} icons={icons[told.index]} /> : undefined}
      sceneCategories={told?.categories}
    />
  );
}
