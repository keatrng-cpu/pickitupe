import { useEffect, useRef } from "react";

type Leaf = {
  side: "left" | "right";
  inset: number;
  y: number;
  size: number;
  rot: number;
  spin: number;
  sway: number;
  phase: number;
  speed: number;
  tint: number;
};

function seedLeaves(): Leaf[] {
  return Array.from({ length: 22 }, (_, i) => ({
    side: i % 2 === 0 ? "left" : "right",
    inset: 6 + ((i * 17) % 52),
    y: ((i * 41) % 120) - 15,
    size: 14 + (i % 5) * 5,
    rot: (i * 47) % 360,
    spin: (i % 2 === 0 ? 1 : -1) * (0.35 + (i % 5) * 0.12),
    sway: 10 + (i % 4) * 5,
    phase: i * 0.73,
    speed: 0.22 + (i % 7) * 0.07,
    tint: i % 3,
  }));
}

function Maple() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2c.4 1.8 1.4 3.2 3 4.2-.2 1.3.3 2.4 1.4 3.1 1.2.2 2.1-.2 2.8-1.1.8 1.6 1.9 2.8 3.3 3.4-1.1 1.2-1.5 2.6-1.2 4.1.9.9 2 .9 3.2.3-.3 2-1.4 3.5-3.2 4.5.2 1.3-.3 2.4-1.5 3.1-1.3.1-2.2-.4-2.8-1.4-.8 1.2-2 2-3.5 2.3L12 22l-.5-2.5c-1.5-.3-2.7-1.1-3.5-2.3-.6 1-1.5 1.5-2.8 1.4-1.2-.7-1.7-1.8-1.5-3.1C1.6 16.4.5 14.9.2 12.9c1.2.6 2.3.6 3.2-.3.3-1.5-.1-2.9-1.2-4.1C3.6 7.9 4.7 6.7 5.5 5.1c.7.9 1.6 1.3 2.8 1.1 1.1-.7 1.6-1.8 1.4-3.1C11.3 2.2 11.6 2 12 2z" />
    </svg>
  );
}

const TINT = ["text-gold", "text-fg/80", "text-muted"] as const;

export function FallingLeaves() {
  const layer = useRef<HTMLDivElement>(null);
  const nodes = useRef<HTMLSpanElement[]>([]);
  const leaves = useRef<Leaf[]>(seedLeaves());

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;

    let boost = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();
    let frame = 0;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      boost += dy * 0.014;
      if (boost > 7) boost = 7;
      if (boost < -1.4) boost = -1.4;
    };

    const tick = (now: number) => {
      const dt = Math.min(32, now - lastT) / 16.67;
      lastT = now;
      boost *= 0.92;
      const fall = 1 + boost;

      const list = leaves.current;
      for (let i = 0; i < list.length; i++) {
        const leaf = list[i];
        leaf.y += (leaf.speed + Math.max(0.05, boost * 0.45)) * dt * 1.35;
        leaf.rot += leaf.spin * fall * dt * 3.2;
        leaf.phase += 0.035 * dt;
        if (leaf.y > 118) {
          leaf.y = -14;
          leaf.rot = (leaf.rot + 40) % 360;
        }
        if (leaf.y < -18) leaf.y = 110;
        const sway = Math.sin(leaf.phase) * leaf.sway;
        const el = nodes.current[i];
        if (el) {
          el.style.transform = `translate3d(${sway}px, ${leaf.y}vh, 0) rotate(${leaf.rot}deg)`;
        }
      }
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={layer}
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden"
      aria-hidden
    >
      {leaves.current.map((leaf, i) => (
        <span
          key={i}
          ref={(el) => {
            if (el) nodes.current[i] = el;
          }}
          className={`edge-leaf ${TINT[leaf.tint]}`}
          style={{
            [leaf.side]: `${leaf.inset}px`,
            width: leaf.size,
            transform: `translate3d(0, ${leaf.y}vh, 0) rotate(${leaf.rot}deg)`,
          }}
        >
          <Maple />
        </span>
      ))}
    </div>
  );
}
