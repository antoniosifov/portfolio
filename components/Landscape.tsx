/** A soft illustrated valley used on the device screens and the CTA card:
 *  hazy sky, a low sun, three ridges and a strip of water. Pure SVG, so it
 *  stays crisp at any size and costs nothing to load. */
export function Landscape({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#dde4e8" />
          <stop offset="0.55" stopColor="#f2e2cc" />
          <stop offset="1" stopColor="#f7ebdc" />
        </linearGradient>
        <radialGradient id="ls-sun" cx="0.64" cy="0.4" r="0.38">
          <stop offset="0" stopColor="#fff7e8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff7e8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ls-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#aeb8b4" />
          <stop offset="1" stopColor="#ccd3cd" />
        </linearGradient>
        <linearGradient id="ls-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d8a57" />
          <stop offset="1" stopColor="#99a46a" />
        </linearGradient>
        <linearGradient id="ls-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b5731" />
          <stop offset="1" stopColor="#6c7a40" />
        </linearGradient>
        <linearGradient id="ls-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6dfdc" />
          <stop offset="1" stopColor="#ebe3d4" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#ls-sky)" />
      <rect width="400" height="260" fill="url(#ls-sun)" />
      <path d="M0 152c60-30 110-22 160-40s90 8 140-8 72 6 100-4v100H0Z" fill="url(#ls-far)" />
      <path d="M0 178c50-15 90-6 130-26s70-2 110-10 90 8 160-4v122H0Z" fill="url(#ls-mid)" />
      <rect y="214" width="400" height="46" fill="url(#ls-water)" />
      <path d="M0 206c60-10 100 14 150 6s80 18 140 6 70 8 110 0v42H0Z" fill="url(#ls-near)" />
    </svg>
  );
}
