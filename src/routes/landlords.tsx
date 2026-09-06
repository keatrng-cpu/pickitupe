import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/landlords")({
  head: () => ({
    meta: [
      { title: "Investor special — stacked complexes | Pick It Up E" },
      {
        name: "description",
        content:
          "Two or more apartment complexes in one week: investor rate, one PICK code, stacked days. Grand Forks and East Grand Forks turnover hauls.",
      },
    ],
  }),
  component: LandlordsPage,
});

function LandlordsPage() {
  return (
    <div className="relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden border-b border-border">
          <img
            src="/haul-junk-poster.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bg via-bg/80 to-transparent" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <p className="kicker">Landlords & investors</p>
            <h1 className="mt-3 max-w-2xl font-display text-4xl leading-none sm:text-6xl">
              Portfolio week.
              <span className="mt-2 block italic text-gold">Every complex. One crew.</span>
            </h1>
            <p className="mt-5 max-w-xl text-sm text-muted">
              Two, three, four buildings — we stack them in the same week, one
              PICK code, one deposit. Extra complexes run at investor rate, not
              another full-building price.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14">
          <ol className="grid gap-6 sm:grid-cols-3">
            <li className="card-green rounded-2xl p-6">
              <p className="text-xs tracking-[0.2em] text-gold">01</p>
              <h2 className="mt-2 font-display text-2xl">One invoice</h2>
              <p className="mt-2 text-sm text-muted">
                Every complex on the same PICK code. You are not chasing three
                vendors in August.
              </p>
            </li>
            <li className="card-green rounded-2xl p-6">
              <p className="text-xs tracking-[0.2em] text-gold">02</p>
              <h2 className="mt-2 font-display text-2xl">Stacked days</h2>
              <p className="mt-2 text-sm text-muted">
                First open day holds the truck. The rest of that week we run
                your other buildings. One crew, no extra trip fee between your
                addresses.
              </p>
            </li>
            <li className="card-green rounded-2xl p-6">
              <p className="text-xs tracking-[0.2em] text-gold">03</p>
              <h2 className="mt-2 font-display text-2xl">Investor rate</h2>
              <p className="mt-2 text-sm text-muted">
                Complex 2+ is priced as an extra stop, not another full-building
                day. Book the stack and we quote the week.
              </p>
            </li>
          </ol>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <article className="card-green rounded-2xl p-6">
              <p className="kicker">When</p>
              <h2 className="mt-2 font-display text-2xl">May 1–15 and Aug 1–20</h2>
              <p className="mt-3 text-sm text-muted">
                UND lease-out. Book the portfolio the week before they leave.
                We will not pretend one truck empties three complexes in one
                afternoon — we take the week.
              </p>
            </article>
            <article className="card-green rounded-2xl p-6">
              <p className="kicker">Who</p>
              <h2 className="mt-2 font-display text-2xl">Owners, not one-off tenants</h2>
              <p className="mt-3 text-sm text-muted">
                If you hold more than one building in Grand Forks or East Grand
                Forks, this is the job. Tenants still book a couch. You book the
                stack.
              </p>
            </article>
          </div>

          <Link
            to="/call"
            search={{ service: "junk-removal", size: "full", src: "landlord" }}
            className="btn-press mt-12 inline-flex h-12 items-center rounded-full bg-fg px-7 text-sm font-medium text-ink hover:bg-gold"
          >
            Book a portfolio week
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
