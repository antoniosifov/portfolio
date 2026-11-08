import { stats } from "@/data/portfolio";
import { Icon } from "./Icons";

export function Stats() {
  return (
    <section className="stats-section" aria-label="Highlights">
      <div className="shell">
        <ul className="stats">
          {stats.map((item) => (
            <li key={item.label}>
              <Icon name={item.icon} size={22} />
              <div>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
