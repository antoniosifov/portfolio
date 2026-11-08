import {
  siAnthropic,
  siBootstrap,
  siDocker,
  siExpo,
  siExpress,
  siFastapi,
  siGit,
  siGithubactions,
  siJavascript,
  siLangchain,
  siLaravel,
  siMongodb,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPostgresql,
  siPython,
  siReact,
  siRedux,
  siRender,
  siSentry,
  siSpringboot,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVercel,
} from "simple-icons";
import type { IconName } from "@/data/portfolio";
import { Icon } from "./Icons";

const brandMarks: Record<string, { path: string; hex: string }> = {
  TypeScript: siTypescript,
  JavaScript: siJavascript,
  React: siReact,
  "Next.js": siNextdotjs,
  "React Native": siReact,
  Expo: siExpo,
  Redux: siRedux,
  "Tailwind CSS": siTailwindcss,
  Bootstrap: siBootstrap,
  "Node.js": siNodedotjs,
  Express: siExpress,
  FastAPI: siFastapi,
  Laravel: siLaravel,
  PHP: siPhp,
  Python: siPython,
  "Spring Boot": siSpringboot,
  PostgreSQL: siPostgresql,
  Supabase: siSupabase,
  MongoDB: siMongodb,
  MySQL: siMysql,
  Docker: siDocker,
  Git: siGit,
  "GitHub Actions": siGithubactions,
  Vercel: siVercel,
  Render: siRender,
  Sentry: siSentry,
  LangChain: siLangchain,
  Anthropic: siAnthropic,
};

/** Official artwork for brands the icon set does not carry. */
const brandFiles: Record<string, string> = {
  AWS: "/img/brands/aws.svg",
  OpenAI: "/img/brands/openai.svg",
};

/** Concepts, not companies: there is no logo to use, so these get a drawn icon. */
const conceptIcons: Record<string, IconName> = {
  "REST APIs": "braces",
  "Automated testing": "circle-check",
  RAG: "layers",
  "Vector search": "box",
  "AI Agents": "bot",
  "Agentic workflows": "workflow",
};

function ChipIcon({ label }: { label: string }) {
  const mark = brandMarks[label];
  if (mark) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d={mark.path} fill={`#${mark.hex}`} />
      </svg>
    );
  }
  if (brandFiles[label]) {
    return <img className="chip-file" src={brandFiles[label]} alt="" width="26" height="18" loading="lazy" decoding="async" />;
  }
  return <Icon name={conceptIcons[label]} size={18} />;
}

export function Chip({ label }: { label: string }) {
  return (
    <li className="chip">
      <ChipIcon label={label} />
      {label}
    </li>
  );
}

/** Extra chips sit in a native <details>, so "+ more" works without JavaScript
 *  and stays keyboard accessible. */
export function ChipList({ items, visible = items.length }: { items: string[]; visible?: number }) {
  const shown = items.slice(0, visible);
  const extra = items.slice(visible);

  return (
    <div className="chips">
      <ul>
        {shown.map((item) => (
          <Chip key={item} label={item} />
        ))}
      </ul>
      {extra.length ? (
        <details className="chips-more">
          <summary>
            <span className="chips-more-closed">+ more</span>
            <span className="chips-more-open">Show less</span>
          </summary>
          <ul>
            {extra.map((item) => (
              <Chip key={item} label={item} />
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
