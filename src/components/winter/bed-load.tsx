import type { CSSProperties, ReactNode } from "react";

/**
 * "How much is half the truck?" — the question every junk quote stalls on.
 * A cutaway of the pickup bed that loads to the size the visitor tapped in the
 * quick quote. Each pick drops its own load in, item by item (the group is
 * keyed on the size, so the drop replays on change and never loops).
 *
 * Decorative: the size label and the pricebook hint under the chips carry the
 * meaning, so the SVG is aria-hidden. The gauge under the bed only shows the
 * fractions the pricebook already names (quarter, half, full) — no volumes.
 *
 * Motion: CSS only (`.load-item`, `.load-gauge-fill`, `.load-strap`), off on
 * html[data-motion="paused"] and under prefers-reduced-motion.
 */

const BED = { left: 30, right: 262, floor: 112, wall: 76 };

const bag = (x: number, w = 28, h = 26, y = BED.floor) => (
  <>
    <path
      d={`M${x} ${y} q-2 -${h * 0.55} ${w * 0.18} -${h * 0.85} q${w * 0.32} -${h * 0.25} ${w * 0.64} 0 q${w * 0.2} ${h * 0.3} ${w * 0.18} ${h * 0.85} z`}
      fill="#231c17"
    />
    <path d={`M${x + w * 0.42} ${y - h * 0.86} l${w * 0.08} -6 l${w * 0.08} 6`} stroke="#3a2f27" strokeWidth="2.5" fill="none" />
    <path d={`M${x + w * 0.2} ${y - h * 0.55} q${w * 0.1} -${h * 0.18} ${w * 0.26} -${h * 0.2}`} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="2" fill="none" />
  </>
);

const couch = (x: number, w = 104, y = BED.floor) => (
  <>
    <rect x={x + 6} y={y - 34} width={w - 12} height={20} rx={5} fill="#7a3a26" />
    <rect x={x} y={y - 18} width={w} height={16} rx={5} fill="#8d4a31" />
    <rect x={x - 2} y={y - 26} width={12} height={24} rx={5} fill="#6b3221" />
    <rect x={x + w - 10} y={y - 26} width={12} height={24} rx={5} fill="#6b3221" />
    <rect x={x + 4} y={y - 2} width={5} height={2} fill="#2a201a" />
    <rect x={x + w - 9} y={y - 2} width={5} height={2} fill="#2a201a" />
  </>
);

const fridge = (x: number, y = BED.floor) => (
  <>
    <rect x={x} y={y - 60} width={30} height={60} rx={3} fill="#f1ece0" stroke="#d9c79f" strokeWidth="1" />
    <rect x={x} y={y - 38} width={30} height={1.5} fill="#d9c79f" />
    <rect x={x + 24} y={y - 54} width={2} height={11} rx={1} fill="#b9b3a6" />
    <rect x={x + 24} y={y - 33} width={2} height={14} rx={1} fill="#b9b3a6" />
  </>
);

const washer = (x: number, y = BED.floor) => (
  <>
    <rect x={x} y={y - 36} width={34} height={36} rx={3} fill="#e9e4d8" stroke="#d9c79f" strokeWidth="1" />
    <rect x={x} y={y - 36} width={34} height={7} rx={3} fill="#d9d2c2" />
    <circle cx={x + 17} cy={y - 15} r={10} fill="#5f6f69" />
    <circle cx={x + 17} cy={y - 15} r={6.5} fill="#8fa39b" />
  </>
);

const box = (x: number, y: number, w = 32, h = 22) => (
  <>
    <rect x={x} y={y - h} width={w} height={h} rx={2} fill="#b98a55" />
    <rect x={x} y={y - h} width={w} height={4} rx={1} fill="#9b7140" />
    <rect x={x + w / 2 - 2} y={y - h} width={4} height={h} fill="#d9b27c" opacity="0.6" />
  </>
);

const dresser = (x: number, y = BED.floor) => (
  <>
    <rect x={x} y={y - 40} width={40} height={40} rx={2} fill="#9b7140" />
    {[0, 1, 2].map((r) => (
      <g key={r}>
        <rect x={x + 3} y={y - 37 + r * 12} width={34} height={10} rx={1.5} fill="#b98a55" />
        <rect x={x + 18} y={y - 33 + r * 12} width={4} height={2} rx={1} fill="#5a2a1c" />
      </g>
    ))}
  </>
);

const mattress = (x: number, y: number, w = 96) => (
  <g transform={`rotate(-9 ${x} ${y})`}>
    <rect x={x} y={y - 12} width={w} height={12} rx={5} fill="#f4f6f2" />
    <path d={`M${x + 6} ${y - 6} h${w - 12}`} stroke="#d9c79f" strokeWidth="1.2" strokeDasharray="3 4" />
  </g>
);

/** One layout per size. Order inside a load is the order things drop in. */
const LOADS: Record<string, { gauge: number; items: ReactNode[]; trips?: number }> = {
  bags: {
    gauge: 0.12,
    items: [bag(200, 30, 28), bag(230, 28, 30), bag(172, 26, 22)],
  },
  single: {
    gauge: 0.12,
    items: [couch(150)],
  },
  quarter: {
    gauge: 0.25,
    items: [fridge(228), washer(190)],
  },
  half: {
    gauge: 0.5,
    items: [fridge(228), washer(190), box(152, BED.floor, 34, 24), box(156, BED.floor - 24, 28, 20), bag(192, 30, 24, BED.floor - 36)],
  },
  full: {
    gauge: 1,
    items: [
      fridge(228),
      washer(190),
      couch(84),
      dresser(38),
      box(41, BED.floor - 40, 34, 20),
      mattress(92, BED.floor - 34),
      bag(192, 30, 24, BED.floor - 36),
      bag(150, 26, 22, BED.floor - 40),
    ],
  },
  overflow: {
    gauge: 1,
    trips: 2,
    items: [
      fridge(228),
      washer(190),
      couch(84),
      dresser(38),
      box(41, BED.floor - 40, 34, 20),
      mattress(92, BED.floor - 34),
      bag(192, 30, 24, BED.floor - 36),
      bag(150, 26, 22, BED.floor - 40),
      bag(110, 28, 24, BED.floor - 50),
      bag(60, 24, 20, BED.floor - 58),
    ],
  },
};

export function BedLoad({ size, className }: { size: string; className?: string }) {
  const load = LOADS[size] ?? LOADS.single;
  const len = BED.right - BED.left;
  const strapped = load.gauge >= 1;
  return (
    <svg viewBox="0 0 340 172" className={`load-svg ${className ?? ""}`} aria-hidden="true">
      {/* ground shadow */}
      <ellipse cx="170" cy="146" rx="158" ry="5" fill="#000" opacity="0.2" />

      {/* the load — keyed so a new size replays the drop */}
      <g key={size}>
        {load.items.map((item, i) => (
          <g key={i} className="load-item" style={{ "--i": i } as CSSProperties}>
            {item}
          </g>
        ))}
        {strapped ? (
          <path
            className="load-strap"
            d={`M${BED.left + 4} ${BED.wall} L${BED.left + 60} 52 L${BED.right - 40} 44 L${BED.right} ${BED.wall}`}
            stroke="#e2b33c"
            strokeWidth="2.5"
            fill="none"
            pathLength={1}
            style={{ "--i": load.items.length } as CSSProperties}
          />
        ) : null}
      </g>

      {/* cutaway bed: see-through side wall so the load reads as "inside" */}
      <rect
        x={BED.left}
        y={BED.wall}
        width={len}
        height={BED.floor - BED.wall + 6}
        rx={3}
        fill="#efe2c4"
        fillOpacity="0.1"
        stroke="#efe2c4"
        strokeWidth="2.5"
      />
      <rect x={BED.left} y={BED.floor + 2} width={len} height={6} rx={2} fill="#d9c79f" />
      <rect x={BED.left - 6} y={BED.wall + 8} width={7} height={11} rx={2} fill="#a5281b" />

      {/* cab + hood: the vintage pickup from truck-art.ts, cut away at the bed */}
      <path d="M262 122 V64 C262 52 270 44 282 44 H300 C309 44 314 50 317 58 L324 84 V122 Z" fill="#efe2c4" />
      <path d="M270 45 C276 40 302 40 310 47 C298 45 280 45 270 48 Z" fill="#fffaf0" />
      <path d="M270 84 V66 C270 59 275 53 282 53 H298 C303 53 306 57 308 62 L314 84 Z" fill="#16362a" />
      <path d="M276 80 L286 57 H290 L280 80 Z" fill="#ffffff" opacity="0.16" />
      <path d="M322 84 H330 C336 86 340 92 340 100 V122 H322 Z" fill="#efe2c4" />
      <path d="M266 100 H338" stroke="#a8783e" strokeWidth="0.9" opacity="0.85" />
      <circle cx="331" cy="100" r="5.5" fill="#dcd8cf" />
      <circle cx="331.5" cy="100" r="3.6" fill="#ffe3a1" />
      <rect x="254" y="119" width="40" height="5" rx="2.5" fill="#2a201a" />

      {/* fenders + whitewall wheels */}
      <path d="M64 124 C64 104 76 96 92 96 C109 96 120 104 121 124 Z" fill="#e0cfa8" />
      <path d="M272 124 C274 104 286 96 300 96 C316 96 328 106 334 124 Z" fill="#e0cfa8" />
      {[92, 300].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy={128} r={18} fill="#1b1612" />
          <circle cx={cx} cy={128} r={12.5} fill="#f4ecdc" />
          <circle cx={cx} cy={128} r={8} fill="#dcd8cf" />
          <circle cx={cx - 2} cy={126} r={2.6} fill="#ffffff" opacity="0.7" />
          <circle cx={cx} cy={128} r={2.4} fill="#5a2a1c" />
        </g>
      ))}

      {/* gauge: how much of the bed this pick takes, cab end first */}
      <g className="load-gauge">
        <rect x={BED.left} y={160} width={len} height={5} rx={2.5} fill="#efe2c4" opacity="0.18" />
        <rect
          className="load-gauge-fill"
          x={BED.left}
          y={160}
          width={len}
          height={5}
          rx={2.5}
          fill="#d4c4a0"
          style={{ transform: `scaleX(${load.gauge})` }}
        />
        {[
          [0.25, "¼"],
          [0.5, "½"],
          [1, "full"],
        ].map(([f, label]) => {
          const x = BED.right - len * (f as number);
          return (
            <g key={label as string}>
              <rect x={x - 0.75} y={156} width={1.5} height={13} fill="#efe2c4" opacity="0.5" />
              <text
                x={x}
                y={154}
                textAnchor={f === 1 ? "start" : "middle"}
                fontSize="9"
                fill="#c9bfa8"
                fontFamily="system-ui, sans-serif"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>

      {load.trips ? (
        <g className="load-trips">
          <rect x="262" y="8" width="70" height="24" rx="12" fill="#d4c4a0" />
          <text x="297" y="24.5" textAnchor="middle" fontSize="12" fontWeight="700" fill="#04351c" fontFamily="system-ui, sans-serif">
            × {load.trips} trips
          </text>
        </g>
      ) : null}
    </svg>
  );
}
