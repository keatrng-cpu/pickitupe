import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { FinePrint } from "@/components/fine-print";
import { HaulStage } from "@/components/haul3d/HaulStage";
import { QuickQuote } from "@/components/quick-quote";
import { Reveal } from "@/components/reveal";
import { ReviewStrip } from "@/components/review-strip";
import { RateReel } from "@/components/rate-reel";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { RiverCrossing } from "@/components/winter/river-crossing";
import { getOfferStatus } from "@/lib/bookings";
import { ESTATE_TIERS } from "@/lib/pricebook";
import { firstName, readLastBooking, type SavedBooking } from "@/lib/returning";
import { faqJsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";
import { SITE_PHONE } from "@/lib/site-phone";

const TITLE =
  "Junk Removal, Appliance Pickup & Estate Cleanouts in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  `Junk, furniture and appliance removal plus whole-house and estate cleanouts in Grand Forks and East Grand Forks. Carried from the basement, price before you call, $50 holds the day. ${SITE_PHONE}.`;

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
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "preload", as: "image", href: "/haul3d/poster-sm.webp", media: "(max-width: 767px)" },
      { rel: "preload", as: "image", href: "/haul3d/poster.webp", media: "(min-width: 768px)" },
    ],
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
        {last ? (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <Link
              to="/call"
              search={{ service: last.service, size: last.size }}
              className="card-paper inline-flex items-center gap-3 rounded-full px-4 py-2 text-sm text-print"
            >
              Welcome back, {firstName(last.name)}. Rebook?
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </div>
        ) : null}
        {offer.active ? (
          <p className="mx-auto max-w-6xl px-4 pt-3 text-xs text-fg/80">
            {Math.round(offer.percent * 100)}% off through {offer.deadlineLabel}, up to ${offer.cap}
          </p>
        ) : null}
        <HaulStage />
        <QuickQuote />

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
            <div className="mt-6">
              <RiverCrossing />
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-fg/90">
              Every neighborhood in Grand Forks, across the river into East Grand Forks, and out to Thompson, Manvel,
              Emerado and the base. Two jobs on the same street the same day get the neighbor credit. Anything farther
              out, ask and we&apos;ll tell you straight.
            </p>
          </div>
        </Reveal>

        <Reveal as="section" className="mx-auto max-w-6xl px-4 py-8">
          <Link to="/landlords" className="landlord-strip card-green block overflow-hidden rounded-2xl">
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
