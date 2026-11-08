/** Shared heading for the career sections: label, large title and one line of
 *  context. */
export function SectionIntro({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="intro">
      <p className="eyebrow">{eyebrow}</p>
      <div className="intro-row">
        <h2 id={`${id}-title`}>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
