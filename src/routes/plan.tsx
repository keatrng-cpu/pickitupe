import { useState } from "react";
import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Check, Loader2, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getPlanStatus, openBillingPortal, startPlanCheckout } from "@/lib/plan-actions";
import { PLAN_EXCLUSIONS, SERVICE_WINDOW, type PlanTier } from "@/lib/plan";

const TITLE = "Seasonal Cleanup Plan — Spring + Fall | Pick It Up E";
const DESCRIPTION =
  "One price, two visits a year. We clean up after snow melt and again after leaf fall in Grand Forks and East Grand Forks. Cancel any time.";

export const Route = createFileRoute("/plan")({
  // No validateSearch here — deliberately. See src/routes/book.tsx: the router
  // merges keys a validator does not return back out of the raw query string,
  // so a sanitised result can never match a hostile URL and it 307s to itself
  // forever. Read the raw search in the component instead.
  loader: () => getPlanStatus(),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
    ],
  }),
  component: PlanPage,
});

function PlanPage() {
  const status = Route.useLoaderData();
  const search = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  const welcomed = Boolean(search.welcome);
  const cancelled = Boolean(search.cancelled);

  const [busy, setBusy] = useState<PlanTier | null>(null);
  const [portalEmail, setPortalEmail] = useState("");
  const [portalBusy, setPortalBusy] = useState(false);

  async function join(tier: PlanTier) {
    setBusy(tier);
    try {
      const res = await startPlanCheckout({ data: { tier } });
      if (res.ok) window.location.href = res.url;
      else toast.error(res.error);
    } catch {
      toast.error("Could not start checkout. Call or text 218-779-2553.");
    } finally {
      setBusy(null);
    }
  }

  async function manage(e: React.FormEvent) {
    e.preventDefault();
    setPortalBusy(true);
    try {
      const res = await openBillingPortal({ data: { email: portalEmail } });
      if (res.ok) window.location.href = res.url;
      else toast.error(res.error);
    } catch {
      toast.error("Could not open billing. Call or text 218-779-2553.");
    } finally {
      setPortalBusy(false);
    }
  }

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />

      <main>
        <section className="section-y-lead mx-auto max-w-6xl px-4">
          <p className="kicker">Seasonal plan</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-[-0.02em] sm:text-6xl">
            Two visits a year.
            <span className="mt-2 block italic text-gold">Never think about it again.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-[1.5] text-muted">
            We come once after snow melt and once after the leaves are down.
            Same truck, same price, locked in for the year.
          </p>

          {welcomed ? (
            <p className="mt-6 flex max-w-2xl items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-gold" />
              <span>
                You're on the plan. Check your email for the receipt — the
                cancellation link lives in there, and in every renewal notice we
                send. We'll text before your first visit.
              </span>
            </p>
          ) : null}
          {cancelled ? (
            <p className="mt-6 max-w-2xl text-sm text-muted">
              No charge was made. The plan's still here when you want it.
            </p>
          ) : null}
        </section>

        <div className="band">
          <section className="section-y mx-auto max-w-6xl px-4">
            <p className="kicker">What you get</p>
            <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
              Pick your lot size.
            </h2>

            {status.available ? (
              <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-3">
                {status.tiers.map((t) => (
                  <article
                    key={t.tier}
                    className="card-estimate flex flex-col rounded-2xl p-6 lg:p-7"
                  >
                    <p className="kicker">{t.label}</p>
                    <p className="mt-3 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-bold leading-none tracking-tight">
                        ${t.amount}
                      </span>
                      <span className="text-sm text-print/70">/ year</span>
                    </p>
                    <p className="mt-2 text-sm leading-[1.5] text-print/80">
                      {t.hint}
                    </p>
                    <ul className="mt-5 space-y-2 text-sm text-print/80">
                      <li className="flex gap-2">
                        <Snowflake className="mt-0.5 size-4 shrink-0" aria-hidden />
                        Spring cleanup — {SERVICE_WINDOW.spring.typical}
                      </li>
                      <li className="flex gap-2">
                        <CalendarCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                        Fall cleanup — {SERVICE_WINDOW.fall.typical}
                      </li>
                    </ul>
                    <button
                      type="button"
                      onClick={() => join(t.tier as PlanTier)}
                      disabled={busy !== null}
                      className="btn-press mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-mahogany px-5 py-3 text-sm font-medium text-paper hover:bg-mahogany-deep disabled:opacity-50"
                    >
                      {busy === t.tier ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      Join the plan
                      <ArrowRight className="size-4" />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="card-green mt-10 rounded-2xl p-8">
                <p className="text-base leading-[1.6]">
                  The seasonal plan isn't open for signups yet. Text{" "}
                  <a className="underline decoration-gold/50 underline-offset-4" href="sms:2187792553">
                    218-779-2553
                  </a>{" "}
                  and we'll hold your spring slot at this year's rate with the
                  same $50 deposit as any booking.
                </p>
              </div>
            )}

            <p className="mt-8 max-w-3xl text-sm leading-[1.6] text-muted">
              Acreage and tree-heavy lots aren't on the plan — those get a free
              walk-through and a real quote first. Nobody can price an acre
              sight-unseen, and we're not going to pretend otherwise.
            </p>
          </section>
        </div>

        {/* The legal spine of the product. Not marketing copy — see
            src/lib/plan.ts. NDCC ch. 51-37 wants the renewal terms clear and
            conspicuous BEFORE the customer is bound, and the weather bounds are
            a chargeback defence as much as an honesty measure. */}
        <section className="section-y mx-auto max-w-6xl px-4">
          <p className="kicker">The fine print, in plain words</p>
          <h2 className="mt-3 font-display text-3xl leading-[1.05] tracking-[-0.01em] sm:text-4xl lg:text-5xl">
            When we come, and how to leave.
          </h2>

          <div className="mt-10 grid gap-6 lg:mt-12 lg:grid-cols-2">
            <div className="card-green rounded-2xl p-6 lg:p-7">
              <h3 className="font-display text-2xl leading-[1.15]">
                We name a trigger, not a date
              </h3>
              <p className="mt-3 text-sm leading-[1.6] text-fg/90">
                Spring: we come {SERVICE_WINDOW.spring.trigger} —{" "}
                {SERVICE_WINDOW.spring.typical}. If we haven't been out by{" "}
                <strong>{SERVICE_WINDOW.spring.outerBound}</strong>, you're
                refunded automatically. You don't have to ask.
              </p>
              <p className="mt-3 text-sm leading-[1.6] text-fg/90">
                Fall: {SERVICE_WINDOW.fall.trigger} —{" "}
                {SERVICE_WINDOW.fall.typical}. Same automatic refund if we
                haven't been out by{" "}
                <strong>{SERVICE_WINDOW.fall.outerBound}</strong>.
              </p>
              <p className="mt-3 text-sm leading-[1.6] text-muted">
                North Dakota doesn't run on a calendar. Ground thaw here has
                swung by seven weeks between years, and the city itself has
                moved its own leaf-vacuum start date for weather. Anybody who
                promises you an exact date is guessing.
              </p>
            </div>

            <div className="card-green rounded-2xl p-6 lg:p-7">
              <h3 className="font-display text-2xl leading-[1.15]">
                It renews yearly. Cancelling takes one click.
              </h3>
              <p className="mt-3 text-sm leading-[1.6] text-fg/90">
                The plan renews automatically each year until you cancel. We
                email you <strong>at least 30 days before every renewal</strong>{" "}
                with the amount and the date — no surprise charges.
              </p>
              <p className="mt-3 text-sm leading-[1.6] text-fg/90">
                Cancel any time from the link in your receipt or any renewal
                email. No phone call, no reason needed. Cancel before a renewal
                and you're not charged again; cancel after and you keep the
                visits you already paid for.
              </p>

              <form onSubmit={manage} className="mt-5">
                <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-fg">
                  Manage or cancel your plan
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    required
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    placeholder="The email on your plan"
                    className="w-full rounded-xl border border-border bg-bg-deep/50 px-4 py-3 text-base text-fg outline-none placeholder:text-muted/70 focus:border-gold"
                  />
                  <Button type="submit" variant="ghost" size="lg" disabled={portalBusy}>
                    {portalBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                    Open billing
                  </Button>
                </div>
              </form>
            </div>
          </div>

          <div className="card-green mt-6 rounded-2xl p-6 lg:p-7">
            <h3 className="font-display text-2xl leading-[1.15]">Not included</h3>
            <ul className="mt-3 grid gap-2 text-sm leading-[1.6] text-fg/90 sm:grid-cols-2">
              {PLAN_EXCLUSIONS.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
