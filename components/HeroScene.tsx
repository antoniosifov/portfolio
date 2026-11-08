const nodes = [
  { x: 38, y: 126, r: 4 }, { x: 156, y: 72, r: 3 }, { x: 244, y: 182, r: 5 },
  { x: 348, y: 96, r: 3 }, { x: 474, y: 228, r: 5 }, { x: 590, y: 118, r: 3 },
  { x: 708, y: 260, r: 4 }, { x: 836, y: 112, r: 5 }, { x: 968, y: 206, r: 3 },
  { x: 1118, y: 92, r: 4 }, { x: 1284, y: 184, r: 5 }, { x: 92, y: 354, r: 5 },
  { x: 228, y: 300, r: 3 }, { x: 384, y: 414, r: 4 }, { x: 536, y: 344, r: 5 },
  { x: 672, y: 468, r: 3 }, { x: 824, y: 362, r: 4 }, { x: 1006, y: 442, r: 5 },
  { x: 1184, y: 330, r: 3 }, { x: 1374, y: 410, r: 4 }, { x: 54, y: 612, r: 3 },
  { x: 212, y: 548, r: 5 }, { x: 366, y: 676, r: 3 }, { x: 516, y: 566, r: 4 },
  { x: 708, y: 698, r: 5 }, { x: 884, y: 574, r: 3 }, { x: 1040, y: 680, r: 4 },
  { x: 1224, y: 568, r: 5 }, { x: 1392, y: 676, r: 3 },
] as const;

const connections = [
  [0, 1], [0, 11], [1, 2], [1, 3], [2, 4], [2, 12], [3, 4], [3, 5],
  [4, 6], [4, 14], [5, 6], [5, 7], [6, 8], [6, 15], [7, 8], [7, 9],
  [8, 10], [8, 16], [9, 10], [10, 18], [11, 12], [11, 20], [12, 13], [12, 21],
  [13, 14], [13, 22], [14, 15], [14, 23], [15, 16], [15, 24], [16, 17], [16, 25],
  [17, 18], [17, 26], [18, 19], [18, 27], [19, 28], [20, 21], [21, 22], [22, 23],
  [23, 24], [24, 25], [25, 26], [26, 27], [27, 28],
] as const;

export function HeroScene() {
  return (
    <div className="hero-scene hero-network" aria-hidden="true">
      <svg
        className="hero-network-svg"
        viewBox="0 0 1440 820"
        preserveAspectRatio="xMidYMid slice"
        role="presentation"
      >
        <defs>
          <radialGradient id="network-orb" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
            <stop offset="38%" stopColor="#a8b0ae" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#050606" stopOpacity="0" />
          </radialGradient>
          <filter id="network-soft-blur" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="13" />
          </filter>
        </defs>

        <g className="hero-network-orbs" filter="url(#network-soft-blur)">
          <circle cx="270" cy="214" r="72" fill="url(#network-orb)" />
          <circle cx="862" cy="152" r="98" fill="url(#network-orb)" />
          <circle cx="1196" cy="468" r="82" fill="url(#network-orb)" />
          <circle cx="580" cy="648" r="64" fill="url(#network-orb)" />
        </g>

        <g className="hero-network-lines">
          {connections.map(([start, end], index) => (
            <line
              key={`${start}-${end}`}
              x1={nodes[start].x}
              y1={nodes[start].y}
              x2={nodes[end].x}
              y2={nodes[end].y}
              style={{ animationDelay: `${(index % 9) * -0.72}s` }}
            />
          ))}
        </g>

        <g className="hero-network-nodes">
          {nodes.map((node, index) => (
            <g key={`${node.x}-${node.y}`} style={{ animationDelay: `${(index % 8) * -0.84}s` }}>
              <circle className="hero-network-node-halo" cx={node.x} cy={node.y} r={node.r * 3.4} />
              <circle className="hero-network-node-core" cx={node.x} cy={node.y} r={node.r} />
            </g>
          ))}
        </g>

        <g className="hero-network-glyphs">
          <g transform="translate(154 262)">
            <rect x="-18" y="-13" width="36" height="26" rx="3" />
            <path d="m-17-10 17 14 17-14" />
          </g>
          <g transform="translate(478 484)">
            <circle r="22" />
            <path d="M-9-4h18M-9 5h12" />
          </g>
          <g transform="translate(936 306)">
            <rect x="-18" y="-18" width="36" height="36" rx="8" />
            <path d="m-8 3 6-7 6 7 6-7" />
          </g>
          <g transform="translate(1260 610)">
            <circle r="20" />
            <path d="M-7-4a7 7 0 1 1 10 6l-6 6" />
          </g>
        </g>
      </svg>
      <span className="hero-network-vignette" />
    </div>
  );
}
