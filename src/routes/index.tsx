import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Armchair,
  Boxes,
  CalendarCheck,
  Camera,
  Leaf,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroQuoteTeaser } from "@/components/hero-quote-teaser";
import { HaulOnScroll } from "@/components/haul-on-scroll";
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

// Every service ends in hauling, so Truck moved to step 03 below — it was
// duplicating the pickup already on screen in the HaulOnScroll video right
// above this section.
const SERVICES = [
  {
    icon: Leaf,
    title: "Fall leaf cleanup",
    copy: "Rake, blow, and haul. Loose piles, beds, and curb-ready yards.",
  },
  {
    icon: Trash2,
    title: "Junk removal",
    copy: "Yard debris, storm fall, and the pile you've been walking past.",
  },
  {
    icon: Boxes,
    title: "Garage & basement",
    copy: "Cleanouts and move-out / rental turnovers without the dump-run.",
  },
  {
    icon: Armchair,
    title: "Furniture & appliances",
    copy: "Single-item pickups when you just need one thing gone today.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: Camera,
    t: "Send a photo",
    d: "We quote from the pile — no walk-around needed.",
  },
  {
    n: "02",
    icon: CalendarCheck,
    t: "Hold the date",
    d: "$50 deposit, applied to your bill.",
  },
  {
    n: "03",
    icon: Truck,
    t: "We haul it",
    d: "You never bag. We never leave a mess.",
  },
];

function Home() {
  const offer = Route.useLoaderData();
  const pct = Math.round(offer.percent * 100);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 section-y-lead lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <p className="kicker stagger-in">Grand Forks · locally owned</p>
            <h1
              className="stagger-in mt-4 font-display text-5xl leading-[0.95] tracking-[-0.02em] sm:text-6xl lg:text-7xl xl:text-8xl"
              style={{ animationDelay: "80ms" }}
            >
              We haul the fall.
              <span className="mt-2 block italic text-gold">You don't.</span>
            </h1>
            <p
              className="stagger-in mt-6 max-w-xl text-lg leading-[1.5] text-muted sm:text-xl"
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
              <Button asChild variant="ghost" size="lg">
                <a href="/#services">See what we haul</a>
              </Button>
            </div>
            <p
              className="stagger-in mt-4 text-xs text-muted tabular-nums"
              style={{ animationDelay: "320ms" }}
            >
              {offer.active
                ? `Book by ${offer.deadlineLabel}: ${pct}% off, up to $${offer.cap}`
                : `The ${offer.deadlineLabel} rate has closed — still booking at regular rates`}
            </p>
          </div>
          <div className="stagger-in" style={{ animationDelay: "180ms" }}>
            <HeroQuoteTeaser promo={offer} />
          </div>
        </section>

        {/* The static hero-truck.jpg band used to sit here. It was removed:
            the source art is baked onto a near-black field, so on the forest
            green page it read as a dark hole rather than part of the design.
            The same illustration already appears — transparent, on the page's
            own background — in the scroll scene right below. */}
        <HaulOnScroll />

        <div className="band">
          <section id="services" className="section-y mx-auto max-w-6xl px-4">
            <p className="kicker">What we haul</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
              Leaves, junk, and the pile in the garage.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
              {SERVICES.map((s) => (
                <article
                  key={s.title}
                  className="card-green card-lift rounded-2xl p-6 lg:p-7"
                >
                  <span className="grid size-12 place-items-center rounded-full bg-bg-deep/60 ring-1 ring-gold/25">
                    <s.icon
                      className="size-6 text-gold"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                  </span>
                  <h3 className="mt-4 font-display text-xl leading-[1.2]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.5] text-fg/90">
                    {s.copy}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section id="how" className="section-y mx-auto max-w-6xl px-4">
          <p className="kicker">How it works</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
            Three steps, one trip.
          </h2>
          <ol className="relative mt-10 grid gap-6 md:grid-cols-3 lg:mt-12">
            <div
              aria-hidden
              className="haul-road pointer-events-none absolute inset-x-[calc((100%_-_3rem)/6)] top-8 hidden h-1.5 -translate-y-1/2 md:block"
            />
            {STEPS.map((s) => (
              <li
                key={s.n}
                className="relative flex flex-col items-center text-center"
              >
                <span
                  aria-hidden
                  className="relative z-10 grid size-16 place-items-center rounded-full bg-bg-deep font-display text-3xl tabular-nums text-gold ring-1 ring-gold/35"
                >
                  {s.n}
                </span>
                {/* flex-1 so all three cards end level — step 01's copy wraps
                    to two lines and the others don't. */}
                <div className="card-green card-lift mt-5 flex w-full flex-1 flex-col rounded-2xl p-6 lg:p-7">
                  <s.icon
                    className="mx-auto size-7 text-gold"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  <h3 className="mt-3 font-display text-2xl leading-[1.15]">
                    {s.t}
                  </h3>
                  <p className="mt-2 text-sm leading-[1.5] text-fg/90">
                    {s.d}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="band">
          <section id="rules" className="section-y mx-auto max-w-6xl px-4">
            <div className="card-green rounded-2xl p-8 lg:p-10">
              <p className="kicker">City window</p>
              <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
                Grand Forks leaf rules
              </h2>
              <ul className="mt-8 grid gap-4 text-sm leading-[1.5] sm:grid-cols-2 lg:gap-x-10">
                <li>Leaves must be loose — bagged leaves are never collected.</li>
                <li>Within 3 ft of the curb, not in the street.</li>
                <li>3 ft clear of trees, mailboxes, and poles.</li>
                <li>Outside city weeks it's self-haul — or book us.</li>
              </ul>
              <p className="mt-6 text-sm leading-[1.5] text-muted">
                City vacuum typically mid-October to mid-November. Confirm 2026
                dates at grandforksgov.com or 701-738-8740.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-gold">
                <ShieldCheck className="size-4" />
                We take the load when the city window doesn't work.
              </div>
            </div>
          </section>
        </div>

        {/* The one cream field on the page. Centred rather than left-aligned:
            it is a single short statement in a full-bleed band, and left-set
            text left two thirds of the band visibly empty. .kicker already
            carries the optical-centre correction for exactly this case. */}
        <div className="band-paper">
          <section
            id="block"
            className="section-y mx-auto max-w-3xl px-4 text-center"
          >
            <p className="kicker">Block deal</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
              Get a neighbor on the same day. Both of you save $25.
            </h2>
            <p className="mx-auto mt-5 max-w-[34rem] text-base leading-[1.6]">
              One trip down your street costs us less than two, so we hand
              that back. Book your cleanup, put your neighbor's address in
              the form, and we take $25 off each bill when we do both houses
              the same day.
            </p>
          </section>
        </div>

        {/* The full booking form used to sit here, in a #book section. It was
            the hero's estimate widget a second time wrapped in twelve contact
            fields (owner: "this is too long and basically a duplicate from the
            one up top"). The estimate now lives once, in the hero, and the
            contact fields live once, on /book. The refused-items list that was
            in this section's copy is not lost — it is FAQ entry 3, verbatim,
            rendered below and in the JSON-LD. */}

        {/* No .band wrapper here on purpose: the FAQ has to sit on the page
            field so the page does not end on an invisible seam. A band against
            the bg-deep footer measures 1.136:1 — effectively no edge at all. */}
        <section id="faq" className="section-y mx-auto max-w-6xl px-4">
          <p className="kicker">Straight answers</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
            What people ask before they call
          </h2>
          <dl className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:gap-6">
            {FAQ.map((item) => (
              <div key={item.q} className="card-green card-lift rounded-2xl p-6">
                <dt className="font-display text-xl leading-[1.2]">{item.q}</dt>
                <dd className="mt-2 text-base leading-[1.6] text-fg/90">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
