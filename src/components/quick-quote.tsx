import { ArrowRight, Droplets, Leaf, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AddOnPicker } from "@/components/add-on-picker";
import { SameStop } from "@/components/same-stop";
import { LoadSlider } from "@/components/winter/load-slider";
import {
  canonicalService,
  DEPOSIT,
  estimate,
  featuredSizesFor,
  formatRange,
  isPromoActive,
  listedSizesFor,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";

const JOBS: {
  value: Exclude<ServiceKey, "other" | "furniture-appliances">;
  label: string;
  icon: ReactNode;
}[] = [
  // Winter order: junk first, leaves last (spring).
  { value: "junk-removal", label: "Junk", icon: <Trash2 className="size-6" /> },
  { value: "gutter-cleaning", label: "Gutters", icon: <Droplets className="size-6" /> },
  { value: "leaf-cleanup", label: "Leaves", icon: <Leaf className="size-6" /> },
];

export function QuickQuote() {
  const [service, setService] = useState<ServiceKey>("junk-removal");
  const [size, setSize] = useState("single");
  const [allSizes, setAllSizes] = useState(false);
  const [addOns, setAddOns] = useState<AddOnKey[]>([]);
  const junk = service === "junk-removal";
  const sizes = allSizes && !junk ? listedSizesFor(service) : featuredSizesFor(service);
  const current = sizes.some((s) => s.value === size) ? size : (sizes[0]?.value ?? "");

  // Same inputs the booking page and the server price with, so the number
  // here is the number on /call and on the deposit.
  const result = useMemo(
    () => estimate({ service, size: current, addOns, earlyBird: isPromoActive() }),
    [service, current, addOns],
  );

  function pick(next: ServiceKey) {
    const s = canonicalService(next);
    setService(s);
    setAllSizes(false);
    setSize(featuredSizesFor(s)[0]?.value ?? "");
    setAddOns([]);
  }

  const currentHint = sizes.find((s) => s.value === current)?.hint;
  const sizeHeading = service === "leaf-cleanup" ? "Yard size" : "What kind of home?";
  const extras = result.lines.slice(1);

  return (
    <section id="haul" className="section-y mx-auto max-w-6xl px-4">
      <p className="kicker">Slide. Price. Book.</p>
      <h2 className="mt-3 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
        What are we taking?
      </h2>

      <div className="mt-8 grid grid-cols-3 gap-3" role="radiogroup" aria-label="Service">
        {JOBS.map((job) => {
          const on = service === job.value;
          return (
            <button
              key={job.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => pick(job.value)}
              className={`btn-press flex min-h-24 flex-col items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-[transform,background-color,box-shadow] duration-200 ${
                on ? "bg-fg text-ink ring-gold" : "card-green text-fg ring-transparent"
              }`}
            >
              <span className={on ? "text-ink" : "text-gold"}>{job.icon}</span>
              <span className="font-display text-xl leading-none">{job.label}</span>
            </button>
          );
        })}
      </div>

      <Link
        to="/estate-cleanout-grand-forks"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg/85 underline-offset-4 hover:text-gold hover:underline"
      >
        Whole house or an estate? Free walkthrough
        <ArrowRight className="size-3.5" />
      </Link>

      <div className={`mt-8 grid items-start gap-6 ${junk ? "lg:grid-cols-[1.15fr_1fr] lg:gap-8" : ""}`}>
        <div>
          {junk ? (
            <>
              <LoadSlider sizes={sizes} value={current} onChange={setSize} />
              <AddOnPicker service={service} value={addOns} onChange={setAddOns} />
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-widest text-gold">{sizeHeading}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const on = current === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setSize(s.value)}
                      className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm ${
                        on ? "bg-gold text-ink" : "border border-border text-fg hover:bg-fg/8"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              {listedSizesFor(service).length > featuredSizesFor(service).length ? (
                <button
                  type="button"
                  onClick={() => setAllSizes((v) => !v)}
                  className="mt-3 text-xs text-muted underline-offset-4 hover:text-gold hover:underline"
                >
                  {allSizes ? "Fewer sizes" : "More sizes"}
                </button>
              ) : null}
              {currentHint ? <p className="mt-3 text-sm text-muted">{currentHint}</p> : null}
              {service === "leaf-cleanup" ? (
                <SameStop addOns={addOns} onChange={(next) => setAddOns(next as AddOnKey[])} />
              ) : null}
            </>
          )}
        </div>

        <div className="card-estimate relative overflow-hidden rounded-2xl p-6">
          <p className="kicker">Your range</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <p
              key={result.range ? formatRange(result.range) : "none"}
              className="price-pop font-display text-5xl leading-none text-print tabular-nums"
              aria-live="polite"
            >
              {result.range ? formatRange(result.range) : "We'll quote it"}
            </p>
            {result.beforeDiscount && result.discount > 0 ? (
              <p className="text-sm text-print/40 line-through">{formatRange(result.beforeDiscount)}</p>
            ) : null}
          </div>
          {extras.length ? (
            <ul className="mt-4 space-y-1 border-t border-print/15 pt-3 text-sm text-print/80">
              {result.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-3">
                  <span>{l.label}</span>
                  <span className="tabular-nums">{formatRange(l.range)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-4 text-sm text-print/75">Confirmed when we see it. ${DEPOSIT} on a card holds the day and comes off the bill.</p>
          <Link
            to="/call"
            search={{
              service,
              size: current,
              ...(addOns.length ? { addons: addOns.join(",") } : {}),
            }}
            className="btn-press mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mahogany text-sm font-medium text-paper hover:bg-mahogany-deep sm:w-auto sm:px-8"
          >
            Lock this
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
