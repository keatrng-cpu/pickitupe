import { useEffect, useRef, useState } from "react";

/**
 * Counts up once when it scrolls into view (~800 ms, ease-out). The server
 * renders the final number, so crawlers, no-JS and reduced motion all see the
 * real value — the count-up only starts from zero after hydration, and only if
 * the number is still below the fold.
 *
 * Only pass numbers that come from code (pricebook, schedule), never typed-in
 * marketing figures.
 */
export function CountUp({ value, prefix = "", suffix = "", className }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    setShown(0);
    let raf = 0;
    let settle = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - t0) / 800);
          setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        // Animation frames get throttled (background tab, battery saver); a
        // price must never be left reading $0, so land on the real number.
        settle = window.setTimeout(() => setShown(value), 1100);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [value]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {prefix}
      {shown.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
