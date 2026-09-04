import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
  overlay?: boolean;
};

export function HaulVideo({ className, overlay = true }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={wrapRef} className={`overflow-hidden bg-bg-deep ${className ?? "relative"}`}>
      {reduced ? (
        <img
          src="/haul-junk-poster.jpg"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          src="/haul-junk.mp4"
          poster="/haul-junk-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      {overlay ? <div className="hero-scrim" /> : null}
    </div>
  );
}
