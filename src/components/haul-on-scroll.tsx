import { useEffect, useRef, useState } from "react";

const JUNK = [
  { x: 14, y: 22, s: 0.85, bob: 1.6, kind: "sofa" as const },
  { x: 28, y: 10, s: 0.62, bob: 2.2, kind: "box" as const },
  { x: 20, y: 4, s: 0.5, bob: 2.8, kind: "chair" as const },
  { x: 32, y: 24, s: 0.48, bob: 1.5, kind: "bag" as const },
];

function Sofa() {
  return (
    <svg viewBox="0 0 64 36" className="h-8 w-14 text-gold" aria-hidden>
      <rect x="4" y="14" width="56" height="14" rx="3" fill="currentColor" />
      <rect x="8" y="6" width="20" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <rect x="36" y="6" width="20" height="12" rx="3" fill="currentColor" opacity="0.85" />
      <circle cx="12" cy="30" r="3" fill="var(--color-fg)" />
      <circle cx="52" cy="30" r="3" fill="var(--color-fg)" />
    </svg>
  );
}
function Box() {
  return (
    <svg viewBox="0 0 40 36" className="h-7 w-8 text-fg" aria-hidden>
      <path d="M4 12 L20 4 L36 12 L36 30 L4 30 Z" fill="currentColor" opacity="0.85" />
      <path d="M20 4 L20 30" stroke="var(--color-gold)" strokeWidth="1.5" />
    </svg>
  );
}
function Chair() {
  return (
    <svg viewBox="0 0 32 40" className="h-9 w-7 text-gold" aria-hidden>
      <rect x="6" y="2" width="20" height="16" rx="2" fill="currentColor" />
      <rect x="6" y="18" width="20" height="6" fill="currentColor" />
      <rect x="6" y="24" width="3" height="14" fill="currentColor" />
      <rect x="23" y="24" width="3" height="14" fill="currentColor" />
    </svg>
  );
}
function Bag() {
  return (
    <svg viewBox="0 0 28 34" className="h-8 w-6 text-fg" aria-hidden>
      <path d="M6 10 C6 6 22 6 22 10 L24 30 H4 Z" fill="currentColor" opacity="0.8" />
      <path d="M10 10 C10 4 18 4 18 10" stroke="var(--color-gold)" fill="none" strokeWidth="2" />
    </svg>
  );
}

const KIND = { sofa: Sofa, box: Box, chair: Chair, bag: Bag };

export function HaulOnScroll() {
  const track = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0.08);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const el = track.current;
      if (!el) return;
      if (mq.matches) {
        setP(0.42);
        return;
      }
      const rect = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight * 0.4;
      const scrolled = -rect.top + window.innerHeight * 0.2;
      setP(Math.min(1, Math.max(0, scrolled / Math.max(span, 1))));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      mq.removeEventListener("change", update);
    };
  }, []);

  const x = -48 + p * 148;
  const bounce = Math.sin(p * Math.PI * 10) * 6;
  const dash = p * 260;

  return (
    <section ref={track} className="relative h-[180vh]" aria-label="Silver haul truck animation">
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-bg">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8">
          <p className="text-xs tracking-[0.28em] text-gold">THE RIG</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">
            Silver Sierra. Full bed. Empty yard.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Scroll and the crew cab hauls the pile — leaves, junk, and the chair
            you meant to donate in 2019.
          </p>
        </div>

        <div className="relative mt-auto h-[62%] min-h-64">
          {Array.from({ length: 14 }).map((_, i) => {
            const delay = (i / 14) * 0.85;
            const visible = p > delay ? Math.min(1, (p - delay) * 4) : 0;
            return (
              <span
                key={i}
                className="pointer-events-none absolute text-gold"
                style={{
                  left: `${6 + ((i * 17 + p * 48) % 88)}%`,
                  bottom: `${42 + Math.sin(p * 12 + i) * 12 + i * 0.5}%`,
                  opacity: visible * 0.55,
                  transform: `rotate(${i * 24 + p * 200}deg) scale(${0.6 + (i % 3) * 0.2})`,
                }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d="M12 2c.4 1.8 1.4 3.2 3 4.2-.2 1.3.3 2.4 1.4 3.1 1.2.2 2.1-.2 2.8-1.1.8 1.6 1.9 2.8 3.3 3.4-1.1 1.2-1.5 2.6-1.2 4.1.9.9 2 .9 3.2.3-.3 2-1.4 3.5-3.2 4.5.2 1.3-.3 2.4-1.5 3.1-1.3.1-2.2-.4-2.8-1.4-.8 1.2-2 2-3.5 2.3L12 22l-.5-2.5c-1.5-.3-2.7-1.1-3.5-2.3-.6 1-1.5 1.5-2.8 1.4-1.2-.7-1.7-1.8-1.5-3.1C1.6 16.4.5 14.9.2 12.9c1.2.6 2.3.6 3.2-.3.3-1.5-.1-2.9-1.2-4.1C3.6 7.9 4.7 6.7 5.5 5.1c.7.9 1.6 1.3 2.8 1.1 1.1-.7 1.6-1.8 1.4-3.1C11.3 2.2 11.6 2 12 2z" />
                </svg>
              </span>
            );
          })}

          <div
            className="absolute bottom-14 will-change-transform sm:bottom-16"
            style={{
              transform: `translate3d(${x}vw, ${bounce}px, 0)`,
            }}
          >
            <div className="relative w-[min(96vw,720px)]">
              {JUNK.map((item) => {
                const Icon = KIND[item.kind];
                const y = Math.sin(p * Math.PI * 8 * item.bob) * 9;
                return (
                  <span
                    key={item.kind}
                    className="absolute z-20"
                    style={{
                      left: `${item.x}%`,
                      top: `${item.y}%`,
                      transform: `translateY(${y}px) scale(${item.s})`,
                    }}
                  >
                    <Icon />
                  </span>
                );
              })}
              <img
                src="/haul-truck.png"
                alt="Silver 2020 crew-cab pickup hauling leaves and junk"
                className="relative z-10 w-full -scale-x-100 drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 h-16 bg-bg-deep">
            <div
              className="haul-road mx-auto mt-6 h-1.5 max-w-6xl"
              style={{ backgroundPosition: `${dash}px 0` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
