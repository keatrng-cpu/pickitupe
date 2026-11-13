import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Home as HomeIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { FinePrint } from "@/components/fine-print";
import { QuickQuote } from "@/components/quick-quote";
import { Reveal } from "@/components/reveal";
import { ReviewStrip } from "@/components/review-strip";
import { RateReel } from "@/components/rate-reel";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { BeforeAfter } from "@/components/winter/before-after";
import { CountUp } from "@/components/winter/count-up";
import { HowItWorksRoad } from "@/components/winter/how-it-works";
import { MotionToggle } from "@/components/winter/motion-toggle";
import { Snowfall } from "@/components/winter/snowfall";
import { TruckStage } from "@/components/winter/truck-stage";
import { getOfferStatus } from "@/lib/bookings";
import { MEDIA } from "@/lib/media";
import { DEPOSIT, ESTATE_TIERS, listedSizesFor } from "@/lib/pricebook";
import { firstName, readLastBooking, type SavedBooking } from "@/lib/returning";
import { DAILY_SLOTS } from "@/lib/schedule";
import { faqJsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";
import { SITE_PHONE } from "@/lib/site-phone";

const TITLE =
  "Junk Removal, Appliance Pickup & Estate Cleanouts in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  `Junk, furniture and appliance removal plus whole-house and estate cleanouts in Grand Forks and East Grand Forks. Carried from the basement, price before you call, $50 holds the day. ${SITE_PHONE}.`;

/** From the pricebook, never typed: the "One piece" rung's low end. */
const ONE_PIECE_FROM = listedSizesFor("junk-removal").find((s) => s.value === "single")?.range.low ?? 59;
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export const Route = createFileRoute("/")({
  loader: () => getOfferStatus(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { property: "og:image", content: `${SITE_URL}/og.jpg` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "geo.region", content: "US-ND" },
      { name: "geo.placename", content: "Grand Forks" },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(localBusinessJsonLd()),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(faqJsonLd()),
      },
    ],
  }),
  component: Home,
});

function Home() {
  const offer = Route.useLoaderData();
  const [last, setLast] = useState<SavedBooking | null>(null);

  useEffect(() => {
    setLast(readLastBooking());
  }, []);

  return (
    <div className="page-home relative z-10 min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="winter-hero">
          <Snowfall />
          <div className="winter-hero-grid mx-auto max-w-6xl px-4">
            <div className="winter-hero-stage">
              <TruckStage video={MEDIA.heroLoop} allow3D={MEDIA.hero3D} />
              <MotionToggle className="absolute bottom-3 right-3 z-20" />
            </div>
            <div className="winter-hero-copy hero-enter">
              {last ? (
                <Link
                  to="/call"
                  search={{ service: last.service, size: last.size }}
                  className="card-paper mb-6 inline-flex max-w-full items-center gap-3 rounded-full px-4 py-2 text-sm text-print"
                >
                  Welcome back, {firstName(last.name)}. Rebook?
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              ) : null}
              <h1 className="font-display text-5xl leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-[5.25rem]">
                <span className="kicker mb-4 block font-sans tracking-[0.14em]">
                  Junk, appliances &amp; cleanouts in Grand Forks
                </span>
                We haul it.
                <span className="mt-1 block italic text-gold">You don&apos;t.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-fg/90">
                Out of your house, not on the curb for the city truck. Carried from the basement. {money(DEPOSIT)} holds
                the day.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a
                  href="#haul"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
                >
                  Price my junk
                  <ArrowRight className="size-4" />
                </a>
                <Link
                  to="/estate-cleanout-grand-forks"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full border border-border px-5 text-sm text-fg hover:bg-fg/8"
                >
                  <HomeIcon className="size-4 text-gold" />
                  Estate cleanout
                </Link>
              </div>
              {offer.active ? (
                <p className="mt-4 text-xs text-fg/80">
                  {Math.round(offer.percent * 100)}% off through {offer.deadlineLabel}, up to ${offer.cap}
                </p>
              ) : null}
              <dl className="hero-stats mt-8 grid max-w-md grid-cols-3 gap-3">
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-widest text-muted">One piece from</dt>
                  <dd className="mt-1 font-display text-3xl leading-none">
                    <CountUp value={ONE_PIECE_FROM} prefix="$" />
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-widest text-muted">Holds the day</dt>
                  <dd className="mt-1 font-display text-3xl leading-none">
                    <CountUp value={DEPOSIT} prefix="$" />
                  </dd>
                </div>
                <div>
                  <dt className="text-[0.68rem] uppercase tracking-widest text-muted">Hauls a weekday</dt>
                  <dd className="mt-1 font-display text-3xl leading-none">
                    <CountUp value={DAILY_SLOTS} />
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <QuickQuote />

        <HowItWorksRoad />

        <Reveal as="section" className="section-y mx-auto max-w-6xl px-4">
          <div aria-labelledby="estate-strip" className="grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <p className="kicker">Estate &amp; whole-house cleanouts</p>
              <h2 id="estate-strip" className="mt-3 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
                After the estate sale, we clear the rest.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-fg/90">
                Furniture, beds, appliances, boxes, the basement and the garage. Usable things go to donation, metal to
                scrap, and the house is left broom-swept. Free walkthrough, then one fixed written price.
              </p>
              <ul className="mt-6 grid gap-2">
                {ESTATE_TIERS.map((t) => (
                  <li key={t.key} className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
                    <span className="text-sm text-fg/90">{t.label}</span>
                    <span className="font-display text-xl tabular-nums text-gold">
                      {money(t.range.low)}–{money(t.range.high)}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                to="/estate-cleanout-grand-forks"
                className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                Book a free walkthrough
                <ArrowRight className="size-4" />
              </Link>
            </div>
            <BeforeAfter />
          </div>
        </Reveal>

        <Reveal>
          <RateReel />
        </Reveal>
        <ReviewStrip />

        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-8">
          <div aria-labelledby="where-we-work">
            <p className="kicker">Where we work</p>
            <h2 id="where-we-work" className="mt-3 font-display text-3xl leading-none sm:text-4xl">
              Grand Forks and East Grand Forks, one truck, all winter.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-fg/90">
              Every neighborhood in Grand Forks, across the river into East Grand Forks, and out to Thompson, Manvel,
              Emerado and the base. Two jobs on the same street the same day get the neighbor credit. Anything farther
              out, ask and we&apos;ll tell you straight.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-8">
          <Link to="/landlords" className="landlord-strip winter-strip card-green block overflow-hidden rounded-2xl">
            <Snowfall className="snowfall-soft" />
            <div className="relative z-10 flex items-end justify-between gap-4 p-5 sm:p-8">
              <div>
                <p className="kicker">Landlords · managers · investors</p>
                <p className="mt-2 max-w-xl font-display text-2xl sm:text-3xl">
                  December semester turns. Trash-outs between tenants, and extra units the same week cost less.
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-gold" />
            </div>
          </Link>
        </Reveal>

        <Reveal>
          <FinePrint />
        </Reveal>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
