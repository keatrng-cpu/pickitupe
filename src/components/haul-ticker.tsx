import {
  BedDouble,
  CloudRain,
  CookingPot,
  Leaf,
  Package,
  Pause,
  Play,
  Refrigerator,
  ShoppingBag,
  Sofa,
  Truck,
  Warehouse,
  WashingMachine,
  Wind,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const ITEMS = [
  { icon: Leaf, label: "Leaves" },
  { icon: Wind, label: "Yard" },
  { icon: CloudRain, label: "Gutters" },
  { icon: Package, label: "Junk" },
  { icon: Sofa, label: "Furniture" },
  { icon: BedDouble, label: "Mattress" },
  { icon: Refrigerator, label: "Fridge" },
  { icon: WashingMachine, label: "Washer" },
  { icon: CookingPot, label: "Stove" },
  { icon: ShoppingBag, label: "Bags" },
  { icon: Warehouse, label: "Garage" },
  { icon: Truck, label: "Hauled" },
] as const;

export function HaulTicker() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [offscreen, setOffscreen] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setOffscreen(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const copies = reduced ? ITEMS : [...ITEMS, ...ITEMS];
  const frozen = paused || offscreen || reduced;

  return (
    <div ref={rootRef} className="ticker" role="region" aria-label="What we haul">
      <p className="sr-only">
        We haul {ITEMS.map((i) => i.label.toLowerCase()).join(", ")}.
      </p>
      <div className="ticker-clip">
        <div className={`ticker-track${frozen ? " is-paused" : ""}`} aria-hidden="true">
          {copies.map((item, i) => (
            <span key={`${item.label}-${i}`} className="ticker-item">
              <item.icon className="size-4 text-gold sm:size-5" strokeWidth={1.75} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
      {reduced ? null : (
        <button
          type="button"
          className="ticker-pause"
          aria-pressed={paused}
          aria-label={paused ? "Play the haul list" : "Pause the haul list"}
          onClick={() => setPaused((v) => !v)}
        >
          {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
