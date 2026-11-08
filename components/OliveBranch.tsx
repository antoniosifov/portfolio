const leaves = [
  { x: 24, y: 109, rotate: -62, scale: 0.9 },
  { x: 49, y: 102, rotate: 28, scale: 0.9 },
  { x: 74, y: 92, rotate: -72, scale: 1 },
  { x: 102, y: 80, rotate: 14, scale: 0.95 },
  { x: 130, y: 65, rotate: -82, scale: 1 },
  { x: 160, y: 48, rotate: 4, scale: 0.9 },
  { x: 184, y: 33, rotate: -78, scale: 0.85 },
  { x: 190, y: 29, rotate: -34, scale: 0.7 },
];

/** A single olive sprig. The stem is one cubic curve; the leaves sit on points
 *  sampled along it and alternate sides. */
export function OliveBranch({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 210 125" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="leaf-fill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5e6c34" />
          <stop offset="1" stopColor="#9ba866" />
        </linearGradient>
      </defs>
      <path d="M8 112C60 104 120 74 192 28" fill="none" stroke="#6a6a3c" strokeWidth="2.6" strokeLinecap="round" />
      {leaves.map((leaf, index) => (
        <g key={index} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}>
          <path d="M0 0C9-13 27-13 38 0 27 13 9 13 0 0Z" fill="url(#leaf-fill)" />
          <path d="M3 0h32" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}
