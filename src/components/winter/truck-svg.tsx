/**
 * Side view of the cream pickup, loaded for winter: couch, fridge, boxes,
 * snow on the roof. Faces right (never flip it — same rule as haul-truck.webp).
 * Pure SVG, so it costs nothing to ship and is the first paint of the hero
 * while the 3D scene loads, and the truck that drives the "how it works" road.
 */
export function TruckSvg({
  className,
  title,
  wheelsSpin = false,
}: {
  className?: string;
  title?: string;
  wheelsSpin?: boolean;
}) {
  const wheel = (cx: number) => (
    <g className={wheelsSpin ? "truck-wheel" : undefined} style={{ transformOrigin: `${cx}px 128px` }}>
      <circle cx={cx} cy={128} r={22} fill="#1b1612" />
      <circle cx={cx} cy={128} r={11} fill="#efe2c4" />
      <circle cx={cx} cy={128} r={3.5} fill="#5a2a1c" />
      <rect x={cx - 1.2} y={117} width={2.4} height={6} rx={1} fill="#5a2a1c" />
    </g>
  );
  return (
    <svg
      viewBox="0 0 320 160"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {/* shadow */}
      <ellipse cx="160" cy="151" rx="140" ry="6" fill="#000" opacity="0.18" />
      {/* load: boxes, couch, fridge */}
      <rect x="28" y="50" width="26" height="22" rx="2" fill="#b98a55" />
      <rect x="31" y="34" width="20" height="17" rx="2" fill="#9b7140" />
      <rect x="30" y="31" width="22" height="4" rx="2" fill="#f4f6f2" />
      <path d="M56 84 V64 q0-6 6-6 h44 q6 0 6 6 v20 z" fill="#7a3a26" />
      <rect x="54" y="70" width="60" height="14" rx="4" fill="#8d4a31" />
      <rect x="60" y="55" width="44" height="4" rx="2" fill="#f4f6f2" />
      <rect x="114" y="34" width="30" height="50" rx="3" fill="#f1ece0" stroke="#d9c79f" strokeWidth="1" />
      <rect x="114" y="54" width="30" height="1.5" fill="#d9c79f" />
      <rect x="139" y="40" width="2" height="10" rx="1" fill="#b9b3a6" />
      <rect x="113" y="30" width="32" height="5" rx="2.5" fill="#f4f6f2" />
      <path d="M50 66 L118 52" stroke="#e2b33c" strokeWidth="2.5" />
      {/* bed */}
      <rect x="20" y="82" width="132" height="32" rx="4" fill="#efe2c4" />
      <rect x="20" y="82" width="132" height="5" rx="2" fill="#d9c79f" />
      <rect x="14" y="88" width="8" height="10" rx="2" fill="#a5281b" />
      {/* cab */}
      <path d="M150 114 V58 q0-14 14-14 h26 q10 0 14 10 l12 30 v30 z" fill="#efe2c4" />
      <path d="M158 63 q0-8 8-8 h22 q6 0 8 6 l7 19 h-45 z" fill="#16362a" />
      <path d="M163 59 l6 0 l-10 18 h-1 z" fill="#ffffff" opacity="0.18" />
      <rect x="152" y="40" width="54" height="7" rx="3.5" fill="#f4f6f2" />
      {/* door lettering */}
      <text x="183" y="99" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontWeight="900" fontSize="9.5" fill="#5a2a1c">
        Pick It Up E
      </text>
      {/* hood */}
      <path d="M204 84 h62 q22 2 26 18 v12 h-88 z" fill="#efe2c4" />
      <rect x="288" y="94" width="5" height="18" rx="2" fill="#d7d2c6" />
      {/* fenders */}
      <path d="M48 118 q0-28 30-28 q30 0 30 28 z" fill="#d9c79f" />
      <path d="M208 118 q0-28 30-28 q30 0 30 28 z" fill="#d9c79f" />
      {/* headlight */}
      <circle cx="270" cy="96" r="6.5" fill="#d7d2c6" />
      <circle cx="271" cy="96" r="4.5" fill="#ffe3a1" />
      <circle cx="275" cy="96" r="16" fill="#ffe3a1" opacity="0.12" />
      {/* running board + bumpers */}
      <rect x="104" y="114" width="108" height="5" rx="2" fill="#2a201a" />
      <rect x="288" y="110" width="16" height="7" rx="3.5" fill="#d7d2c6" />
      <rect x="8" y="110" width="16" height="7" rx="3.5" fill="#d7d2c6" />
      {wheel(78)}
      {wheel(238)}
    </svg>
  );
}
