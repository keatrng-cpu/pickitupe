import { useEffect, useRef, useState } from "react";

/**
 * The haul scene.
 *
 * Was an illustrated truck+chair rig driven by scroll position (see git
 * history — src/components/haul-on-scroll.tsx before this commit). Replaced
 * at the owner's request with a Grok Imagine video, on-brand (cream truck,
 * mahogany-ish palette) even though the rendering technique differs from the
 * engraved door-hanger line art.
 *
 * On its second cut: the first video (git history, public/haul-crew.mp4)
 * only showed leaf loading — a second, unrelated vignette in that same clip
 * got cut mid-load (see that commit), which meant junk removal had no video
 * representation at all. This one (public/haul-junk.mp4) is a single
 * continuous scene that loads both a leaf-filled tarp AND a junk pile —
 * chair, drum, rake — into the same truck, so one clip now covers both
 * services instead of needing two. Source was 10.04s; sped 1.5x to 6.67s
 * rather than trimmed, because unlike the leaf clip this one's ending (truck
 * loaded, drives off, lawn clear) is the whole point and cutting it away
 * would reproduce the exact bug that killed the first video.
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
      aria-label="Two-person crew loading a leaf-filled tarp and a junk pile into a cream pickup, then driving off"
    >
      <p className="kicker">The haul</p>
      <h2 className="mt-2 font-display text-3xl sm:text-4xl">
        Two of us. One truck. Your whole yard.
      </h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Leaves, the chair you meant to donate, whatever's been sitting in the
        garage — same trip, same truck, gone.
      </p>

      <div className="relative mt-8 overflow-hidden rounded-2xl ring-1 ring-gold/20">
        {reducedMotion ? (
          <img
            src="/haul-junk-poster.jpg"
            alt="Two people loading a leaf-filled tarp and a junk pile into a cream pickup"
            width={1280}
            height={720}
            className="aspect-video w-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            src="/haul-junk.mp4"
            poster="/haul-junk-poster.jpg"
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
