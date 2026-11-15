import type { CSSProperties } from "react";

/**
 * Soft snow over a section. CSS only: transform + opacity, no JS per frame.
 * Flake positions are fixed (seeded) so server and client render the same
 * markup — no hydration mismatch. Paused by the motion toggle; gone under
 * prefers-reduced-motion. On phones it falls three times and settles.
 */
const FLAKES = Array.from({ length: 22 }, (_, i) => {
  // Deterministic pseudo-random spread
  const r = (n: number) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1;
  return {
    left: `${Math.round(r(1) * 1000) / 10}%`,
    size: 3 + Math.round(r(2) * 5),
    dur: 9 + Math.round(r(3) * 9),
    delay: -Math.round(r(4) * 18),
    sway: 10 + Math.round(r(5) * 26),
    opacity: 0.45 + Math.round(r(6) * 50) / 100,
  };
});

export function Snowfall({ className }: { className?: string }) {
  return (
    <div className={`snowfall ${className ?? ""}`} aria-hidden="true">
      {FLAKES.map((f, i) => (
        <span
          key={i}
          style={
            {
              left: f.left,
              width: f.size,
              height: f.size,
              opacity: f.opacity,
              "--dur": `${f.dur}s`,
              "--delay": `${f.delay}s`,
              "--sway": `${f.sway}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
