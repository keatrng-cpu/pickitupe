import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { isPromoActive, PROMO_DEADLINE_LABEL } from "@/lib/pricebook";

const ROWS = [
  { item: "Chair, nightstand, microwave", local: "$79", ours: "$69", promo: "$55" },
  { item: "Dresser, table, bed frame", local: "$79", ours: "$75", promo: "$60" },
  { item: "Couch or mattress", local: "$99", ours: "$89", promo: "$71" },
  { item: "Washer, dryer, or stove", local: "$109", ours: "$99", promo: "$79" },
  { item: "Refrigerator", local: "$109 apps / $48 city curb", ours: "$99", promo: "$79" },
];

export function RateReel() {
  const promo = isPromoActive();
  return (
    <section id="rates" className="section-y">
      <div className="mx-auto max-w-6xl px-4">
        <p className="kicker">Single-item pickups</p>
        <h2 className="mt-3 max-w-xl font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
          Priced under the apps.
        </h2>
      </div>
      <div className="reel mt-8 gap-4 px-4">
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
          to="/book"
          search={{ service: "junk-removal", size: "sofa" }}
          className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
        >
          Book a pickup
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}
