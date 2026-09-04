import { Armchair, Leaf, Refrigerator, Truck } from "lucide-react";

const ITEMS = [
  { icon: Leaf, label: "Leaves" },
  { icon: Armchair, label: "Couch" },
  { icon: Refrigerator, label: "Fridge" },
  { icon: Truck, label: "Hauled" },
];

export function HaulTicker() {
  const loop = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {loop.map((item, i) => (
          <span key={`${item.label}-${i}`} className="ticker-item">
            <item.icon className="size-5 text-gold" strokeWidth={1.75} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
