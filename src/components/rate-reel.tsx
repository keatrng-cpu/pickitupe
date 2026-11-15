import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { CSSProperties, PointerEvent } from "react";
import {
  addOnsFor,
  BED_CUBIC_YARDS,
  DEPOSIT,
  estimate,
  featuredSizesFor,
  formatRange,
  isBundleAddOn,
  isPromoActive,
  LOCAL_COMPARABLE,
} from "@/lib/pricebook";

/**
 * Haul rates as a printed receipt — the same mahogany-on-paper the job ticket
 * and the door hangers use, so the price list looks like something you could
 * hold. Every number comes from the pricebook (estimate() for the sizes,
 * ADD_ONS for the extras); scripts/price-literals.test.mjs fails the build if
 * a price is ever typed into this file.
 *
 * Honest comparison only: box-truck "half/full load" prices are a different
 * volume (a heaped pickup bed is BED_CUBIC_YARDS), so the only competitor line
 * is the single-item one, rendered only while we're actually under it.
 */

/** How much of the bed each size takes — the same fractions as the slider gauge. */
const FILL: Record<string, number> = { bags: 0.12, single: 0.12, quarter: 0.25, half: 0.5, full: 1, overflow: 1 };

function BedGauge({ fill, trips }: { fill: number; trips?: boolean }) {
  return (
    <svg viewBox="0 0 66 22" className="h-5 w-[3.75rem] shrink-0 text-mahogany" aria-hidden="true">
      <rect x="2" y="6" width="44" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x={2 + 44 - 44 * fill} y="6" width={44 * fill} height="11" rx="1.5" fill="currentColor" />
      <path d="M46 17 V8 q0-3 3-3 h6 q2 0 3 2 l3 6 v4 z" fill="currentColor" />
      <circle cx="12" cy="18.5" r="3" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="52" cy="18.5" r="3" fill="var(--color-paper)" stroke="currentColor" strokeWidth="1.4" />
      {trips ? (
        <text x="64" y="7" textAnchor="end" fontSize="8.5" fontWeight="700" fill="currentColor">
          ×2
        </text>
      ) : null}
    </svg>
  );
}

/** Pointer-follow glow: two custom properties, the glow is a pseudo-element (no layout). */
function spotlight(e: PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--x", `${e.clientX - r.left}px`);
  e.currentTarget.style.setProperty("--y", `${e.clientY - r.top}px`);
}

export function RateReel() {
  const promo = isPromoActive();
  const sizes = featuredSizesFor("junk-removal").map((s) => ({
    ...s,
    price: estimate({ service: "junk-removal", size: s.value, addOns: [], earlyBird: promo }).range ?? s.range,
  }));
  const extras = addOnsFor("junk-removal").filter((a) => !isBundleAddOn(a.key));
  const cheapest = Math.min(...sizes.map((s) => s.price.low));
  const under = cheapest < LOCAL_COMPARABLE.from;

  return (
    <section id="rates" className="section-y mx-auto max-w-6xl px-4" aria-labelledby="rates-title">
      <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5 lg:pt-6">
          <p className="kicker">Haul rates</p>
          <h2 id="rates-title" className="mt-3 font-display text-3xl leading-[0.98] sm:text-4xl lg:text-5xl">
            Priced by the truck bed.
          </h2>
          <p className="mt-5 max-w-md text-base leading-7 text-fg/90">
            Six sizes, one price list — the same one the slider, the booking page and the door hanger read. We confirm
            it when we see the pile, and {`$${DEPOSIT}`} on a card holds the day.
          </p>
          {under ? (
            <p className="mt-6 max-w-md border-l-2 border-gold pl-4 text-sm leading-6 text-fg/85">
              Small jobs are where a pickup wins: one piece starts at{" "}
              <span className="font-semibold text-fg tabular-nums">{`$${cheapest}`}</span>. {LOCAL_COMPARABLE.who}
              {"'"}s Grand Forks page lists {LOCAL_COMPARABLE.what} from{" "}
              <span className="tabular-nums">{`$${LOCAL_COMPARABLE.from}`}</span>.{" "}
              <a href={LOCAL_COMPARABLE.url} target="_blank" rel="noreferrer" className="text-muted underline decoration-gold/40 underline-offset-4 hover:text-gold">
                Source, checked {LOCAL_COMPARABLE.checked}
              </a>
            </p>
          ) : null}
          <p className="mt-6 max-w-md text-sm leading-6 text-muted">
            A heaped bed is about {BED_CUBIC_YARDS} cubic yards. Box-truck outfits sell 13–18 yard loads, so their
            “half load” and ours aren’t the same pile — compare by the item, not the word.
          </p>
          <Link
            to="/call"
            search={{ service: "junk-removal", size: "single" }}
            className="btn-press mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
          >
            Book a pickup
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="receipt-wrap lg:col-span-7">
        <div
          className="receipt card-paper spotlight"
          onPointerMove={spotlight}
          style={{ "--x": "50%", "--y": "30%" } as CSSProperties}
        >
          <div className="relative px-5 pb-9 pt-10 sm:px-8">
            <div className="flex items-baseline justify-between gap-4 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mahogany/80">
              <span>Pick It Up E · Haul rates</span>
              <span className="hidden sm:inline">Grand Forks, ND</span>
            </div>
            <div className="receipt-rule mt-4" aria-hidden="true" />

            <ol className="mt-2">
              {sizes.map((s) => (
                <li key={s.value}>
                  <Link
                    to="/call"
                    search={{ service: "junk-removal", size: s.value }}
                    className="receipt-row group grid grid-cols-[auto_1fr_auto] items-center gap-x-4 rounded-lg px-2 py-3 text-print"
                  >
                    <BedGauge fill={FILL[s.value] ?? 0.12} trips={s.value === "overflow"} />
                    <span className="min-w-0">
                      <span className="block font-display text-lg leading-tight sm:text-xl">{s.label}</span>
                      <span className="line-clamp-2 block text-xs text-print/60">{s.hint}</span>
                    </span>
                    <span className="flex items-center gap-2 font-display text-lg tabular-nums sm:text-xl">
                      {formatRange(s.price)}
                      <ArrowRight className="size-4 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover:translate-x-0 group-hover:opacity-60 group-focus-visible:opacity-60" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>

            <div className="receipt-rule mt-3" aria-hidden="true" />
            <p className="mt-4 px-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-mahogany/80">Add-ons</p>
            <ul className="mt-2 grid gap-x-8 px-2 sm:grid-cols-2">
              {extras.map((a) => (
                <li key={a.key} className="flex items-baseline justify-between gap-3 border-b border-dotted border-mahogany/25 py-2 text-sm text-print">
                  <span>{a.label}</span>
                  <span className="shrink-0 tabular-nums font-medium">+{formatRange(a.range)}</span>
                </li>
              ))}
            </ul>

            <div className="receipt-rule mt-5" aria-hidden="true" />
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-2 text-sm text-print/80">
              <span>{`$${DEPOSIT}`} holds the day · comes off the bill</span>
              <span className="text-print/60">1 bed ≈ {BED_CUBIC_YARDS} cu yd</span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
