import { useEffect, useRef } from "react";
import { truckArt } from "@/lib/truck-art";

/**
 * "Where we work", drawn: Grand Forks on the left bank, East Grand Forks on
 * the right, the Red River between, and the Sorlie Memorial Bridge (1929,
 * a two-span riveted Parker through truss at the east end of DeMers Ave —
 * hence the humped "camelback" top chords). The cream pickup drives across as
 * the section scrolls.
 *
 * Motion follows the site's rules: CSS scroll timeline only (`--river`), no
 * scroll listeners, no pinning. Without scroll timelines an IntersectionObserver
 * rolls the truck across once. Ice floes drift on a slow loop that the Pause
 * snow toggle and reduced motion both stop; reduced motion parks the truck
 * mid-bridge. Decorative — the heading and paragraph carry the words.
 */

const TRUCK = truckArt({ wheelClass: "truck-wheel", snow: true, shadow: false });

/** One Parker span: polygonal top chord, verticals, diagonals. */
function span(x0: number, x1: number, deckY: number, rise: number) {
  const w = x1 - x0;
  const px = [0, 0.12, 0.27, 0.41, 0.5, 0.59, 0.73, 0.88, 1].map((t) => x0 + w * t);
  // top chord height at each panel point: low at the ends, humped in the middle
  const top = (t: number) => deckY - 18 - rise * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.06) / 0.88)));
  const pts = px.map((x, i) => [x, i === 0 || i === px.length - 1 ? deckY - 4 : top((x - x0) / w)] as const);
  const chord = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const verticals = pts.slice(1, -1).map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)} V${deckY}`).join(" ");
  const diagonals = pts
    .slice(1, -1)
    .map(([x, y], i) => {
      const toward = i < (pts.length - 2) / 2 ? pts[i][0] : pts[i + 2][0];
      return `M${x.toFixed(1)} ${y.toFixed(1)} L${toward.toFixed(1)} ${deckY}`;
    })
    .join(" ");
  return { chord, verticals, diagonals };
}

const DECK = 168;
const LEFT = span(392, 606, DECK, 44);
const RIGHT = span(606, 820, DECK, 44);

function Truss({ front }: { front?: boolean }) {
  const stroke = front ? "#d4c4a0" : "#9d916f";
  const width = front ? 4 : 3;
  return (
    <g opacity={front ? 1 : 0.55}>
      {[LEFT, RIGHT].map((s, i) => (
        <g key={i}>
          <polyline points={s.chord} fill="none" stroke={stroke} strokeWidth={width + 1} strokeLinejoin="round" />
          <path d={s.verticals} stroke={stroke} strokeWidth={width - 1} />
          <path d={s.diagonals} stroke={stroke} strokeWidth={width - 1.5} />
        </g>
      ))}
      {front ? <rect x="388" y={DECK - 3} width="436" height="5" rx="2" fill={stroke} /> : null}
    </g>
  );
}

function Pine({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 -46 L13 -20 H7 L17 0 H-17 L-7 -20 H-13 Z" fill="#0b3a24" />
      <path d="M0 -46 L6 -34 H-6 Z M-9 -18 L-3 -24 L4 -18 Z" fill="#fffaf0" opacity="0.9" />
      <rect x="-2" y="0" width="4" height="6" fill="#3c1e14" />
    </g>
  );
}

function House({ x, y, w = 46, h = 30 }: { x: number; y: number; w?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y={-h} width={w} height={h} fill="#e3d4b2" />
      <path d={`M-5 ${-h} L${w / 2} ${-h - 20} L${w + 5} ${-h} Z`} fill="#4a2418" />
      <path d={`M-5 ${-h} L${w / 2} ${-h - 20} L${w + 5} ${-h} L${w / 2} ${-h - 15} Z`} fill="#fffaf0" />
      <rect x={w * 0.18} y={-h + 9} width="9" height="9" fill="#ffe3a1" opacity="0.85" />
      <rect x={w * 0.6} y={-h + 9} width="9" height="9" fill="#ffe3a1" opacity="0.6" />
    </g>
  );
}

export function RiverCrossing() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.arrived = "";
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div aria-hidden="true">
    <div ref={ref} className="river-section river-frame">
      <svg viewBox="0 0 1200 300" className="river-svg">
        {/* the Red River, frozen at the edges */}
        <path d="M360 186 C420 200 520 206 610 205 C700 204 790 198 856 186 L900 300 H320 Z" fill="#04351c" />
        <g className="river-floes">
          <path d="M470 232 q20 -6 44 0 q-20 7 -44 0 Z" fill="#eef1ec" opacity="0.85" />
          <path d="M640 252 q26 -7 54 0 q-26 8 -54 0 Z" fill="#eef1ec" opacity="0.75" />
          <path d="M560 274 q16 -5 34 0 q-16 6 -34 0 Z" fill="#eef1ec" opacity="0.7" />
        </g>
        <path d="M430 220 H520 M600 240 H700 M520 262 H580" stroke="#0a5c32" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        <text x="606" y="292" textAnchor="middle" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontSize="15" fill="#9fb8a8">
          Red River
        </text>

        {/* Grand Forks bank: downtown blocks, water tower, snow */}
        <g>
          <rect x="34" y="96" width="64" height="72" fill="#0b3a24" />
          <rect x="102" y="70" width="52" height="98" fill="#0d4429" />
          <rect x="158" y="110" width="76" height="58" fill="#0b3a24" />
          <rect x="238" y="88" width="44" height="80" fill="#0d4429" />
          {[[34, 96, 64], [102, 70, 52], [158, 110, 76], [238, 88, 44]].map(([x, y, w]) => (
            <rect key={x} x={x} y={y - 3} width={w} height="5" rx="2" fill="#fffaf0" opacity="0.9" />
          ))}
          {Array.from({ length: 18 }, (_, i) => (
            <rect key={i} x={44 + (i % 6) * 40 + (i % 2) * 6} y={112 + Math.floor(i / 6) * 16} width="7" height="7" fill="#ffe3a1" opacity={0.35 + ((i * 7) % 5) * 0.1} />
          ))}
          <g transform="translate(318 168)">
            <rect x="-2" y="-78" width="4" height="78" fill="#0b3a24" />
            <rect x="-18" y="-70" width="3" height="70" fill="#0b3a24" transform="rotate(8 -18 0)" />
            <rect x="15" y="-70" width="3" height="70" fill="#0b3a24" transform="rotate(-8 15 0)" />
            <ellipse cx="0" cy="-88" rx="26" ry="16" fill="#0d4429" />
            <path d="M-26 -90 Q0 -110 26 -90 Q0 -100 -26 -90 Z" fill="#fffaf0" />
          </g>
          <Pine x={362} y={170} s={0.9} />
          <path d="M0 168 H400 L372 300 H0 Z" fill="#f3ead6" />
          <path d="M0 168 H400" stroke="#cdbf9f" strokeWidth="2" />
          <path d="M0 176 H380" stroke="#c9bfa8" strokeWidth="2" strokeDasharray="14 12" opacity="0.6" />
          <text x="40" y="214" fontFamily="Outfit, system-ui, sans-serif" fontWeight="600" fontSize="15" letterSpacing="2.5" fill="#3c1e14">
            GRAND FORKS, ND
          </text>
        </g>

        {/* East Grand Forks bank: houses and pines */}
        <g>
          <House x={884} y={168} />
          <Pine x={952} y={168} s={1.1} />
          <House x={986} y={168} w={54} h={34} />
          <Pine x={1062} y={168} s={0.95} />
          <House x={1090} y={168} w={44} />
          <Pine x={1160} y={168} s={1.15} />
          <path d="M814 168 H1200 V300 H840 Z" fill="#f3ead6" />
          <path d="M814 168 H1200" stroke="#cdbf9f" strokeWidth="2" />
          <path d="M832 176 H1200" stroke="#c9bfa8" strokeWidth="2" strokeDasharray="14 12" opacity="0.6" />
          <text x="1160" y="214" textAnchor="end" fontFamily="Outfit, system-ui, sans-serif" fontWeight="600" fontSize="15" letterSpacing="2.5" fill="#3c1e14">
            EAST GRAND FORKS, MN
          </text>
        </g>

        {/* the bridge: abutments, centre pier, far truss, deck */}
        <path d="M380 168 h22 v30 h-22 Z M810 168 h22 v30 h-22 Z" fill="#cdbf9f" />
        <path d="M596 172 h20 l6 96 h-32 Z" fill="#b9ab8a" />
        <Truss />
        <rect x="380" y={DECK} width="452" height="8" fill="#2a201a" />
        <text x="606" y="96" textAnchor="middle" fontFamily="Outfit, system-ui, sans-serif" fontSize="12" letterSpacing="1.5" fill="#c9bfa8">
          SORLIE BRIDGE · 1929
        </text>

        {/* the truck rides the deck; the near truss is drawn over it */}
        <g className="river-truck">
          <g transform={`translate(96 ${DECK - 64}) scale(0.42)`} dangerouslySetInnerHTML={{ __html: TRUCK }} />
        </g>
        <Truss front />
      </svg>
    </div>
      {/* Phones crop the skyline to the bridge; name both banks underneath. */}
      <div className="mt-2 flex justify-between text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-gold sm:hidden">
        <span>← Grand Forks, ND</span>
        <span>East Grand Forks, MN →</span>
      </div>
    </div>
  );
}
