type MarkProps = { className?: string; title?: string };

/** The ΛI monogram: a thin left leg, a heavy right leg and a bar. Drawn in
 *  currentColor so the same shape works on the dark curtain, the cream page
 *  and the device screens. */
export function Mark({ className = "", title }: MarkProps) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={`mark ${className}`.trim()}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      <path d="M0 92 42 8h9L9 92Z" fill="currentColor" />
      <path d="M42 8h18l32 84H74Z" fill="currentColor" />
      <rect x="104" y="8" width="16" height="84" fill="currentColor" />
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
