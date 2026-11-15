import { useEffect, useRef, useState } from "react";

/**
 * Drag to wipe from a packed garage to an empty one.
 *
 * A native <input type="range"> drives a clip-path, so it works with keyboard,
 * touch and screen readers with no extra code. On first view it does one small
 * "peek" so people see it moves (skipped under reduced motion).
 *
 * Swap slot: pass `before` / `after` image URLs (real job photos from the crew
 * portal, or the Higgsfield before/after renders) to replace the illustration.
 * Until then it's an illustration and says so.
 */
type Img = { src: string; alt: string };

export function BeforeAfter({
  before,
  after,
  caption = "Illustration. Real job photos go here as they come in.",
  className,
}: {
  before?: Img;
  after?: Img;
  caption?: string;
  className?: string;
}) {
  const [pos, setPos] = useState(55);
  const wrapRef = useRef<HTMLDivElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        const t0 = performance.now();
        const tick = (now: number) => {
          if (touched.current) return;
          const t = (now - t0) / 1400;
          if (t >= 1) {
            setPos(55);
            return;
          }
          setPos(55 + Math.sin(t * Math.PI * 2) * 18 * (1 - t));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <figure className={className}>
      <div ref={wrapRef} className="ba-frame card-green relative overflow-hidden rounded-2xl" style={{ aspectRatio: "16 / 9" }}>
        <div className="absolute inset-0">
          {after ? <img src={after.src} alt={after.alt} loading="lazy" className="size-full object-cover" /> : <GarageArt full={false} />}
        </div>
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
          {before ? <img src={before.src} alt={before.alt} loading="lazy" className="size-full object-cover" /> : <GarageArt full />}
        </div>
        <span className="ba-tag left-3">Before</span>
        <span className="ba-tag right-3">After</span>
        <div className="ba-handle" style={{ left: `${pos}%` }} aria-hidden="true">
          <span />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(pos)}
          onChange={(e) => {
            touched.current = true;
            setPos(Number(e.target.value));
          }}
          aria-label="Before and after: slide to compare the garage full and empty"
          className="ba-range"
        />
      </div>
      {caption ? <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

/** The illustrated garage. `full` = the before shot. */
function GarageArt({ full }: { full: boolean }) {
  return (
    <svg viewBox="0 0 800 450" className="size-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id={`ba-wall-${full}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24382c" />
          <stop offset="1" stopColor="#1a2a21" />
        </linearGradient>
        <linearGradient id={`ba-floor-${full}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6f6b62" />
          <stop offset="1" stopColor="#4c4943" />
        </linearGradient>
        <linearGradient id={`ba-door-${full}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9dcd3" />
          <stop offset="1" stopColor="#f4f6f2" />
        </linearGradient>
      </defs>
      <rect width="800" height="450" fill={`url(#ba-wall-${full})`} />
      {/* open garage door to a snowy driveway */}
      <rect x="250" y="70" width="300" height="250" fill={`url(#ba-door-${full})`} />
      <path d="M250 300 q75 -20 150 -6 q80 14 150 -4 v30 h-300z" fill="#ffffff" />
      <rect x="280" y="190" width="40" height="60" fill="#0b5a32" opacity="0.5" />
      <path d="M300 150 l-26 60 h52z" fill="#0b5a32" opacity="0.55" />
      <rect x="244" y="64" width="312" height="10" fill="#3b2a20" />
      <rect x="244" y="64" width="8" height="256" fill="#3b2a20" />
      <rect x="548" y="64" width="8" height="256" fill="#3b2a20" />
      {/* floor */}
      <path d="M0 320 H800 V450 H0z" fill={`url(#ba-floor-${full})`} />
      <path d="M250 320 L120 450 M550 320 L680 450" stroke="#5c5850" strokeWidth="2" />
      {/* pegboard + shelf */}
      <rect x="40" y="90" width="170" height="110" rx="4" fill="#8a6a45" />
      <rect x="40" y="210" width="170" height="8" fill="#5a2a1c" />
      <rect x="600" y="210" width="170" height="8" fill="#5a2a1c" />
      {full ? (
        <g>
          {/* stacked boxes left */}
          <rect x="30" y="250" width="90" height="72" rx="3" fill="#b98a55" />
          <rect x="40" y="190" width="72" height="60" rx="3" fill="#9b7140" />
          <rect x="125" y="268" width="70" height="54" rx="3" fill="#a77b48" />
          <rect x="52" y="150" width="50" height="40" rx="3" fill="#b98a55" />
          {/* shelf clutter */}
          <rect x="610" y="170" width="40" height="40" rx="2" fill="#b98a55" />
          <rect x="655" y="180" width="30" height="30" rx="2" fill="#7a3a26" />
          <rect x="690" y="160" width="60" height="50" rx="2" fill="#9b7140" />
          {/* old fridge */}
          <rect x="640" y="210" width="80" height="112" rx="6" fill="#f1ece0" stroke="#d9c79f" strokeWidth="3" />
          <rect x="640" y="250" width="80" height="3" fill="#d9c79f" />
          <rect x="708" y="222" width="5" height="20" rx="2" fill="#b9b3a6" />
          {/* couch in front of the door */}
          <path d="M270 320 v-40 q0-12 12-12 h150 q12 0 12 12 v40z" fill="#7a3a26" />
          <rect x="260" y="290" width="200" height="32" rx="10" fill="#8d4a31" />
          {/* mattress leaning */}
          <rect x="480" y="190" width="60" height="135" rx="10" fill="#e9dcc4" transform="rotate(10 510 257)" />
          <path d="M490 200 v120 M505 200 v120 M520 200 v120" stroke="#cdbf9f" strokeWidth="3" transform="rotate(10 510 257)" />
          {/* bike + tires */}
          <circle cx="170" cy="380" r="34" fill="none" stroke="#1b1612" strokeWidth="8" />
          <circle cx="250" cy="390" r="28" fill="none" stroke="#1b1612" strokeWidth="10" />
          <path d="M170 380 l40 -40 h40 l-20 40" stroke="#a5281b" strokeWidth="6" fill="none" />
          {/* bags */}
          <ellipse cx="560" cy="400" rx="46" ry="34" fill="#1b1612" />
          <ellipse cx="620" cy="408" rx="38" ry="28" fill="#2a201a" />
          <ellipse cx="360" cy="410" rx="44" ry="26" fill="#2a201a" />
          {/* lamp */}
          <path d="M720 330 l20 -110" stroke="#d7d2c6" strokeWidth="4" />
          <path d="M724 220 h34 l-8 -26 h-18z" fill="#e9d9b5" />
          {/* paint cans stay (no-haul list) */}
          <rect x="700" y="380" width="26" height="30" rx="3" fill="#6b7d8a" />
        </g>
      ) : (
        <g>
          {/* broom swept, one bin of keepers, paint cans set aside for the family */}
          <path d="M600 420 l70 -150" stroke="#8a6a45" strokeWidth="6" />
          <path d="M582 420 h44 l-10 24 h-24z" fill="#c9a24a" />
          <rect x="60" y="270" width="80" height="52" rx="4" fill="#0b5a32" />
          <rect x="60" y="270" width="80" height="10" rx="3" fill="#064e2a" />
          <text x="100" y="304" textAnchor="middle" fontFamily="Outfit, system-ui, sans-serif" fontSize="14" fill="#ede3d0">
            KEEP
          </text>
          <rect x="700" y="380" width="26" height="30" rx="3" fill="#6b7d8a" />
          <path d="M330 430 q60 -8 120 0" stroke="#7d7970" strokeWidth="2" fill="none" />
        </g>
      )}
    </svg>
  );
}
