/** Shared heading for the career sections: label, large title and one line of
 *  context, with the soft wave in the top corner of the section. */
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
    <>
      <SectionWave id={id} />
      <div className="intro">
        <p className="eyebrow">{eyebrow}</p>
        <div className="intro-row">
          <h2 id={`${id}-title`}>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
    </>
  );
}

export function SectionWave({ id }: { id: string }) {
  return (
    <svg className="section-wave" viewBox="0 0 720 240" preserveAspectRatio="xMaxYMin slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-peach`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#efe2d3" stopOpacity="0" />
          <stop offset="0.6" stopColor="#efe2d3" stopOpacity="0.85" />
          <stop offset="1" stopColor="#f5eee4" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${id}-olive`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c3c9a6" stopOpacity="0.5" />
          <stop offset="1" stopColor="#7f8f58" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path d="M120 190C260 180 300 40 440 34c120-5 150 96 280 74v62C560 215 380 226 120 190Z" fill={`url(#${id}-peach)`} />
      <path d="M720 0v106c-46 8-92 8-130-14C640 84 690 44 720 0Z" fill={`url(#${id}-olive)`} />
    </svg>
  );
}
