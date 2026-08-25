import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Leaf,
  Sofa,
  Truck,
  Warehouse,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DoorHanger } from "@/components/door-hanger";
import { HaulOnScroll } from "@/components/haul-on-scroll";
import { QuoteForm } from "@/components/quote-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getOfferStatus } from "@/lib/bookings";
import { FAQ, faqJsonLd, localBusinessJsonLd, SITE_URL } from "@/lib/seo";

const TITLE =
  "Leaf Cleanup & Junk Removal in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Fall leaf cleanup and junk hauling in Grand Forks and East Grand Forks. We rake, blow, and haul it — you never touch a bag. Book by September 20 for 20% off, up to $75. 218-779-2553.";

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

const SERVICES = [
  {
    icon: Leaf,
    title: "Fall leaf cleanup",
    copy: "Rake, blow, and haul. Loose piles, beds, and curb-ready yards.",
  },
  {
    icon: Truck,
    title: "Junk removal",
    copy: "Yard debris, storm fall, and the pile you've been walking past.",
  },
  {
    icon: Warehouse,
    title: "Garage & basement",
    copy: "Cleanouts and move-out / rental turnovers without the dump-run.",
  },
  {
    icon: Sofa,
    title: "Furniture & appliances",
    copy: "Single-item pickups when you just need one thing gone today.",
  },
];

function Home() {
  const offer = Route.useLoaderData();
  const pct = Math.round(offer.percent * 100);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div>
            <p className="kicker stagger-in">Grand Forks · locally owned</p>
            <h1
              className="stagger-in mt-4 font-display text-5xl leading-[0.95] sm:text-7xl"
              style={{ animationDelay: "80ms" }}
            >
              We haul the fall.
              <span className="mt-2 block italic text-gold">You don't.</span>
            </h1>
            <p
              className="stagger-in mt-6 max-w-xl text-lg text-muted"
              style={{ animationDelay: "160ms" }}
            >
              Leaf cleanup and junk removal. We rake, blow, and haul it — you
              never touch a bag.
            </p>
            <div
              className="stagger-in mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Button asChild variant="cream" size="lg">
                <Link to="/book">
                  {offer.active ? `Grab ${pct}% off` : "Book a cleanup"}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
            <p
              className="stagger-in mt-5 text-sm text-gold tabular-nums"
              style={{ animationDelay: "320ms" }}
            >
              {offer.active
                ? `Book by ${offer.deadlineLabel}: ${pct}% off, up to $${offer.cap}`
                : `The ${offer.deadlineLabel} rate has closed — still booking at regular rates`}
            </p>
          </div>
          <div className="stagger-in" style={{ animationDelay: "180ms" }}>
            <DoorHanger />
          </div>
        </section>

        {/* The static hero-truck.jpg band used to sit here. It was removed:
            the source art is baked onto a near-black field, so on the forest
            green page it read as a dark hole rather than part of the design.
            The same illustration already appears — transparent, on the page's
            own background — in the scroll scene right below. */}
        <HaulOnScroll />

        <div className="band mt-8">
          <section id="services" className="mx-auto max-w-6xl px-4 py-20">
            <p className="kicker">What we haul</p>
            <h2 className="mt-2 font-display text-4xl">
              Leaves, junk, and the pile in the garage.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {SERVICES.map((s) => (
                <article
                  key={s.title}
                  className="card-green card-lift rounded-3xl p-6"
                >
                  <s.icon className="size-6 text-gold" />
                  <h3 className="mt-4 font-display text-2xl">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted">{s.copy}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-3">
          {[
            { n: "01", t: "Send a photo", d: "We quote from the pile — no walk-around needed." },
            { n: "02", t: "Hold the date", d: "$50 deposit, applied to your bill." },
            { n: "03", t: "We haul it", d: "You never bag. We never leave a mess." },
          ].map((step) => (
            <article key={step.n} className="card-green card-lift rounded-3xl p-6">
              <p className="font-display text-3xl text-gold">{step.n}</p>
              <h3 className="mt-3 font-display text-2xl">{step.t}</h3>
              <p className="mt-2 text-sm text-muted">{step.d}</p>
            </article>
          ))}
        </section>

        <section id="rules" className="mx-auto max-w-6xl px-4 py-16">
          <div className="card-green rounded-3xl p-8">
            <p className="kicker">City window</p>
            <h2 className="mt-2 font-display text-4xl">Grand Forks leaf rules</h2>
            <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <li>Leaves must be loose — bagged leaves are never collected.</li>
              <li>Within 3 ft of the curb, not in the street.</li>
              <li>3 ft clear of trees, mailboxes, and poles.</li>
              <li>Outside city weeks it's self-haul — or book us.</li>
            </ul>
            <p className="mt-6 text-xs text-muted">
              City vacuum typically mid-October to mid-November. Confirm 2026
              dates at grandforksgov.com or 701-738-8740.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-gold">
              <ShieldCheck className="size-4" />
              We take the load when the city window doesn't work.
            </div>
          </div>
        </section>

        <section id="block" className="mx-auto max-w-6xl px-4 pb-4">
          <div className="rounded-3xl border border-gold/30 bg-bg-deep/40 p-8">
            <p className="kicker">Block deal</p>
            <h2 className="mt-2 font-display text-4xl">
              Get a neighbor on the same day. Both of you save $25.
            </h2>
            <p className="mt-4 max-w-2xl text-muted">
              One trip down your street costs us less than two, so we hand that
              back. Book your cleanup, put your neighbor's address in the form,
              and we take $25 off each bill when we do both houses the same day.
            </p>
          </div>
        </section>

        <section
          id="book"
          className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 lg:grid-cols-2"
        >
          <div>
            <p className="kicker">Book</p>
            <h2 className="mt-2 font-display text-4xl">
              Before the rush, before the snow.
            </h2>
            <p className="mt-4 text-muted">
              We cannot take paint, chemicals, oil, propane tanks, concrete,
              dirt, roofing, or asbestos.
            </p>
          </div>
          <QuoteForm promo={offer} />
        </section>

        <div className="band">
          <section id="faq" className="mx-auto max-w-6xl px-4 py-20">
            <p className="kicker">Straight answers</p>
            <h2 className="mt-2 font-display text-4xl">
              What people ask before they call
            </h2>
            <dl className="mt-8 grid gap-4 sm:grid-cols-2">
              {FAQ.map((item) => (
                <div key={item.q} className="card-green rounded-2xl p-5">
                  <dt className="font-medium">{item.q}</dt>
                  <dd className="mt-2 text-sm text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
