import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Camera, ClipboardCheck, Home, MessageSquareText, Phone, Sparkles } from "lucide-react";
import { Block, type Faq } from "@/components/service-page";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { BeforeAfter } from "@/components/winter/before-after";
import { Snowfall } from "@/components/winter/snowfall";
import { TruckSvg } from "@/components/winter/truck-svg";
import { ESTATE_TIERS, REFUSED } from "@/lib/pricebook";
import { breadcrumbJsonLd, BUSINESS, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /estate-cleanout-grand-forks — "estate cleanout Grand Forks", "whole house
 * cleanout", "clear out a house after a death / estate sale". Ranges are
 * ESTATE_TIERS in pricebook.ts (winter plan, Nov 13). Every job is quoted
 * after a free walkthrough, so the call to action is a text or a call — no
 * $50 card wall here. The estate deposit is set on the written quote.
 */

const PATH = "/estate-cleanout-grand-forks";
const TITLE = "Estate & Whole-House Cleanouts in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Estate and whole-house cleanouts in Grand Forks and East Grand Forks. Free walkthrough, one fixed written price, house left broom-swept. Most cleanouts land between $650 and $4,500.";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const low = ESTATE_TIERS[0].range.low;
const high = ESTATE_TIERS[ESTATE_TIERS.length - 1].range.high;
const refusedList = `${REFUSED.slice(0, -1).join(", ")} or ${REFUSED.at(-1)}`;
const SMS = `sms:${BUSINESS.telE164.replaceAll("-", "")}`;

const FAQS: Faq[] = [
  {
    q: "What does an estate cleanout cost in Grand Forks?",
    a: `Most land between ${money(low)} and ${money(high)}. A room or an apartment is ${money(ESTATE_TIERS[0].range.low)}–${money(ESTATE_TIERS[0].range.high)}, a house after the estate sale is ${money(ESTATE_TIERS[1].range.low)}–${money(ESTATE_TIERS[1].range.high)}, and a full house with a packed basement or garage is ${money(ESTATE_TIERS[2].range.low)}–${money(ESTATE_TIERS[2].range.high)}. After the walkthrough you get one fixed written price, not an hourly meter.`,
  },
  {
    q: "Is the walkthrough really free?",
    a: "Yes. About 15 minutes, in person or by video. Text photos or call and we'll set it up. You get the written price after, and you decide.",
  },
  {
    q: "Can the family keep some things?",
    a: "Yes. Mark what stays and we stage it in one room or the garage. Firearms, medications, cash and valuables should be cleared by the family before we start.",
  },
  {
    q: "Where does everything go?",
    a: "Usable furniture and household goods go to donation drop-offs, metal goes to scrap, and the rest goes to the Grand Forks landfill. Big houses get a roll-off dumpster on site so the work isn't tied to landfill hours.",
  },
  {
    q: "What won't you take?",
    a: `${refusedList[0].toUpperCase()}${refusedList.slice(1)}. No biohazard or hoarding cleanup. Pianos and safes are quoted separately.`,
  },
  {
    q: "Can the attorney or the realtor be the contact?",
    a: "Yes. We can invoice the estate, and send before-and-after photos and the dump tickets for the file.",
  },
];

const STEPS = [
  { icon: MessageSquareText, title: "Text or call", body: "Photos help. Tell us the address and when the house needs to be empty." },
  { icon: Camera, title: "Free walkthrough", body: "About 15 minutes, in person or by video." },
  { icon: ClipboardCheck, title: "One written price", body: "Fixed, not hourly. You pick the days." },
  { icon: Sparkles, title: "Broom-swept", body: "Donation, scrap, dump. Photos when we're done." },
] as const;

export const Route = createFileRoute("/estate-cleanout-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      jsonLd: [
        serviceJsonLd({
          name: "Estate and whole-house cleanouts",
          serviceType: "Estate cleanout",
          description: DESCRIPTION,
          path: PATH,
          priceLow: low,
          priceHigh: high,
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "Estate cleanouts"),
      ],
    }),
  component: EstatePage,
});

function WalkthroughButtons({ className }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      <a
        href={SMS}
        className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
      >
        Text photos for a free walkthrough
        <ArrowRight className="size-4" />
      </a>
      <a
        href={BUSINESS.telHref}
        className="btn-press inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-sm text-fg hover:bg-fg/8"
      >
        <Phone className="size-4 text-gold" />
        Call instead
      </a>
    </div>
  );
}

function EstatePage() {
  return (
    <div className="page-service relative z-10 min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden">
          <Snowfall />
          <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-8 px-4 pb-8 pt-10 sm:pt-14 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="kicker">Estate &amp; whole-house cleanouts · Grand Forks</p>
              <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[0.98] tracking-[-0.02em] sm:text-6xl">
                After the estate sale, <span className="italic text-gold">we clear the rest.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-fg/90">
                Furniture, beds, appliances, boxes, the basement, the garage and the shed. Usable things go to donation,
                metal to scrap, and the house is left broom-swept and ready to list. One crew, one written price, no
                hourly surprises.
              </p>
              <WalkthroughButtons className="mt-8" />
              <p className="mt-3 text-xs text-muted">The walkthrough is free. No card needed to ask.</p>
            </div>
            <div className="relative" aria-hidden="true">
              <div className="truck-stage-ground" style={{ height: "55%" }} />
              <TruckSvg className="relative w-full drop-shadow-[0_18px_24px_#0006]" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="estate-steps">
          <h2 id="estate-steps" className="sr-only">
            How an estate cleanout works
          </h2>
          <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card-green rounded-2xl p-5">
                <span className="font-display text-sm text-gold">0{i + 1}</span>
                <s.icon className="mt-3 size-6 text-gold" aria-hidden="true" />
                <p className="mt-3 font-display text-2xl leading-none">{s.title}</p>
                <p className="mt-2 text-sm leading-6 text-fg/85">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="estate-prices">
          <p className="kicker">Prices</p>
          <h2 id="estate-prices" className="mt-3 font-display text-3xl leading-none sm:text-4xl">
            Most cleanouts land between {money(low)} and {money(high)}.
          </h2>
          <ul className="mt-8 grid gap-4 lg:grid-cols-3">
            {ESTATE_TIERS.map((t) => (
              <li key={t.key} className="card-paper flex flex-col rounded-2xl p-6">
                <Home className="size-6 text-mahogany" aria-hidden="true" />
                <p className="mt-3 font-display text-2xl leading-tight text-print">{t.label}</p>
                <p className="mt-2 text-sm text-print/70">{t.size}</p>
                <p className="mt-1 text-sm text-print/70">{t.days}</p>
                <p className="mt-auto pt-5 font-display text-4xl leading-none tabular-nums text-mahogany">
                  {money(t.range.low)}–{money(t.range.high)}
                </p>
                {t.note ? <p className="mt-2 text-xs uppercase tracking-widest text-print/60">{t.note}</p> : null}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-muted">
            Ranges, not quotes. The walkthrough sets one fixed written price. Single pieces and a few loads are cheaper on
            the{" "}
            <Link to="/junk-removal-grand-forks" className="text-fg underline-offset-4 hover:text-gold hover:underline">
              junk removal
            </Link>{" "}
            rates.
          </p>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-8">
          <BeforeAfter />
        </section>

        <article className="service-body mx-auto max-w-6xl px-4 py-6">
          <Block title="What's included">
            <ul className="list-disc space-y-2 pl-5">
              <li>Everything left after the family and the estate sale: furniture, beds, appliances, boxes, clothes.</li>
              <li>The basement, the garage and the shed.</li>
              <li>Keep items staged in one spot so nothing goes by mistake.</li>
              <li>Donation drop-offs for what's usable, scrap for metal.</li>
              <li>A roll-off dumpster on site for bigger houses, so the work isn't tied to landfill hours.</li>
              <li>The house left broom-swept, with photos for the family, the realtor or the attorney.</li>
            </ul>
          </Block>
          <Block title="Not included">
            <ul className="list-disc space-y-2 pl-5">
              <li>{refusedList[0].toUpperCase() + refusedList.slice(1)}.</li>
              <li>Firearms, ammunition, medications and sharps, cash and valuables. The family clears those first.</li>
              <li>Biohazard and hoarding cleanup.</li>
              <li>Estate sales, appraisals and deep cleaning.</li>
              <li>Pianos and safes are quoted separately.</li>
            </ul>
          </Block>
          <Block title="For realtors, attorneys and estate sale companies">
            <p>
              Estate sale company: we clear what didn&apos;t sell, right after the sale. Realtor: listing-ready, with
              before-and-after photos sent to you. Attorney or personal representative: we invoice the estate and send
              photos and dump tickets for the file.
            </p>
            <WalkthroughButtons />
          </Block>
        </article>

        <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="page-faq">
          <p className="kicker">Questions</p>
          <h2 id="page-faq" className="mt-3 font-display text-3xl leading-none sm:text-4xl">
            Straight answers.
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {FAQS.map((f) => (
              <li key={f.q} className="card-green rounded-2xl p-5">
                <p className="font-display text-xl leading-snug">{f.q}</p>
                <p className="mt-2 text-sm leading-6 text-fg/90">{f.a}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
