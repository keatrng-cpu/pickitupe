import type { CSSProperties } from "react";
import { BedLoad } from "@/components/winter/bed-load";
import { canonicalSize, type SizeOption } from "@/lib/pricebook";

/**
 * Junk size picker: drag from "Bags" to "Two trips" and the pickup fills.
 * A native <input type="range"> underneath — arrow keys, Home/End, screen
 * readers (aria-valuetext reads the size and the pricebook hint) and touch all
 * work without custom handlers. The tick labels are buttons too, for anyone
 * who would rather tap than drag. Sizes come from the pricebook in order; the
 * price lives next to it, rendered by the caller from `estimate()`.
 */
export function LoadSlider({
  sizes,
  value,
  onChange,
  id = "load-range",
}: {
  sizes: SizeOption[];
  value: string;
  onChange: (next: string) => void;
  id?: string;
}) {
  const found = sizes.findIndex((s) => s.value === value);
  const idx = found < 0 ? 0 : found;
  const cur = sizes[idx];
  const last = Math.max(1, sizes.length - 1);
  if (!cur) return null;
  return (
    <div className="load-slider">
      <div className="card-green load-card rounded-2xl px-3 pb-3 pt-4 sm:px-6">
        <BedLoad size={canonicalSize("junk-removal", cur.value)} className="mx-auto max-w-md" />
      </div>

      <label htmlFor={id} className="mt-5 flex items-baseline justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-widest text-gold">How much is there?</span>
        <span className="font-display text-xl leading-none text-fg" aria-hidden="true">
          {cur.label}
        </span>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={last}
        step={1}
        value={idx}
        onChange={(e) => {
          const next = sizes[Number(e.target.value)];
          if (next) onChange(next.value);
        }}
        aria-valuetext={`${cur.label}. ${cur.hint}`}
        className="load-range mt-3"
        style={{ "--p": idx / last } as CSSProperties}
      />
      <ol
        className="load-ticks mt-2 grid"
        style={{ gridTemplateColumns: `repeat(${sizes.length}, minmax(0, 1fr))` }}
        aria-label="Sizes"
      >
        {sizes.map((s, i) => (
          <li key={s.value} className="flex justify-center">
            <button
              type="button"
              aria-pressed={i === idx}
              onClick={() => onChange(s.value)}
              className="load-tick btn-press min-h-11 rounded-lg px-1 text-center text-[0.72rem] leading-tight sm:text-xs"
            >
              {s.label}
            </button>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-muted">{cur.hint}</p>
    </div>
  );
}
