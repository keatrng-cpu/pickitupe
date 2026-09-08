import { clampLotSqFt, SQFT_PER_ACRE } from "@/lib/pricebook";

const PRESETS = [
  { label: "¼ acre", sqFt: 10_890 },
  { label: "½ acre", sqFt: 21_780 },
  { label: "1 acre", sqFt: 43_560 },
  { label: "2 acres", sqFt: 87_120 },
];

type Props = {
  value: number;
  onChange: (sqFt: number) => void;
};

export function LotSizeField({ value, onChange }: Props) {
  return (
    <div className="mt-6">
      <p className="text-xs font-medium text-muted">Lot size — tighter number</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="number"
            min={1500}
            max={350000}
            step={100}
            inputMode="numeric"
            placeholder="sq ft"
            value={value || ""}
            onChange={(e) => onChange(clampLotSqFt(e.target.value) || 0)}
            className="field h-11 w-36 tabular-nums"
          />
          <span className="text-muted">sq ft</span>
        </label>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            aria-pressed={value === p.sqFt}
            onClick={() => onChange(p.sqFt)}
            className={`btn-press inline-flex h-11 items-center rounded-full px-4 text-sm ${
              value === p.sqFt ? "bg-gold text-ink" : "border border-border text-fg hover:bg-fg/8"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        {value
          ? `${value.toLocaleString("en-US")} sq ft · ${(value / SQFT_PER_ACRE).toFixed(2)} acre · $32–$46 / 1,000 on the first 8,000 sq ft, then less per foot as it grows. Haul included.`
          : "$32–$46 per 1,000 sq ft on a city lot. $14–$22 per 1,000 on an acre. Haul included."}
      </p>
    </div>
  );
}
