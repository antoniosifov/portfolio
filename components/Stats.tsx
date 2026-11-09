import { stats } from "@/data/portfolio";

export function Stats() {
  return (
    <section className="stats-section" aria-label="Highlights">
      <div className="shell">
        <ul className="stats">
          {stats.map((item) => (
            <li key={item.label}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
