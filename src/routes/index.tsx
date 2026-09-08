import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, Receipt, Truck } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { FinePrint } from "@/components/fine-print";
import { HaulVideo } from "@/components/haul-video";
import { QuickQuote } from "@/components/quick-quote";
import { RateReel } from "@/components/rate-reel";
import { DateField } from "@/components/date-field";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { getProof, type Proof } from "@/lib/jobs";
import {
  BLOCK_TIERS,
  canonicalService,
  isPromoLive,
  PHONE,
  PHONE_TEL,
  PROMO_DEADLINE_LABEL,
  SERVICES,
  type ServiceKey,
} from "@/lib/pricebook";
import { firstName, readLastBooking, type SavedBooking } from "@/lib/returning";
import { AFTER_HOURS, HOURS_LINE, HOURS_NOTE, TOWNS, YARD_LINE } from "@/lib/shop";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const promo = isPromoLive();
  const [last, setLast] = useState<SavedBooking | null>(null);
  const [proof, setProof] = useState<Proof | null>(null);
  const [boardDay, setBoardDay] = useState("");
  const [boardAsap, setBoardAsap] = useState(true);

  useEffect(() => {
    setLast(readLastBooking());
    getProof()
      .then(setProof)
      .catch(() => setProof(null));
  }, []);

  const lastLabel =
    SERVICES.find((s) => s.value === (last ? canonicalService(last.service as ServiceKey) : undefined))
      ?.label ?? "last haul";

  return (
    <div className="page-home relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="hero-frame">
          <HaulVideo />
          <div className="hero-copy">
            <div className="mx-auto w-full max-w-6xl">
              {last ? (
                <Link
                  to="/call"
                  search={{ service: String(last.service), size: last.size }}
                  className="card-paper mb-6 inline-flex max-w-full items-center gap-3 rounded-full px-4 py-2 text-sm text-print"
                >
                  Welcome back, {firstName(last.name)}. Rebook {lastLabel}?
                  <ArrowRight className="size-4 shrink-0" />
                </Link>
              ) : null}
              <p className="kicker">{TOWNS.join(" · ")}</p>
              <h1 className="mt-3 max-w-xl font-display text-5xl leading-[0.92] tracking-[-0.03em] sm:text-7xl lg:text-8xl">
                We haul it.
                <span className="mt-1 block italic text-gold">You don't.</span>
              </h1>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/call"
                  className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
                >
                  Shop line
                  <ArrowRight className="size-4" />
                </Link>
                <Link to="/book" className="text-sm text-fg/80 underline-offset-4 hover:text-gold hover:underline">
                  Prefer a form?
                </Link>
              </div>
              {promo ? (
                <p className="mt-4 text-xs text-fg/80">
                  20% off through {PROMO_DEADLINE_LABEL}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="border-b border-border">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px sm:grid-cols-4">
            <Stat n={String(proof?.towns ?? TOWNS.length)} l={TOWNS.join(" · ")} />
            <Stat n={`${proof?.slots ?? 4}/day`} l="slots on the truck" />
            <Stat n={String(proof?.onTruck ?? 0)} l="jobs this fall" />
            <Stat n={String(proof?.hauled ?? 0)} l="hauled" />
          </dl>
        </section>

        <QuickQuote />
        <RateReel />

        <section className="section-y mx-auto max-w-6xl px-4">
          <div className="card-green rounded-3xl p-5 sm:p-8">
            <p className="kicker">Crew board</p>
            <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">
              Same calendar the shop line books on.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted">
              Four slots a day, Monday through Saturday. When someone locks a stop — chat or form —
              these numbers move.
            </p>
            <div className="mt-6">
              <DateField
                service="junk-removal"
                size="sofa"
                day={boardDay}
                asap={boardAsap}
                onChange={(next) => {
                  setBoardDay(next.day);
                  setBoardAsap(next.asap);
                }}
              />
            </div>
            <Link
              to="/call"
              className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
            >
              Shop line — lock it
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        <section className="section-y mx-auto max-w-6xl px-4">
          <p className="kicker">The trip</p>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            <Beat
              n="01"
              icon={<Receipt className="size-6 text-gold" />}
              title="Estimate"
              copy="Photo or tap. Range on screen before we roll."
            />
            <Beat
              n="02"
              icon={<CalendarCheck className="size-6 text-gold" />}
              title="Date"
              copy="First open day on the crew board — not a guess."
            />
            <Beat
              n="03"
              icon={<Truck className="size-6 text-gold" />}
              title="Hauled"
              copy="We show up. You don't lift."
            />
          </ol>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-4">
          <div className="card-green rounded-2xl p-6 sm:p-8">
            <p className="kicker">Come back</p>
            <h2 className="mt-2 font-display text-3xl">Loyalty is on the quote.</h2>
            <p className="mt-3 max-w-xl text-sm text-muted">
              We keep your last haul — rebook in a tap. Neighbors on the same
              street, same day: ${BLOCK_TIERS[0].credit} off two houses, $
              {BLOCK_TIERS[1].credit} off three. You get that or the{" "}
              {PROMO_DEADLINE_LABEL} rate, whichever is bigger — never stacked.
            </p>
          </div>
        </section>

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

        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="rounded-2xl border border-border px-5 py-6">
            <p className="kicker">Hours</p>
            <p className="mt-2 font-display text-2xl">
              {HOURS_LINE}. {HOURS_NOTE}
            </p>
            <p className="mt-3 text-sm text-muted">{YARD_LINE}</p>
            <p className="mt-2 text-sm text-muted">{AFTER_HOURS}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <Link to="/call" className="text-gold hover:underline">
                Shop line
              </Link>
              <a href={`tel:${PHONE_TEL}`} className="text-gold hover:underline">
                {PHONE}
              </a>
              <Link to="/about" className="text-gold hover:underline">
                About the shop
              </Link>
              <Link to="/status" className="text-gold hover:underline">
                Your hauls
              </Link>
            </div>
          </div>
        </section>

        <FinePrint />
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div className="px-4 py-6">
      <dt className="font-display text-3xl leading-none text-gold">{n}</dt>
      <dd className="mt-2 text-xs text-muted">{l}</dd>
    </div>
  );
}

function Beat({
  n,
  icon,
  title,
  copy,
}: {
  n: string;
  icon: ReactNode;
  title: string;
  copy: string;
}) {
  return (
    <li>
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-full bg-bg-deep font-display text-xl text-gold ring-1 ring-gold/35">
          {n}
        </span>
        {icon}
        <span className="font-display text-3xl leading-none">{title}</span>
      </div>
      <p className="mt-3 text-sm text-muted">{copy}</p>
    </li>
  );
}
