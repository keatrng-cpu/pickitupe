import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
  overlay?: boolean;
  src?: string;
  poster?: string;
  fillClass?: string;
};

export function HaulVideo({
  className,
  overlay = true,
  src = "/haul-junk.mp4",
  poster = "/haul-junk-poster.jpg",
  fillClass,
}: Props) {
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

  const fill = `hero-fill ${fillClass ?? ""}`;

  return (
    <div ref={wrapRef} className={`hero-media ${className ?? ""}`} aria-hidden="true">
      {reduced ? (
        <img src={poster} alt="" className={fill} />
      ) : (
        <video
          ref={videoRef}
          className={fill}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}
      <div className="hero-blend" />
      {overlay ? <div className="hero-scrim" /> : null}
    </div>
  );
}
