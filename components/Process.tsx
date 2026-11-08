import { processSteps } from "@/data/portfolio";
import { Icon } from "./Icons";

export function Process() {
  return (
    <section id="process" className="section process-section" aria-labelledby="process-title">
      <div className="shell process">
        <div className="process-intro">
          <p className="eyebrow">Process</p>
          <h2 id="process-title">
            From idea <br />
            to <em className="h2-accent">production</em>
          </h2>
        </div>
        <ol className="steps">
          {processSteps.map((step) => (
            <li key={step.title}>
              <span className="step-icon">
                <Icon name={step.icon} size={20} />
              </span>
              <strong>{step.title}</strong>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
