import { useEffect, useRef, useState } from "react";

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export function HaulOnScroll() {
  const track = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0.08);
  const [bedOffset, setBedOffset] = useState(12);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const measure = () => {
      const el = truckRef.current;
      if (!el) return;
      setBedOffset((el.offsetWidth * 0.22) / window.innerWidth * 100);
    };
    const update = () => {
      const el = track.current;
      if (!el) return;
      if (mq.matches) {
        setP(0.58);
        return;
      }
      const rect = el.getBoundingClientRect();
      const span = el.offsetHeight - window.innerHeight * 0.4;
      const scrolled = -rect.top + window.innerHeight * 0.2;
      setP(Math.min(1, Math.max(0, scrolled / Math.max(span, 1))));
    };
    measure();
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", () => {
      measure();
      update();
    });
    mq.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", update);
    };
  }, []);

  // Truck already faces RIGHT — no scale-x flip. Drive left → right.
  const x = -52 + p * 156;
  const bounce = Math.sin(p * Math.PI * 6) * 5;
  const dash = -p * 420;
  const load = smoothstep((p - 0.42) / 0.2);
  const bedX = x + bedOffset;
  const chairRest = 54;
  const chairX = chairRest + (bedX - chairRest) * load;
  const chairArc = Math.sin(load * Math.PI) * 56;
  const chairBottom = 11 + load * 16;

  return (
    <section
      ref={track}
      className="relative h-[170vh]"
      aria-label="Vintage cream pickup hauling leaves and an armchair"
    >
      <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-bg">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-8">
          <p className="kicker">The haul</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">
            Cream pickup. Full bed. Empty yard.
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Scroll and the truck takes the pile — leaves, junk, and the chair
            you meant to donate in 2019.
          </p>
        </div>

        <div className="relative mt-auto h-[64%] min-h-72">
          {Array.from({ length: 12 }).map((_, i) => {
            const delay = (i / 12) * 0.8;
            const visible = p > delay ? Math.min(1, (p - delay) * 4) : 0;
            return (
              <span
                key={i}
                className="pointer-events-none absolute text-gold"
                style={{
                  left: `${8 + ((i * 19 + p * 36) % 84)}%`,
                  bottom: `${46 + Math.sin(p * 10 + i) * 10 + i * 0.4}%`,
                  opacity: visible * 0.45,
                  transform: `rotate(${i * 24 + p * 160}deg) scale(${0.55 + (i % 3) * 0.18})`,
                }}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
                  <path d="M12 2c.4 1.8 1.4 3.2 3 4.2-.2 1.3.3 2.4 1.4 3.1 1.2.2 2.1-.2 2.8-1.1.8 1.6 1.9 2.8 3.3 3.4-1.1 1.2-1.5 2.6-1.2 4.1.9.9 2 .9 3.2.3-.3 2-1.4 3.5-3.2 4.5.2 1.3-.3 2.4-1.5 3.1-1.3.1-2.2-.4-2.8-1.4-.8 1.2-2 2-3.5 2.3L12 22l-.5-2.5c-1.5-.3-2.7-1.1-3.5-2.3-.6 1-1.5 1.5-2.8 1.4-1.2-.7-1.7-1.8-1.5-3.1C1.6 16.4.5 14.9.2 12.9c1.2.6 2.3.6 3.2-.3.3-1.5-.1-2.9-1.2-4.1C3.6 7.9 4.7 6.7 5.5 5.1c.7.9 1.6 1.3 2.8 1.1 1.1-.7 1.6-1.8 1.4-3.1C11.3 2.2 11.6 2 12 2z" />
                </svg>
              </span>
            );
          })}

          <img
            src="/haul-chair.webp"
            alt=""
            className="absolute z-20 w-24 origin-bottom drop-shadow-[0_12px_18px_rgba(0,0,0,0.4)] sm:w-32"
            style={{
              left: `${chairX}vw`,
              bottom: `${chairBottom}%`,
              transform: `translate(-50%, ${-chairArc}px) rotate(${(1 - load) * -8}deg)`,
            }}
          />

          <div
            ref={truckRef}
            className="absolute bottom-16 z-10 will-change-transform sm:bottom-[4.5rem]"
            style={{
              transform: `translate3d(${x}vw, ${bounce}px, 0)`,
            }}
          >
            <img
              src="/haul-truck.webp"
              alt="Vintage cream pickup facing right, maple leaves in the bed"
              className="relative w-[min(92vw,700px)] drop-shadow-[0_18px_24px_rgba(0,0,0,0.45)]"
            />
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
