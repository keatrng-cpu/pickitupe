import { Check, Plus } from "lucide-react";
import { addOnsFor, formatRange, isBundleAddOn, type AddOnKey, type ServiceKey } from "@/lib/pricebook";

/**
 * The extras that change a junk price — stairs, a fridge or freezer, a
 * garage/basement cleanout — straight from ADD_ONS in the pricebook. Picking
 * one here carries it to /call and into the server's estimate, so the quote
 * matches the job instead of being corrected at the truck. Bundle add-ons
 * (leaf same-stop extras) have their own picker and are left out.
 */
export function AddOnPicker({
  service,
  value,
  onChange,
  heading = "Anything that makes it harder?",
}: {
  service: ServiceKey;
  value: AddOnKey[];
  onChange: (next: AddOnKey[]) => void;
  heading?: string;
}) {
  const options = addOnsFor(service).filter((a) => !isBundleAddOn(a.key));
  if (!options.length) return null;
  return (
    <fieldset className="mt-6">
      <legend className="text-xs font-medium uppercase tracking-widest text-gold">{heading}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((a) => {
          const on = value.includes(a.key);
          return (
            <button
              key={a.key}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? value.filter((k) => k !== a.key) : [...value, a.key])}
              className={`btn-press flex min-h-14 items-start gap-2 rounded-xl px-3 py-2.5 text-left text-sm ring-1 transition-colors ${
                on ? "bg-fg text-ink ring-gold" : "card-green text-fg ring-transparent hover:ring-border"
              }`}
            >
              <span
                className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${on ? "bg-mahogany text-paper" : "border border-border text-gold"}`}
                aria-hidden="true"
              >
                {on ? <Check className="size-3" /> : <Plus className="size-3" />}
              </span>
              <span>
                <span className="block font-medium leading-tight">{a.label}</span>
                <span className={`block text-xs tabular-nums ${on ? "text-ink/70" : "text-muted"}`}>+{formatRange(a.range)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
