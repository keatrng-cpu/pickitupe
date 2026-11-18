import { useEffect, useState, type ReactNode } from "react";

function useReduced() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/** Snow puff beside the mark. The wordmark stays. GIF loads only on hover. */
export function MarkPuff({ children }: { children: ReactNode }) {
  const reduced = useReduced();
  const [hot, setHot] = useState(false);
  return (
    <span
      className="mark-slot"
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
    >
      {children}
      {hot ? (
        <img
          className="mark-puff"
          src={reduced ? "/anim/snowpuff-still.webp" : "/anim/snowpuff.gif"}
          alt=""
          width={288}
          height={288}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

/** Headlights on hover. Drive-off on click never delays the link. */
export function BookMicro({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReduced();
  const [hot, setHot] = useState(false);
  const [drive, setDrive] = useState(false);
  return (
    <span
      className={`book-micro${className ? ` ${className}` : ""}`}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      onClick={() => {
        if (!reduced) setDrive(true);
      }}
    >
      {hot ? (
        <img
          className="book-lights"
          src={reduced ? "/anim/headlights-still.webp" : "/anim/headlights.gif"}
          alt=""
          width={288}
          height={288}
          aria-hidden="true"
        />
      ) : null}
      {drive ? (
        <img className="book-drive" src="/anim/driveoff.gif" alt="" width={288} height={288} aria-hidden="true" />
      ) : null}
      {children}
    </span>
  );
}
