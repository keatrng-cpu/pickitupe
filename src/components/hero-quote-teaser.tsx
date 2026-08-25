import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  addOnsFor,
  estimate as computeEstimate,
  formatRange,
  sizeOptionsFor,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";
import type { PromoStatus } from "@/components/quote-form";

const SERVICES = [
  { value: "leaf-cleanup", label: "Fall leaf cleanup" },
  { value: "junk-removal", label: "Junk removal" },
  { value: "furniture-appliances", label: "Furniture & appliances" },
  { value: "single-item", label: "Single-item pickup" },
  { value: "other", label: "Something else" },
] as const;

/**
 * The hero used to show a picture of a printed door hanger. This is what
 * replaced it: the actual thing that gets someone to book — a real number,
 * computed from the same pricebook the booking form uses.
 *
 * It now carries every input that actually moves the price (service, size,
 * add-ons) plus the line-by-line breakdown, because the home page no longer
 * repeats the full booking form below it — that was this same estimate
 * widget a second time, wrapped in twelve contact fields (owner: "this is
 * too long and basically a duplicate from the one up top").
 *
 * What it still does NOT collect is name / phone / address. Those belong on
 * /book, and the selection made here rides along in the URL so nobody has to
 * pick their service and yard size twice.
 */
export function HeroQuoteTeaser({ promo }: { promo: PromoStatus }) {
  const [service, setService] = useState<ServiceKey>("leaf-cleanup");
  const [size, setSize] = useState<string>("medium");
  const [addOns, setAddOns] = useState<AddOnKey[]>([]);

  const sizes = useMemo(() => sizeOptionsFor(service), [service]);
  const availableAddOns = useMemo(() => addOnsFor(service), [service]);

  // Keep size and add-ons valid whenever the service changes.
  const activeSize = sizes.some((s) => s.value === size) ? size : sizes[0].value;
  const activeAddOns = addOns.filter((k) =>
    availableAddOns.some((a) => a.key === k),
  );

  const quote = useMemo(
    () =>
      computeEstimate({
        service,
        size: activeSize,
        addOns: activeAddOns,
        earlyBird: promo.active,
        notes: "",
      }),
    [service, activeSize, activeAddOns, promo.active],
  );

  const field =
    "mt-1 w-full rounded-xl border border-mahogany/25 bg-paper px-3 py-2.5 text-sm text-print outline-none focus:border-mahogany/50";

  return (
    <div className="card-estimate rounded-2xl p-5 sm:p-6">
      <p className="kicker">Free estimate</p>
      <h2 className="mt-1 font-display text-2xl leading-tight">
        What would this cost?
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-print/70">
          Service
          <select
            className={field}
            value={service}
            onChange={(e) => setService(e.target.value as ServiceKey)}
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {service !== "other" ? (
          <label className="block text-xs font-medium text-print/70">
            {service === "leaf-cleanup" ? "Yard size" : "How much"}
            <select
              className={field}
              value={activeSize}
              onChange={(e) => setSize(e.target.value)}
            >
              {sizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {service !== "other" && availableAddOns.length > 0 ? (
        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-print/70">
            Anything else?
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableAddOns.map((a) => {
              const on = activeAddOns.includes(a.key);
              return (
                <label
                  key={a.key}
                  title={a.hint}
                  className={`btn-press inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-xs transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-mahogany ${
                    on
                      ? "border-mahogany bg-mahogany/12 font-medium text-print"
                      : "border-mahogany/25 text-print/70 hover:border-mahogany/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() =>
                      setAddOns((prev) =>
                        prev.includes(a.key)
                          ? prev.filter((k) => k !== a.key)
                          : [...prev, a.key],
                      )
                    }
                  />
                  {a.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="estimate-rule my-4" />

      {quote.range ? (
        <>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-5xl font-bold leading-none tracking-tight">
              {formatRange(quote.range)}
            </span>
            {quote.discount > 0 && quote.beforeDiscount ? (
              <span className="text-base text-print/65 line-through">
                {formatRange(quote.beforeDiscount)}
              </span>
            ) : null}
          </p>
          {quote.discount > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mahogany px-3.5 py-1.5 text-sm font-semibold text-paper">
              You save up to ${quote.discount}
            </p>
          ) : null}

          <ul className="mt-4 space-y-1.5 text-xs text-print/80">
            {quote.lines.map((l) => (
              <li key={l.label} className="flex justify-between gap-4">
                <span>{l.label}</span>
                <span className="tabular-nums">{formatRange(l.range)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm">
          Tell us what it is — we'll text back a number the same day.
        </p>
      )}

      <Link
        to="/book"
        search={{
          service,
          size: activeSize,
          addons: activeAddOns.length > 0 ? activeAddOns : undefined,
        }}
        className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-mahogany px-5 py-3 text-sm font-medium text-paper hover:bg-mahogany-deep"
      >
        {quote.range ? "Lock this rate & book" : "Get my number"}
        <ArrowRight className="size-4" />
      </Link>

      <p className="mt-3 text-xs leading-[1.5] text-print/75">
        {quote.needsWalkthrough
          ? "Acreage gets a free walk-through first — this range is a starting point, not the quote. "
          : null}
        ${quote.deposit} deposit holds your date and comes off the invoice. If
        the pile is bigger than described, we stop and re-quote before we load.
      </p>
    </div>
  );
}
