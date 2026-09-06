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
                to="/book"
                className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                Book a haul
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
