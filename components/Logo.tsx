type MarkProps = { className?: string; title?: string };

/** The AI monogram, traced from the master logo file. Drawn in currentColor so
 *  the same shape works on the dark curtain and the cream page. */
export function Mark({ className = "", title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 696 527"
      className={`mark ${className}`.trim()}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d="M443 0H508Q516 0 516 8V518Q516 526 508 526H443Q435 526 435 518V116L89 517Q81 527 72 527H6C0 527 -2 521 2.3 515L435.5 4Q439 0 443 0Z" fill="currentColor" />
      <path d="M623 0H688Q696 0 696 8V518Q696 526 688 526H623Q615 526 615 518V8Q615 0 623 0Z" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href="#top" className={`logo ${className}`.trim()}>
      <span className="sr-only">Anton Iosifov — home</span>
      <Mark className="logo-mark" />
      <span className="logo-divider" aria-hidden="true" />
      <span className="logo-name" aria-hidden="true">
        Anton Iosifov
      </span>
    </a>
  );
}
