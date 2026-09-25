import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Rise-into-view for a section, once.
 *
 * Rules that keep it from being the usual scroll-jank:
 *  - Server HTML has no reveal state, so nothing is hidden without JS or
 *    before hydration — no invisible content for crawlers or slow phones.
 *  - Anything already on screen at mount is left alone (no flash on load);
 *    only content still below the fold gets `pending` and rises on arrival.
 *  - One observer per element, disconnected after it fires. No scroll
 *    listeners, no layout reads in a loop.
 *  - prefers-reduced-motion: CSS forces it visible and static.
 */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className,
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) return;
    el.dataset.reveal = "pending";
    if (delay) el.style.setProperty("--reveal-delay", `${delay}ms`);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.reveal = "shown";
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
