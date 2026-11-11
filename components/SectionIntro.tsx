/** Shared heading for the career sections: large title and one line of context. The title rises once out
 *  of its own line mask and the line of context follows (lib/quiet and 50-career.css); without script, or
 *  with reduced motion, both are simply there. */
export function SectionIntro({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="intro">
      <div className="intro-row">
        <h2 id={`${id}-title`}>
          <span className="intro-mask">
            <span className="intro-line">{title}</span>
          </span>
        </h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
