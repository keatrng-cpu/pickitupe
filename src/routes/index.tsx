import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { FinePrint } from "@/components/fine-print";
import { HaulVideo } from "@/components/haul-video";
import { HousePacks } from "@/components/house-packs";
import { QuickQuote } from "@/components/quick-quote";
import { RateReel } from "@/components/rate-reel";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { getOfferStatus } from "@/lib/bookings";
import { firstName, readLastBooking, type SavedBooking } from "@/lib/returning";
import { faqJsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";

const TITLE =
  "Leaf Cleanup, Gutters & Junk Removal in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Fall leaf & yard cleanup, gutter cleaning and junk hauling in Grand Forks and East Grand Forks. We rake, blow, and haul it — you never touch a bag. $50 on the card holds the day. 701-213-3969.";

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
        <section className="hero-frame">
          <HaulVideo />
          <div className="hero-copy">
            <div className="mx-auto w-full max-w-6xl">
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
              <p className="kicker">Grand Forks</p>
              <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
                We haul it.
                <span className="mt-1 block italic text-gold">You don't.</span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#haul"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
                >
                  Get a number
                  <ArrowRight className="size-4" />
                </a>
                <Link to="/call" className="text-sm text-fg/80 underline-offset-4 hover:text-gold hover:underline">
                  Skip to booking
                </Link>
              </div>
              {offer.active ? (
                <p className="mt-4 text-xs text-fg/80">
                  {Math.round(offer.percent * 100)}% off through {offer.deadlineLabel}, up to $
                  {offer.cap}
                </p>
              ) : (
                <p className="mt-4 text-xs text-fg/80">
                  Book before the city vacuum. Same block, same day — neighbor credit. Floor holds.
                </p>
              )}
            </div>
          </div>
        </section>

        <QuickQuote />
        <HousePacks />
        <RateReel />

        <section className="mx-auto max-w-6xl px-4 py-8">
          <Link
            to="/landlords"
            className="landlord-strip card-green block overflow-hidden rounded-2xl"
          >
            <HaulVideo
              src="/haul-complex.mp4?v=5"
              poster="/haul-complex-poster.jpg?v=5"
              fillClass="hero-fill-complex"
            />
            <div className="relative z-10 flex items-end justify-between gap-4 p-5 sm:p-8">
              <div>
                <p className="kicker">Landlords</p>
                <p className="mt-2 max-w-xl font-display text-2xl sm:text-3xl">
                  Bundle tenant turns or a leaf route. Extra stops this week cost less.
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-gold" />
            </div>
          </Link>
        </section>

        <FinePrint />
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
