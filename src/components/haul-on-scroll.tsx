import { useEffect, useRef, useState } from "react";

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * The haul scene.
 *
 * NO SCROLL PINNING. This used to be a 170vh section wrapping a `sticky`
 * container: the viewport froze while you burned 1.7 screens of scrolling to
 * get past it. That reads as the page having stopped responding, and on a
 * trackpad or phone it is genuinely unpleasant — you cannot get to the
 * booking form without sitting through the animation.
 *
 * Now the section is ordinary height in normal flow and the truck is driven
 * by the section's own transit across the viewport: progress runs 0 -> 1 as
 * the section travels from "just below the fold" to "just above it". Scroll
 * speed is entirely the user's. Flick past it and you simply see the truck
 * move quickly, which is what an animation should do.
 *
 * Do not reintroduce `sticky` or a viewport-multiple height here.
 */
export function HaulOnScroll() {
  const track = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0.5);
  const [bedOffset, setBedOffset] = useState(12);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const measure = () => {
      const el = truckRef.current;
      if (!el) return;
      setBedOffset(((el.offsetWidth * 0.22) / window.innerWidth) * 100);
    };

    const compute = () => {
      frame = 0;
      const el = track.current;
      if (!el) return;
      if (mq.matches) {
        // Reduced motion: park mid-load, fully composed, and never move.
        setP(0.5);
        return;
      }
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Total distance the section travels through the viewport, from its top
      // entering the bottom edge to its bottom clearing the top edge.
      const total = rect.height + vh;
      const travelled = vh - rect.top;
      setP(Math.min(1, Math.max(0, travelled / total)));
    };

    // rAF-coalesced so a fast trackpad flick can't queue a layout read per event.
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(compute);
    };
    const onResize = () => {
      measure();
      onScroll();
    };

    measure();
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    mq.addEventListener("change", compute);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", compute);
    };
  }, []);

  // Truck already faces RIGHT — no scale-x flip. Drive left → right.
  const drive = smoothstep(p * 1.08 - 0.04);
  const x = -26 + drive * 110;
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
      className="relative overflow-hidden"
      aria-label="Vintage cream pickup hauling leaves and an armchair"
    >
      <div className="mx-auto w-full max-w-6xl px-4 pt-16 lg:pt-20">
        <p className="kicker">The haul</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">
          Cream pickup. Full bed. Empty yard.
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Leaves, junk, and the chair you meant to donate in 2019.
        </p>
      </div>

      {/* Fixed, modest height in normal flow — no viewport multiples. */}
      <div className="relative mt-8 h-[clamp(20rem,46vh,30rem)]">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
          style={{
            background:
              "radial-gradient(120% 100% at 50% 100%, color-mix(in srgb, var(--color-sioux) 30%, transparent) 0%, transparent 72%)",
          }}
          aria-hidden
        />

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
          className="absolute bottom-12 z-10 will-change-transform sm:bottom-14"
          style={{ transform: `translate3d(${x}vw, ${bounce}px, 0)` }}
        >
          <img
            src="/haul-truck.webp"
            alt="Vintage cream pickup facing right, maple leaves in the bed"
            className="relative w-[min(88vw,720px)] drop-shadow-[0_22px_30px_rgba(0,0,0,0.5)]"
          />
        </div>

        <div className="absolute inset-x-0 bottom-0 h-12 bg-bg-deep/70">
          <div
            className="haul-road mx-auto mt-5 h-1.5 max-w-6xl"
            style={{ backgroundPosition: `${dash}px 0` }}
          />
        </div>
      </div>
    </section>
  );
}
