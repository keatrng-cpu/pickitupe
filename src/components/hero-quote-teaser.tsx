import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  estimate as computeEstimate,
  formatRange,
  sizeOptionsFor,
  type ServiceKey,
} from "@/lib/pricebook";
import type { PromoStatus } from "@/components/quote-form";

const SERVICES = [
  { value: "leaf-cleanup", label: "Fall leaf cleanup" },
  { value: "junk-removal", label: "Junk removal" },
  { value: "garage-basement", label: "Garage / basement" },
  { value: "furniture-appliances", label: "Furniture & appliances" },
  { value: "single-item", label: "Single-item pickup" },
  { value: "other", label: "Something else" },
] as const;

/**
 * The hero used to show a picture of a printed door hanger. This is what
 * replaced it: the actual thing that gets someone to book — a real number,
 * in two taps, computed from the same pricebook the full form uses.
 *
 * Deliberately NOT a booking form. No name/phone/address here — that would
 * turn the first thing a visitor sees into a wall of fields. This answers
 * "what would this cost me" and hands off to the real form at #book for
 * add-ons, notes, and the deposit.
 */
export function HeroQuoteTeaser({ promo }: { promo: PromoStatus }) {
  const [service, setService] = useState<ServiceKey>("leaf-cleanup");
  const [size, setSize] = useState<string>("medium");

  const sizes = useMemo(() => sizeOptionsFor(service), [service]);
  const activeSize = sizes.some((s) => s.value === size) ? size : sizes[0].value;

  const quote = useMemo(
    () =>
      computeEstimate({
        service,
        size: activeSize,
        addOns: [],
        earlyBird: promo.active,
        notes: "",
      }),
    [service, activeSize, promo.active],
  );

  const field =
    "mt-1 w-full rounded-xl border border-mahogany/25 bg-paper px-3 py-2 text-sm text-print outline-none focus:border-mahogany/50";

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
        </>
      ) : (
        <p className="text-sm">
          Tell us what it is — we'll text back a number the same day.
        </p>
      )}

      <a
        href="#book"
        className="btn-press mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-mahogany px-5 py-3 text-sm font-medium text-paper hover:bg-mahogany-deep"
      >
        {quote.range ? "Lock this rate & book" : "Get my number"}
        <ArrowRight className="size-4" />
      </a>
      <p className="mt-3 text-center text-xs text-print/55">
        No card, no call required — the full form is right below.
      </p>
    </div>
  );
}
