import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Camera, Truck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { FinePrint } from "@/components/fine-print";
import { HaulTicker } from "@/components/haul-ticker";
import { HaulVideo } from "@/components/haul-video";
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
  "Fall leaf cleanup, gutter cleaning and junk hauling in Grand Forks and East Grand Forks. We rake, blow, and haul it — you never touch a bag. Book by September 20 for 20% off, up to $75. 701-213-3969.";

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
      <main>
        <section className="hero-frame">
          <HaulVideo />
          <div className="hero-copy">
            <div className="mx-auto w-full max-w-6xl">
              {last ? (
                <Link
                  to="/book"
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
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
                >
                  Book in 30 seconds
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="/#haul"
                  className="btn-press inline-flex h-12 items-center rounded-full border border-fg/40 px-7 text-base text-fg"
                >
                  See a price
                </a>
              </div>
              {offer.active ? (
                <p className="mt-4 text-xs text-fg/80">
                  {Math.round(offer.percent * 100)}% off through {offer.deadlineLabel}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <HaulTicker />
        <QuickQuote />
        <RateReel />

        <section className="section-y mx-auto max-w-6xl px-4">
          <p className="kicker">The trip</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-3">
            <Beat n="01" icon={<Camera className="size-6 text-gold" />} title="Photo" />
            <Beat n="02" icon={<CalendarCheck className="size-6 text-gold" />} title="Date" />
            <Beat n="03" icon={<Truck className="size-6 text-gold" />} title="Gone" />
          </ol>
        </section>

        <FinePrint />
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}

function Beat({ n, icon, title }: { n: string; icon: ReactNode; title: string }) {
  return (
    <li className="flex items-center gap-4">
      <span className="grid size-14 place-items-center rounded-full bg-bg-deep font-display text-xl text-gold ring-1 ring-gold/35">
        {n}
      </span>
      {icon}
      <span className="font-display text-3xl leading-none">{title}</span>
    </li>
  );
}
