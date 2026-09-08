import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isPromoActive, PROMO_DEADLINE_LABEL } from "@/lib/pricebook";

const ROWS = [
  { item: "One piece — couch, dresser, mattress", local: "$79–$99", ours: "$59–$95", promo: "$55–$76" },
  { item: "A few pieces — fridge or washer", local: "$109 apps / $48 city curb", ours: "$85–$130", promo: "$68–$104" },
  { item: "Half the truck", local: "$211–$344", ours: "$125–$195", promo: "$100–$156" },
];

export function RateReel() {
  const promo = isPromoActive();
  return (
    <section id="rates" className="section-y">
      <div className="mx-auto max-w-6xl px-4">
        <p className="kicker">Haul rates</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
          Priced under the apps.
        </h2>
      </div>
      <div
        className="reel mt-8 gap-4 px-4"
        role="region"
        aria-label="Haul rates"
        tabIndex={0}
      >
        {ROWS.map((row) => (
          <article key={row.item} className="reel-card card-paper rounded-2xl p-5">
            <h3 className="font-display text-2xl leading-tight text-print">{row.item}</h3>
            <p className="mt-4 text-xs uppercase tracking-widest text-mahogany/70">
              Typical local
            </p>
            <p className="text-print/55 line-through">{row.local}</p>
            <p className="mt-3 font-display text-4xl leading-none text-mahogany tabular-nums">
              {promo ? row.promo : row.ours}
            </p>
            <p className="mt-1 text-xs text-print/60">
              {promo ? `By ${PROMO_DEADLINE_LABEL}` : "List"}
            </p>
          </article>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-6xl px-4">
        <Link
          to="/call"
          search={{ service: "junk-removal", size: "single" }}
          className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
        >
          Book a pickup
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
