import { useEffect, useRef, useState } from "react";

/**
 * The haul scene.
 *
 * Was an illustrated truck+chair rig driven by scroll position (see git
 * history — src/components/haul-on-scroll.tsx before this commit). Replaced
 * at the owner's request with the video Grok Imagine generated: two people
 * tarp-dragging and loading leaves, on-brand (cream truck, mahogany-ish
 * palette) even though the rendering technique differs from the engraved
 * door-hanger line art.
 *
 * NOT scroll-scrubbed. Video currentTime tied to scroll position is a real
 * technique but it is fragile — it needs the whole file buffered before
 * scrubbing is smooth, iOS Safari fights programmatic seeking, and a stutter
 * reads as "broken" rather than "animation." Instead: an ordinary looping
 * video, gated by IntersectionObserver so it only plays while on screen
 * (battery + the visitor's mobile data), with prefers-reduced-motion
 * dropping to the static poster frame — no <video> element mounted at all,
 * so there is truly no motion, not just a paused one.
 */
export function HaulOnScroll() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Autoplay can still be refused in edge cases even when muted;
          // the poster frame is a perfectly fine fallback, so swallow it.
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return (
    <section
      ref={wrapRef}
      className="mx-auto max-w-6xl px-4 py-16 lg:py-20"
      aria-label="Two-person crew tarping and loading leaves into a cream pickup"
    >
      <p className="kicker">The haul</p>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl">
        Two of us. One truck. Your whole yard.
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Rake it onto the tarp, drag it to the bed, load it — the pile you'd
        spend a Saturday on, gone in one trip.
      </p>

      <div className="relative mt-8 overflow-hidden rounded-2xl ring-1 ring-gold/20">
        {reducedMotion ? (
          <img
            src="/haul-crew-poster.jpg"
            alt="Two people dragging a tarp of leaves toward a cream pickup"
            width={1280}
            height={720}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            src="/haul-crew.mp4"
            poster="/haul-crew-poster.jpg"
            width={1280}
            height={720}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
        )}
      </div>
    </section>
  );
}
