import { ArrowRight, Droplets, Leaf, Trash2 } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  canonicalService,
  estimate,
  formatRange,
  isPromoActive,
  sizeOptionsFor,
  type ServiceKey,
} from "@/lib/pricebook";

const JOBS: {
  value: Exclude<ServiceKey, "other" | "furniture-appliances">;
  label: string;
  icon: ReactNode;
}[] = [
  { value: "leaf-cleanup", label: "Leaves", icon: <Leaf className="size-6" /> },
  { value: "junk-removal", label: "Junk", icon: <Trash2 className="size-6" /> },
  { value: "gutter-cleaning", label: "Gutters", icon: <Droplets className="size-6" /> },
];

export function QuickQuote() {
  const [service, setService] = useState<ServiceKey>("leaf-cleanup");
  const [size, setSize] = useState("medium");
  const sizes = sizeOptionsFor(service);

  const result = useMemo(
    () =>
      estimate({
        service,
        size: sizes.some((s) => s.value === size) ? size : sizes[0]?.value ?? "",
        addOns: [],
        earlyBird: isPromoActive(),
      }),
    [service, size, sizes],
  );

  function pick(next: ServiceKey) {
    const s = canonicalService(next);
    setService(s);
    setSize(sizeOptionsFor(s)[0]?.value ?? "");
  }

  const current = sizes.some((s) => s.value === size)
    ? size
    : (sizes[0]?.value ?? "");
  const currentHint = sizes.find((s) => s.value === current)?.hint;
  const sizeHeading =
    service === "leaf-cleanup"
      ? "Yard size"
      : service === "gutter-cleaning"
        ? "What kind of home?"
        : "How much is there?";

  return (
    <section id="haul" className="section-y mx-auto max-w-6xl px-4">
      <p className="kicker">Tap. Price. Book.</p>
      <h2 className="mt-3 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
        What are we taking?
      </h2>

      <div
        className="mt-8 grid grid-cols-3 gap-3"
        role="listbox"
        aria-label="Service"
      >
        {JOBS.map((job) => {
          const on = service === job.value;
          return (
            <button
              key={job.value}
              type="button"
              role="option"
              aria-selected={on}
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

      <p className="mt-8 text-xs font-medium uppercase tracking-widest text-gold">
        {sizeHeading}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {sizes.map((s) => {
          const on = current === s.value;
          return (
            <button
              key={s.value}
              type="button"
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
      {currentHint ? <p className="mt-3 text-sm text-muted">{currentHint}</p> : null}

      <div className="card-estimate relative mt-8 overflow-hidden rounded-2xl p-6">
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
            <p className="text-sm text-print/40 line-through">
              {formatRange(result.beforeDiscount)}
            </p>
          ) : null}
        </div>
        <Link
          to="/book"
          search={{ service, size: current }}
          className="btn-press mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-mahogany text-sm font-medium text-paper hover:bg-mahogany-deep sm:w-auto sm:px-8"
        >
          Lock this rate
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
