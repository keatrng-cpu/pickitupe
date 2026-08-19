import type { CSSProperties } from "react";

const LEAVES = [
  { left: "4%", size: "18px", dur: "16s", delay: "0s", drift: "28px" },
  { left: "14%", size: "14px", dur: "22s", delay: "-4s", drift: "-36px" },
  { left: "24%", size: "22px", dur: "18s", delay: "-8s", drift: "18px" },
  { left: "34%", size: "12px", dur: "20s", delay: "-2s", drift: "-22px" },
  { left: "44%", size: "20px", dur: "24s", delay: "-11s", drift: "40px" },
  { left: "55%", size: "16px", dur: "17s", delay: "-6s", drift: "-14px" },
  { left: "65%", size: "24px", dur: "21s", delay: "-9s", drift: "30px" },
  { left: "75%", size: "13px", dur: "19s", delay: "-3s", drift: "-28px" },
  { left: "85%", size: "19px", dur: "23s", delay: "-7s", drift: "22px" },
  { left: "94%", size: "15px", dur: "18s", delay: "-12s", drift: "-18px" },
];

function Maple({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2c.4 1.8 1.4 3.2 3 4.2-.2 1.3.3 2.4 1.4 3.1 1.2.2 2.1-.2 2.8-1.1.8 1.6 1.9 2.8 3.3 3.4-1.1 1.2-1.5 2.6-1.2 4.1.9.9 2 .9 3.2.3-.3 2-1.4 3.5-3.2 4.5.2 1.3-.3 2.4-1.5 3.1-1.3.1-2.2-.4-2.8-1.4-.8 1.2-2 2-3.5 2.3L12 22l-.5-2.5c-1.5-.3-2.7-1.1-3.5-2.3-.6 1-1.5 1.5-2.8 1.4-1.2-.7-1.7-1.8-1.5-3.1C1.6 16.4.5 14.9.2 12.9c1.2.6 2.3.6 3.2-.3.3-1.5-.1-2.9-1.2-4.1C3.6 7.9 4.7 6.7 5.5 5.1c.7.9 1.6 1.3 2.8 1.1 1.1-.7 1.6-1.8 1.4-3.1C11.3 2.2 11.6 2 12 2z" />
    </svg>
  );
}

export function FallingLeaves() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {LEAVES.map((leaf, i) => (
        <span
          key={i}
          className="leaf"
          style={
            {
              left: leaf.left,
              "--size": leaf.size,
              "--dur": leaf.dur,
              "--delay": leaf.delay,
              "--drift": leaf.drift,
            } as CSSProperties
          }
        >
          <Maple />
        </span>
      ))}
    </div>
  );
}
