import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { PhotoQuote } from "@/components/photo-quote";
import { LotSizeField } from "@/components/lot-size-field";
import { HaulVideo } from "@/components/haul-video";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import {
  COMBO_CREDIT,
  EXTRA_STOP_CUT,
  LANDLORD_PACKS,
  STOP_COUNTS,
  clampStops,
  estimate,
  formatRange,
  isPromoActive,
  landlordDeposit,
  packDefaultSize,
  packService,
  sizesForPack,
  type LandlordPack,
} from "@/lib/pricebook";

export const Route = createFileRoute("/landlords")({
  head: () => ({
    meta: [
      { title: "Landlord bundles — tenant turns & leaf routes | Pick It Up E" },
      {
        name: "description",
        content:
          "Grand Forks landlords: bundle tenant cleanouts or leaf routes. First stop is full rate. Extra stops this week run cheaper. One code, one deposit.",
      },
    ],
  }),
  component: LandlordsPage,
});

function LandlordsPage() {
  const [pack, setPack] = useState<LandlordPack>("turns");
  const [stops, setStops] = useState<(typeof STOP_COUNTS)[number]>(3);
  const sized = sizesForPack(pack);
  const [size, setSize] = useState(packDefaultSize(pack));
  const [lotSqFt, setLotSqFt] = useState(0);
  const currentSize = sized.find((s) => s.value === size)?.value ?? sized[0]?.value ?? size;
  const q = useMemo(
    () =>
      estimate({
        service: packService(pack),
        size: currentSize,
        addOns: [],
        pack,
        stops,
        lotSqFt: pack === "turns" ? 0 : lotSqFt,
        earlyBird: isPromoActive(),
      }),
    [pack, currentSize, stops, lotSqFt],
  );
  const deposit = landlordDeposit(stops, pack);

  function pickPack(next: LandlordPack) {
    setPack(next);
    const nextSizes = sizesForPack(next);
    if (!nextSizes.some((s) => s.value === size)) setSize(packDefaultSize(next));
    if (next === "turns") setLotSqFt(0);
  }

  return (
    <div className="page-home relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="hero-frame landlord-hero">
          <HaulVideo
            src="/haul-complex.mp4?v=5"
            poster="/haul-complex-poster.jpg?v=5"
            fillClass="hero-fill-complex"
          />
          <div className="hero-copy">
            <div className="mx-auto w-full max-w-6xl">
              <p className="kicker">Landlords & owners</p>
              <h1 className="mt-3 max-w-2xl font-display text-4xl leading-none sm:text-6xl">
                Bundle the week.
                <span className="mt-2 block italic text-gold">Turns. Leaves. Same crew.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm text-muted">
                First stop pays the truck. Extra units or yards this week run at
                route rate. One code, one invoice.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="card-green rounded-2xl p-6 sm:p-8">
            <p className="kicker">This week</p>
            <h2 className="mt-2 font-display text-3xl">Build the stack</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {LANDLORD_PACKS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => pickPack(p.value)}
                  className={`btn-press rounded-2xl border p-4 text-left ${
                    pack === p.value ? "border-gold bg-gold text-ink" : "border-border text-fg hover:bg-fg/8"
                  }`}
                >
                  <p className={`text-xs tracking-[0.16em] uppercase ${pack === p.value ? "text-ink/70" : "text-gold"}`}>
                    {p.kicker}
                  </p>
                  <p className="mt-1 font-display text-xl leading-none">{p.label}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-muted">{LANDLORD_PACKS.find((p) => p.value === pack)?.hint}</p>

            <p className="mt-8 text-xs font-medium text-muted">
              How many {pack === "leaves" ? "yards" : pack === "combo" ? "addresses" : "units"} this week?
            </p>
            <div className="mt-6 flex flex-wrap gap-2" role="radiogroup" aria-label="Number of stops">
              {STOP_COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={stops === c}
                  onClick={() => setStops(c)}
                  className={`btn-press h-12 rounded-full px-5 text-sm ${
                    stops === c ? "bg-gold text-ink" : "border border-border text-fg"
                  }`}
                >
                  {c === 6 ? "6+" : c}
                </button>
              ))}
            </div>

            <p className="mt-8 text-xs font-medium text-muted">
              {pack === "leaves" ? "How big is the first yard?" : "How heavy is the first stop?"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sized.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={currentSize === s.value && !lotSqFt}
                  onClick={() => {
                    setSize(s.value);
                    setLotSqFt(0);
                  }}
                  className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                    currentSize === s.value
                      ? "bg-gold text-ink"
                      : "border border-border text-fg hover:bg-fg/8"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <details className="mt-6 rounded-2xl border border-border/80 p-4">
              <summary className="cursor-pointer text-sm text-fg">
                Photos or lot size — tighter number
              </summary>
              {pack !== "turns" ? <LotSizeField value={lotSqFt} onChange={setLotSqFt} /> : null}
              <PhotoQuote
                service={packService(pack)}
                pack={pack}
                stops={stops}
                lotSqFt={lotSqFt}
                onApply={({ size: next, lotSqFt: measured }) => {
                  setSize(next);
                  if (measured) setLotSqFt(measured);
                }}
              />
            </details>

            <p className="mt-8 font-display text-5xl leading-none text-gold tabular-nums">
              {q.range ? formatRange(q.range) : "Walk-through"}
            </p>
            <p className="mt-3 text-sm text-muted">
              {stops === 1
                ? "One stop at full rate. Add a second this week and that one drops to route rate."
                : `First stop full price. ${stops - 1} extra at route rate ($${EXTRA_STOP_CUT.low}–$${EXTRA_STOP_CUT.high} off each).`}
              {pack === "combo" ? ` Bundle cut $${COMBO_CREDIT}.` : ""} ${deposit}{" "}
              deposit holds the first day.
              {stops > 1 && q.discount > 0
                ? ` Versus booking each stop solo, about $${q.discount} less on the high end.`
                : ""}
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {q.lines.slice(0, 6).map((line) => (
                <li key={line.label} className="flex justify-between gap-4">
                  <span>{line.label}</span>
                  <span className="tabular-nums text-gold">{formatRange(line.range)}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/call"
              search={{
                service: packService(pack),
                size: currentSize,
                src: "landlord",
                pack,
                stops: clampStops(stops),
                lotSqFt: lotSqFt || undefined,
              }}
              className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-sm font-medium text-ink hover:bg-gold"
            >
              Book {stops === 1 ? "this stop" : `${stops} stops`}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <article className="card-green rounded-2xl p-6">
              <p className="kicker">Turns</p>
              <h2 className="mt-2 font-display text-2xl">May 1–15 and Aug 1–20</h2>
              <p className="mt-3 text-sm text-muted">
                UND lease-out. Book the units the week before they leave. We will
                not pretend one truck empties four apartments in an afternoon —
                we take the week, one code.
              </p>
            </article>
            <article className="card-green rounded-2xl p-6">
              <p className="kicker">Leaves</p>
              <h2 className="mt-2 font-display text-2xl">Fall route, same buildings</h2>
              <p className="mt-3 text-sm text-muted">
                If we already know your addresses from a turn, the leaf route is
                the cheap second pass. Mix both the same week and the stack gets
                the ${COMBO_CREDIT} bundle cut.
              </p>
            </article>
          </div>

          <p className="mt-10 max-w-2xl text-sm text-muted">
            Tenants book a couch on the regular line. Owners book the stack here.
          </p>
        </section>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
