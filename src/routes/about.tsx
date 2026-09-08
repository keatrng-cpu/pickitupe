import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { PHONE, TEL } from "@/lib/messages";
import { AFTER_HOURS, HOURS_LINE, HOURS_NOTE, TOWNS, YARD_LINE } from "@/lib/shop";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Pick It Up E — Grand Forks haul crew" },
      {
        name: "description",
        content:
          "One truck in Grand Forks. We rake, we drive, we haul. East Grand Forks, Thompson, and Manvel too.",
      },
    ],
  }),
  component: AboutPage,
});

const WORK = [
  {
    src: "/work/leaves-rake.jpg",
    alt: "Crew raking a leaf pile toward a forest-green pickup in Grand Forks",
    kicker: "Leaves",
    title: "You don't bag them.",
    copy: "Loose piles at the curb are the job. We rake, blow, and load. You stay inside.",
  },
  {
    src: "/work/leaves-lot.jpg",
    alt: "Pickup bed heaped with leaves on a Grand Forks city lot",
    kicker: "City lots",
    title: "Front, back, the boulevard.",
    copy: "Standard Grand Forks lot, one pass. We don't leave a row for the city vacuum to miss. Book before mid-October and we beat that truck to your street.",
  },
  {
    src: "/work/fridge-stairs.jpg",
    alt: "Two people carrying a refrigerator up basement stairs",
    kicker: "Appliances",
    title: "Basement fridge, we come in.",
    copy: "City curb pickup is $48 if you can wait and haul it to the street. We take the stairs. The refrigerant drop is already in the range.",
  },
  {
    src: "/work/couch-bed.jpg",
    alt: "Couch and mattress strapped in the pickup bed",
    kicker: "One piece",
    title: "Couch or mattress, same stop.",
    copy: "One bulky living-room piece is a size, not a second trip. Strapped in the bed. Gone the same afternoon.",
  },
  {
    src: "/work/empty-unit.jpg",
    alt: "Empty apartment after a tenant turnover",
    kicker: "Turns",
    title: "Unit empty. Truck full.",
    copy: "UND lease-out weeks, one code for the stack. We take the week. We do not pretend one afternoon empties four apartments.",
  },
  {
    src: "/work/unit-haul.jpg",
    alt: "Crew carrying bags and junk from a brick apartment",
    kicker: "Cleanouts",
    title: "What they left, we haul.",
    copy: "Bags, a chair, a microwave — the pile a tenant walked away from. First stop full rate. Extra units that week at route rate.",
  },
];

function AboutPage() {
  return (
    <div className="relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden border-b border-border">
          <img
            src="/haul-junk-poster.jpg"
            alt="Pick It Up E truck"
            className="absolute inset-0 size-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/75 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <p className="kicker">The shop</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl leading-none sm:text-6xl">
              We drive.
              <span className="mt-2 block italic text-gold">We rake.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm text-muted">
              Pick It Up E is a Grand Forks crew, not a franchise. Same people
              on the phone, on the rake, and in the truck. You get a day that
              still has room — not a maybe.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:grid-cols-3">
          <article className="card-green rounded-2xl p-6">
            <p className="kicker">Who</p>
            <h2 className="mt-2 font-display text-2xl">One crew</h2>
            <p className="mt-3 text-sm text-muted">
              Leaves, junk, furniture, gutters. We don't hand you off to a
              sub. The face of the shop is the truck — that's who shows up.
            </p>
          </article>
          <article className="card-green rounded-2xl p-6">
            <p className="kicker">Where</p>
            <h2 className="mt-2 font-display text-2xl">Four towns</h2>
            <p className="mt-3 text-sm text-muted">{TOWNS.join(" · ")}</p>
          </article>
          <article className="card-green rounded-2xl p-6">
            <p className="kicker">When</p>
            <h2 className="mt-2 font-display text-2xl">{HOURS_LINE}</h2>
            <p className="mt-3 text-sm text-muted">
              {HOURS_NOTE} {AFTER_HOURS}
            </p>
          </article>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <p className="kicker">The work</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">Six stops. Same truck.</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WORK.map((w) => (
              <li key={w.src} className="overflow-hidden rounded-2xl border border-border bg-bg-deep">
                <img src={w.src} alt={w.alt} className="aspect-video w-full object-cover" />
                <div className="p-5">
                  <p className="kicker">{w.kicker}</p>
                  <h3 className="mt-2 font-display text-xl">{w.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{w.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="card-green rounded-2xl p-6 sm:p-8">
            <p className="kicker">Find us</p>
            <h2 className="mt-2 font-display text-3xl">Hours & the yard</h2>
            <p className="mt-4 max-w-xl text-sm text-muted">{YARD_LINE}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wider text-gold">Hours</dt>
                <dd className="mt-1 text-sm">
                  {HOURS_LINE}. {HOURS_NOTE}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gold">After hours</dt>
                <dd className="mt-1 text-sm">{AFTER_HOURS}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-gold">Call</dt>
                <dd className="mt-1 text-sm">
                  <a href={TEL} className="text-gold hover:underline">
                    {PHONE}
                  </a>
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/call"
                className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                Shop line
              </Link>
              <a
                href={TEL}
                className="btn-press inline-flex h-12 items-center rounded-full border border-border px-6 text-sm text-fg"
              >
                Call the shop
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
