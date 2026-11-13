import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Block, PriceTable } from "@/components/service-page";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { addOnsFor, BLOCK_MIN_JOB_LOW, BLOCK_TIERS, DEPOSIT, ESTATE_TIERS, formatRange, listedSizesFor, REFUSED } from "@/lib/pricebook";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";

/**
 * /pricing — every published price on one page, straight from pricebook.ts.
 * Nothing here is typed: change the pricebook, this page changes with it.
 * Winter order: junk, estates, gutters, then leaves (spring).
 */

const PATH = "/pricing";
const TITLE = "Prices: Junk Removal, Cleanouts, Gutters & Leaves in Grand Forks | Pick It Up E";
const DESCRIPTION =
  "Every Pick It Up E price in one place: junk by the truck bed, estate cleanouts, gutters and leaf cleanup in Grand Forks and East Grand Forks. $50 holds the day.";

const money = (n: number) => `$${n.toLocaleString("en-US")}`;
const rows = (service: Parameters<typeof listedSizesFor>[0]) =>
  listedSizesFor(service).map((s) => [s.label, formatRange(s.range), s.hint] as [string, string, string]);
const addRows = (service: Parameters<typeof addOnsFor>[0]) =>
  addOnsFor(service).map((a) => [a.label, formatRange(a.range), a.hint] as [string, string, string]);

export const Route = createFileRoute("/pricing")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      jsonLd: [breadcrumbJsonLd(PATH, "Pricing")],
    }),
  component: PricingPage,
});

function PricingPage() {
  const block = BLOCK_TIERS;
  return (
    <div className="page-service relative z-10 min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-4 pb-4 pt-10 sm:pt-14">
          <p className="kicker">Pricing</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[0.98] tracking-[-0.02em] sm:text-6xl">
            Every price, before you call.
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-7 text-fg/90">
            Ranges, not hourly meters. You pick the size, see the range, and we confirm the number when we see the pile,
            before anything gets lifted. {money(DEPOSIT)} on a card holds the day and comes off the bill.
          </p>
          <nav className="mt-6 flex flex-wrap gap-2 text-sm" aria-label="Jump to">
            {[
              ["#junk", "Junk"],
              ["#estate", "Estate cleanouts"],
              ["#gutters", "Gutters"],
              ["#leaves", "Leaves (spring)"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="rounded-full border border-border px-4 py-2 text-fg hover:bg-fg/8">
                {label}
              </a>
            ))}
          </nav>
        </section>

        <article className="service-body mx-auto max-w-6xl px-4 py-6">
          <div id="junk" className="scroll-mt-32">
            <Block title="Junk, furniture & appliances">
              <p>Priced by how much of the truck bed it fills.</p>
              <PriceTable caption="By load" rows={rows("junk-removal")} />
              <PriceTable caption="Add-ons, only when they apply" rows={addRows("junk-removal")} />
              <Link
                to="/call"
                search={{ service: "junk-removal", size: "single" }}
                className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                Book a haul
                <ArrowRight className="size-4" />
              </Link>
            </Block>
          </div>

          <div id="estate" className="scroll-mt-32">
            <Block title="Estate & whole-house cleanouts">
              <p>Every estate job starts with a free walkthrough and ends with one fixed written price.</p>
              <PriceTable
                caption="Most cleanouts land here"
                rows={ESTATE_TIERS.map((t) => [
                  t.label,
                  `${money(t.range.low)}–${money(t.range.high)}`,
                  `${t.size}. ${t.days}.${t.note ? ` ${t.note}.` : ""}`,
                ])}
              />
              <Link
                to="/estate-cleanout-grand-forks"
                className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                Free walkthrough
                <ArrowRight className="size-4" />
              </Link>
            </Block>
          </div>

          <div id="gutters" className="scroll-mt-32">
            <Block title="Gutters (single-story)">
              <PriceTable caption="Gutter cleaning" rows={rows("gutter-cleaning")} />
              <PriceTable caption="Add-ons" rows={addRows("gutter-cleaning")} />
            </Block>
          </div>

          <div id="leaves" className="scroll-mt-32">
            <Block title="Leaves & yard (spring)">
              <PriceTable caption="Leaf cleanup by lot" rows={rows("leaf-cleanup")} />
              <PriceTable caption="Add-ons" rows={addRows("leaf-cleanup")} />
            </Block>
          </div>

          <Block title="Neighbor credit">
            <p>
              Two households on one street the same day take {money(block[0].credit)} off each. Three or more take{" "}
              {money(block[block.length - 1].credit)} off each. On jobs listing from {money(BLOCK_MIN_JOB_LOW)} up.
            </p>
          </Block>
          <Block title="What we don't take">
            <p>
              {REFUSED.slice(0, -1).join(", ")} or {REFUSED.at(-1)}.
            </p>
          </Block>
        </article>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}
