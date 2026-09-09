import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
  DEPOSIT,
  estimate,
  formatRange,
  HOUSE_PACKS,
  isPromoActive,
} from "@/lib/pricebook";

export function HousePacks() {
  const earlyBird = isPromoActive();

  return (
    <section id="packs" className="section-y mx-auto max-w-6xl px-4">
      <p className="kicker">One stop</p>
      <h2 className="mt-3 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
        Yard. Yard + gutters. The couch too.
      </h2>
      <p className="mt-4 max-w-xl text-sm text-muted">
        Same truck, trip already paid. We rake first, then we climb. Deposit stays $
        {DEPOSIT}. Not a second roll. Not another percent off.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {HOUSE_PACKS.map((pack) => {
          const priced = estimate({
            service: pack.service,
            size: pack.size,
            addOns: pack.addOns,
            earlyBird,
          });
          return (
            <article
              key={pack.value}
              className="card-green flex flex-col rounded-2xl p-6"
            >
              <p className="kicker">{pack.kicker}</p>
              <h3 className="mt-2 font-display text-2xl">{pack.label}</h3>
              <p className="mt-3 flex-1 text-sm text-muted">{pack.hint}</p>
              {priced.range ? (
                <div className="mt-6 flex flex-wrap items-end gap-3">
                  <p className="font-display text-4xl leading-none text-gold tabular-nums">
                    {formatRange(priced.range)}
                  </p>
                  {priced.beforeDiscount && priced.discount > 0 ? (
                    <p className="text-sm text-muted line-through tabular-nums">
                      {formatRange(priced.beforeDiscount)}
                    </p>
                  ) : null}
                </div>
              ) : null}
              <Link
                to="/call"
                search={{
                  service: pack.service,
                  size: pack.size,
                  addons: pack.addOns.join(","),
                  house: pack.value,
                }}
                className="btn-press mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink hover:bg-gold"
              >
                Pay ${DEPOSIT} to lock
                <ArrowRight className="size-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
