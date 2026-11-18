import { useEffect, useRef, useState } from "react";

/**
 * Counts up once when it scrolls into view (~800 ms, ease-out). The server
 * renders the final number, so crawlers, no-JS and reduced motion all see the
 * real value. The count-up only starts from zero once the number scrolls into
 * view, and only if it was below the fold at hydration; until then it reads the
 * real value.
 *
 * Only pass numbers that come from code (pricebook, schedule), never typed-in
 * marketing figures.
 *
 * The clock starts on the first animation frame, not when the observer fires:
 * a frame's timestamp can be earlier than performance.now() in that callback,
 * which made progress negative and printed values like -1,402. Progress is
 * clamped to 0..1, the shown number never drops below 0 or overshoots, and once
 * the settle timer lands the real value no late frame can overwrite it.
 */
export function CountUp({ value, prefix = "", suffix = "", className }: { value: number; prefix?: string; suffix?: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    let raf = 0;
    let settle = 0;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      setShown(value);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        // Drop to 0 only now, so an unscrolled or unread number stays real.
        setShown(0);
        let t0 = -1;
        const tick = (now: number) => {
          if (done) return;
          if (t0 < 0) t0 = now;
          const p = Math.max(0, Math.min(1, (now - t0) / 800));
          if (p >= 1) return finish();
          setShown(Math.max(0, Math.min(value, Math.round(value * (1 - Math.pow(1 - p, 3))))));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        // Animation frames get throttled (background tab, battery saver); a
        // price must never be left reading $0, so land on the real number.
        settle = window.setTimeout(finish, 1100);
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => {
      done = true;
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
