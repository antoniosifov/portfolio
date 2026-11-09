import {
  siAnthropic,
  siBootstrap,
  siChartdotjs,
  siDocker,
  siDrizzle,
  siExpo,
  siExpress,
  siFastapi,
  siGit,
  siGithubactions,
  siGoogle,
  siJavascript,
  siJsonwebtokens,
  siLangchain,
  siLaravel,
  siMongodb,
  siMongoose,
  siMysql,
  siNextdotjs,
  siNodedotjs,
  siPhp,
  siPostgresql,
  siPython,
  siReact,
  siRedux,
  siRender,
  siResend,
  siSanity,
  siSentry,
  siSpringboot,
  siSqlite,
  siSupabase,
  siTailwindcss,
  siThreedotjs,
  siTypescript,
  siVercel,
  siVite,
  siWhatsapp,
} from "simple-icons";
import type { IconName } from "@/data/portfolio";
import { Icon } from "./Icons";

/** Marks that are black or nearly so would vanish on the graphite ground. */
const isTooDark = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 70;
};

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
  SQLite: siSqlite,
  Drizzle: siDrizzle,
  Sanity: siSanity,
  Resend: siResend,
  "Chart.js": siChartdotjs,
  "Three.js": siThreedotjs,
  Vite: siVite,
  Mongoose: siMongoose,
  JWT: siJsonwebtokens,
  "Google OAuth": siGoogle,
  "OR-Tools": siGoogle,
  "Redux Toolkit": siRedux,
  "MongoDB Atlas Vector Search": siMongodb,
  WhatsApp: siWhatsapp,
};

/** Official artwork for brands the icon set does not carry. */
const brandFiles: Record<string, string> = {
  AWS: "/img/brands/aws-light.svg",
  OpenAI: "/img/brands/openai-light.svg",
  "AWS SDK v3": "/img/brands/aws-light.svg",
  "Amazon EC2": "/img/brands/aws-light.svg",
  CloudWatch: "/img/brands/aws-light.svg",
  "monday.com": "/img/brands/monday.svg",
};

/** Concepts, not companies: there is no logo to use, so these get a drawn icon. */
const conceptIcons: Record<string, IconName> = {
  "REST APIs": "braces",
  "Automated testing": "circle-check",
  RAG: "layers",
  "Vector search": "box",
  "AI Agents": "bot",
  "Agentic workflows": "workflow",
  Optima: "calendar",
};

const hasIcon = (label: string) => Boolean(brandMarks[label] || brandFiles[label] || conceptIcons[label]);

export function BrandIcon({ label }: { label: string }) {
  const mark = brandMarks[label];
  if (mark) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d={mark.path} fill={isTooDark(mark.hex) ? "currentColor" : `#${mark.hex}`} />
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
      <BrandIcon label={label} />
      {label}
    </li>
  );
}

/** Extra chips sit in a native <details>, so "+ more" works without JavaScript
 *  and stays keyboard accessible. */
export function ChipList({ items, visible = items.length }: { items: string[]; visible?: number }) {
  // A chip without a real logo reads as filler, so those stay out of the list.
  const known = items.filter(hasIcon);
  const shown = known.slice(0, visible);
  const extra = known.slice(visible);

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

/** The compact form of a stack: logos only, named for assistive tech and on hover. */
export function StackIcons({ items, limit = 6 }: { items: string[]; limit?: number }) {
  return (
    <ul className="stack-icons" aria-label="Main technologies">
      {items
        .filter(hasIcon)
        .slice(0, limit)
        .map((item) => (
          <li key={item} title={item}>
            <BrandIcon label={item} />
            <span className="sr-only">{item}</span>
          </li>
        ))}
    </ul>
  );
}
