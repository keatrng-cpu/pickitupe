import {
  bundleAddOns,
  formatRange,
  toggleBundleAddOn,
} from "@/lib/pricebook";

type Props = {
  addOns: string[];
  onChange: (next: string[]) => void;
};

export function SameStop({ addOns, onChange }: Props) {
  const chips = bundleAddOns();

  return (
    <fieldset className="mt-4">
      <legend className="text-xs font-medium text-muted">While we're here</legend>
      <p className="mt-2 text-sm text-muted">
        Gutters while we're there? Rake first, then we climb. Trip already paid —
        not a second roll, not another percent off.
      </p>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Same-stop add-ons">
        {chips.map((a) => {
          const on = addOns.includes(a.key);
          return (
            <button
              key={a.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(toggleBundleAddOn(addOns, a.key))}
              className={`btn-press inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm ${
                on ? "bg-gold text-ink" : "border border-border text-fg hover:bg-fg/8"
              }`}
            >
              <span>{a.label}</span>
              <span className={on ? "text-ink/70" : "text-muted"}>{formatRange(a.range)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
