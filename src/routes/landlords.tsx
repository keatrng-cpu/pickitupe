import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, Home, KeyRound } from "lucide-react";
import { useMemo, useState } from "react";
import { PhotoQuote } from "@/components/photo-quote";
import { LotSizeField } from "@/components/lot-size-field";
import { HaulVideo } from "@/components/haul-video";
import { Reveal } from "@/components/reveal";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import {
  COMBO_CREDIT,
  EXTRA_STOP_CUT,
  LANDLORD_PACKS,
  REFUSED,
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
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /landlords — for the people who own the door, not the people who live
 * behind it: small landlords, property managers, and investors (buy-and-hold,
 * flips, estate buyouts).
 *
 * What they decide on is different from a homeowner: days of vacancy, how
 * many addresses in one week, whose name is on the invoice, and what goes in
 * the security-deposit file. Every price here still comes from pricebook.ts
 * (LANDLORD_PACKS / EXTRA_STOP_CUT / COMBO_CREDIT / landlordDeposit); the
 * vacancy math only uses the rent the visitor types in.
 */

/**
 * Flip to true ONLY once the general-liability policy is bound and a
 * certificate can actually be issued. Until then the page doesn't offer one —
 * a promised COI that can't be produced loses the property manager for good.
 */
const COI_AVAILABLE = false;

const turnSizes = sizesForPack("turns");
const typicalTurn = turnSizes.find((s) => s.value === "three") ?? turnSizes[0];
const allTurnLow = Math.min(...turnSizes.map((s) => s.range.low));
const allTurnHigh = Math.max(...turnSizes.map((s) => s.range.high));
const refusedList = `${REFUSED.slice(0, -1).join(", ")} or ${REFUSED.at(-1)}`;

const FAQS = [
  {
    q: "Do I need to be there?",
    a: "No. Tell us how we get in when you book — you, a tenant, or entry instructions in the notes — and we text you when the unit's empty.",
  },
  {
    q: "Can the invoice be in my LLC's name?",
    a: "Yes. Put the LLC or property name on the booking and that's the name on the invoice. Pay the balance by card link, cash or check. W-9 on request.",
  },
  {
    q: "How do multiple units work?",
    a: `The first stop pays the truck at full rate. Every extra stop the same week runs at route rate — $${EXTRA_STOP_CUT.low}–$${EXTRA_STOP_CUT.high} off each. Turns and a leaf route on the same properties the same week take another $${COMBO_CREDIT} off the stack.`,
  },
  {
    q: "What won't you take from a unit?",
    a: `Tenants leave it; we still can't haul ${refusedList}. Everything else — furniture, mattresses, appliances, bags, the garage — is fine. Refrigerant units carry a small drop fee.`,
  },
  {
    q: "Can I move the day if the tenant runs late?",
    a: "Yes. Every address gets its own job link — move the day yourself until the day before, or send Keaton a note from the same page.",
  },
];

export const Route = createFileRoute("/landlords")({
  head: () =>
    pageHead({
      path: "/landlords",
      title: "Rental Turnover Cleanouts & Yard Work for Landlords | Grand Forks | Pick It Up E",
      description:
        "Tenant turns, trash-outs and fall yard routes for Grand Forks landlords, property managers and investors. Flat price per stop, extra units cheaper the same week, invoice in your LLC's name.",
      image: "/work/empty-unit.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Rental turnover cleanouts and property cleanups",
          serviceType: "Junk removal",
          description:
            "Move-out junk, trash-outs after a purchase, and fall leaf routes across multiple rental properties in Grand Forks and East Grand Forks.",
          path: "/landlords",
          priceLow: allTurnLow,
          priceHigh: allTurnHigh,
          image: "/work/empty-unit.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd("/landlords", "Landlords & investors"),
      ],
    }),
  component: LandlordsPage,
});

const AUDIENCES: {
  icon: typeof Home;
  who: string;
  line: string;
  points: string[];
  pack: LandlordPack;
  stops: (typeof STOP_COUNTS)[number];
}[] = [
  {
    icon: KeyRound,
    who: "Landlords",
    line: "One to ten doors. The unit has to be rent-ready before the next lease starts.",
    points: ["Move-out junk, mattresses, the couch they left", "Book the week before move-out", "Photos for the deposit file on request"],
    pack: "turns",
    stops: 1,
  },
  {
    icon: Building2,
    who: "Property managers",
    line: "Several addresses, one week, one owner to answer to.",
    points: ["Every extra stop that week at route rate", "A job link per address — move days yourself", "Invoice in the owner's or LLC's name"],
    pack: "turns",
    stops: 4,
  },
  {
    icon: Home,
    who: "Investors & flippers",
    line: "You closed on it full. The listing photos are next week.",
    points: ["Trash-outs after closing — priced by the truck bed", "Yard and leaves for curb appeal before photos", "Both the same week for the bundle cut"],
    pack: "combo",
    stops: 2,
  },
];

function LandlordsPage() {
  const [pack, setPack] = useState<LandlordPack>("turns");
  const [stops, setStops] = useState<(typeof STOP_COUNTS)[number]>(3);
  const sized = sizesForPack(pack);
  const [size, setSize] = useState(packDefaultSize(pack));
  const [lotSqFt, setLotSqFt] = useState(0);
  const [rent, setRent] = useState("");
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

  // Vacancy math on the visitor's own rent — no number of ours in it.
  const rentNum = Number(rent.replace(/[^0-9.]/g, ""));
  const perDay = rentNum > 0 ? (rentNum * 12) / 365 : 0;
  const perStopHigh = q.range ? q.range.high / Math.max(1, stops) : 0;

  function pickPack(next: LandlordPack) {
    setPack(next);
    const nextSizes = sizesForPack(next);
    if (!nextSizes.some((s) => s.value === size)) setSize(packDefaultSize(next));
    if (next === "turns") setLotSqFt(0);
  }

  function preset(next: LandlordPack, n: (typeof STOP_COUNTS)[number]) {
    pickPack(next);
    setStops(n);
    document.getElementById("stack")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="page-home relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="hero-frame landlord-hero">
          <HaulVideo src="/haul-complex.mp4?v=5" poster="/haul-complex-poster.jpg?v=5" fillClass="hero-fill-complex" />
          <div className="hero-copy">
            <div className="mx-auto w-full max-w-6xl">
              <p className="kicker">Landlords · property managers · investors</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl leading-none sm:text-6xl">
                Turn the unit.
                <span className="mt-2 block italic text-gold">Keep the rent coming.</span>
              </h1>
              <p className="mt-5 max-w-xl text-sm text-fg/90">
                Move-out junk, trash-outs and fall yards across every address you own — one crew, one week, a flat price
                per stop before we roll. A typical unit runs {formatRange(typicalTurn.range)}.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="#stack"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
                >
                  Price my properties <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-12">
          <p className="kicker">Who this is for</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((a, i) => (
              <Reveal key={a.who} delay={i * 90}>
                <article className="card-green card-lift flex h-full flex-col rounded-2xl p-6">
                  <a.icon className="size-6 text-gold" aria-hidden />
                  <h2 className="mt-3 font-display text-2xl leading-tight">{a.who}</h2>
                  <p className="mt-2 text-sm text-fg/90">{a.line}</p>
                  <ul className="mt-4 space-y-2 text-sm">
                    {a.points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => preset(a.pack, a.stops)}
                      className="btn-press inline-flex h-11 items-center gap-2 rounded-full border border-gold/50 px-5 text-sm hover:border-gold hover:text-gold"
                    >
                      Price it for {a.who.toLowerCase()} <ArrowRight className="size-4" aria-hidden />
                    </button>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="stack" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-12">
          <div className="card-green rounded-2xl p-6 sm:p-8">
            <p className="kicker">This week</p>
            <h2 className="mt-2 font-display text-3xl">Build the stack</h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {LANDLORD_PACKS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={pack === p.value}
                  onClick={() => pickPack(p.value)}
                  className={`btn-press rounded-2xl border p-4 text-left ${
                    pack === p.value ? "border-gold bg-gold text-ink" : "border-border text-fg hover:bg-fg/8"
                  }`}
                >
                  <p className={`text-xs uppercase tracking-[0.16em] ${pack === p.value ? "text-ink/70" : "text-gold"}`}>
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
            <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Number of stops">
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
                  title={s.hint}
                  className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                    currentSize === s.value ? "bg-gold text-ink" : "border border-border text-fg hover:bg-fg/8"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <details className="mt-6 rounded-2xl border border-border/80 p-4">
              <summary className="cursor-pointer text-sm text-fg">Photos or lot size — tighter number</summary>
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

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <div>
                <p key={q.range ? `${q.range.low}-${q.range.high}` : "walk"} className="price-pop font-display text-5xl leading-none text-gold tabular-nums">
                  {q.range ? formatRange(q.range) : "Walk-through"}
                </p>
                <p className="mt-3 text-sm text-muted">
                  {stops === 1
                    ? "One stop at full rate. Add a second this week and that one drops to route rate."
                    : `First stop full price. ${stops - 1} extra at route rate ($${EXTRA_STOP_CUT.low}–$${EXTRA_STOP_CUT.high} off each).`}
                  {pack === "combo" ? ` Bundle cut $${COMBO_CREDIT}.` : ""} ${deposit} deposit holds the first day.
                  {stops > 1 && q.discount > 0 ? ` Versus booking each stop solo, about $${q.discount} less on the high end.` : ""}
                </p>
                <ul className="mt-4 space-y-1 text-sm text-muted">
                  {q.lines.slice(0, 6).map((line) => (
                    <li key={line.label} className="flex justify-between gap-4">
                      <span>{line.label}</span>
                      <span className="tabular-nums text-gold">{formatRange(line.range)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-border p-5">
                <p className="kicker">Vacancy math</p>
                <label htmlFor="rent" className="mt-2 block text-sm text-fg/90">
                  What does the unit rent for a month?
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-muted">$</span>
                  <input
                    id="rent"
                    inputMode="decimal"
                    value={rent}
                    onChange={(e) => setRent(e.target.value)}
                    placeholder="e.g. 950"
                    className="field h-11 max-w-40 tabular-nums"
                  />
                </div>
                {perDay > 0 ? (
                  <p className="stagger-in mt-4 text-sm leading-6">
                    Every day it sits empty costs about <b className="text-gold tabular-nums">${Math.round(perDay)}</b>.
                    {perStopHigh > 0 ? (
                      <>
                        {" "}
                        The top of this quote is about{" "}
                        <b className="text-gold tabular-nums">{(perStopHigh / perDay).toFixed(1)} days</b> of rent per stop —
                        if the turn gets a unit re-rented that much sooner, it paid for itself.
                      </>
                    ) : null}
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-muted">We'll show what a day of vacancy costs next to the quote.</p>
                )}
              </div>
            </div>

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
              className="btn-press mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-sm font-medium text-ink hover:bg-gold"
            >
              Book {stops === 1 ? "this stop" : `${stops} stops`}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4">
          <Reveal>
            <div className="card-paper rounded-2xl p-6 sm:p-8">
              <p className="kicker">What you get as the owner</p>
              <h2 className="mt-2 font-display text-3xl leading-none">Run it from your phone.</h2>
              <ul className="mt-6 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                {[
                  ["A price per stop before we roll", "From the same price list as the calculator. Confirmed at the door, before anything is lifted."],
                  ["A job link for every address", "See the day, move it yourself until the day before, or send Keaton a note — no phone tag."],
                  ["Invoice in the right name", "Your LLC or the property's name on the invoice. Card link, cash or check. W-9 on request."],
                  ["Before-and-after photos", "Ask and we text them — for the deposit file or the listing."],
                  ["We carry it out", "Upstairs, basement, garage. You don't stage anything at the curb."],
                  COI_AVAILABLE
                    ? ["Certificate of insurance", "Named to you or your management company, on request."]
                    : ["Straight answers", `We'll tell you before we book if a unit's more than one truck — or holds something we can't take (${refusedList}).`],
                ].map(([t, d]) => (
                  <li key={t} className="flex gap-3">
                    <Check className="mt-0.5 size-5 shrink-0 text-mahogany" aria-hidden />
                    <span>
                      <b className="block">{t}</b>
                      <span className="opacity-80">{d}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12">
          <p className="kicker">The turnover calendar</p>
          <h2 className="mt-2 font-display text-3xl leading-none">Book the week before they leave.</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["May 1–15", "UND spring lease-out", "Finals end mid-May and the halls close. The big turn weeks — book the units as soon as tenants give notice."],
              ["Aug 1–20", "Fall move-in", "Last turns before the new leases start. Pair it with gutters and the yard while the truck is there."],
              ["Mid-December", "Semester turns", "Mid-year move-outs after fall finals. A short window — book it when the notice comes in."],
            ].map(([when, what, body], i) => (
              <Reveal key={when} delay={i * 90}>
                <article className="card-green h-full rounded-2xl p-6">
                  <p className="font-display text-3xl text-gold">{when}</p>
                  <h3 className="mt-1 text-sm uppercase tracking-[0.16em]">{what}</h3>
                  <p className="mt-3 text-sm text-fg/90">{body}</p>
                </article>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <article className="card-green mt-4 rounded-2xl p-6">
              <p className="kicker">Fall route, same buildings</p>
              <p className="mt-2 text-sm text-fg/90">
                If we already know your addresses from a turn, the leaf route is the cheap second pass — extra yards ride the
                same dump run. Turns and leaves the same week take the ${COMBO_CREDIT} bundle cut.
              </p>
            </article>
          </Reveal>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16" aria-labelledby="owner-faq">
          <p className="kicker">Owner questions</p>
          <h2 id="owner-faq" className="mt-2 font-display text-3xl leading-none">
            Straight answers.
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {FAQS.map((f) => (
              <li key={f.q} className="card-green rounded-2xl p-5">
                <p className="font-display text-xl leading-snug">{f.q}</p>
                <p className="mt-2 text-sm leading-6 text-fg/90">{f.a}</p>
              </li>
            ))}
          </ul>
          <p className="mt-8 max-w-2xl text-sm text-muted">
            Tenants book a single couch on the regular line. Owners book the stack here.
          </p>
        </section>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
