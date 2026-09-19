import { createFileRoute, Link } from "@tanstack/react-router";
import { Block, PriceTable, ServicePage, type Faq } from "@/components/service-page";
import { BLOCK_TIERS, DEPOSIT, formatRange, sizeOptionsFor } from "@/lib/pricebook";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /east-grand-forks — the Minnesota side. Same truck, same pricebook, two
 * differences worth a page: the EGF cleanup week and the MN tax lines that
 * show up on the invoice. Tax rates here are Minnesota's published rates,
 * not ours; the invoice shows them as a line, never buried in the price.
 * (The on-screen estimate does not add the MN line yet — see the plan's
 * Minnesota Tax ID row; that's a pricing-workstream task, not copy.)
 */

const PATH = "/east-grand-forks";
const TITLE = "Leaf Cleanup & Junk Removal in East Grand Forks, MN | Pick It Up E";
const DESCRIPTION =
  "Leaf cleanup, junk hauling and single-story gutter cleaning in East Grand Forks, MN. Same truck as the Grand Forks side, priced by the lot or the bed, Minnesota tax shown as a line.";

const MN_SALES_TAX = "8.375%";
const MN_SWM_TAX = "9.75%";

const leaf = sizeOptionsFor("leaf-cleanup");
const junk = sizeOptionsFor("junk-removal");
const gutter = sizeOptionsFor("gutter-cleaning");
const pick = (list: typeof leaf, v: string) => list.find((s) => s.value === v)!;

const leafSmall = pick(leaf, "small");
const leafMedium = pick(leaf, "medium");
const leafLarge = pick(leaf, "large");
const junkSingle = pick(junk, "single");
const junkQuarter = pick(junk, "quarter");
const junkHalf = pick(junk, "half");
const junkFull = pick(junk, "full");
const gutterStd = pick(gutter, "standard");
const gutterComplex = pick(gutter, "complex");
const block2 = BLOCK_TIERS[0];
const block3 = BLOCK_TIERS[1];

const FAQS: Faq[] = [
  {
    q: "Do you actually come to East Grand Forks?",
    a: "Yes — it's a bridge, not a trip. The Point, Sherlock Park, the streets off Central and DeMers, out by the Boardwalk and Cabela's, and the campground side of the Red River State Recreation Area are all on the same board as Grand Forks. Pick a day and the truck comes across.",
  },
  {
    q: "Why is there a tax line on my invoice?",
    a: `Minnesota taxes these services and North Dakota doesn't. Leaf and gutter work carries the ${MN_SALES_TAX} sales tax; junk hauls carry the ${MN_SWM_TAX} solid-waste management tax instead. The base price is the same as the Grand Forks side — the state's share is its own line on your invoice, not hidden in the number.`,
  },
  {
    q: "What about the city's Fall Cleanup week?",
    a: "Use it. East Grand Forks runs a free curbside bulky pickup October 5–9, 2026. Get what you can to the curb that week. We're for what the city won't take, what won't fit in one curb pile, what's still in the basement, and everything that piles up after the truck has already been down your street.",
  },
  {
    q: "What does leaf cleanup cost in EGF?",
    a: `Same lot pricing as Grand Forks: a small lot is ${formatRange(leafSmall.range)}, a standard lot ${formatRange(leafMedium.range)}, a large or corner lot ${formatRange(leafLarge.range)}, plus the ${MN_SALES_TAX} Minnesota line. You see the range before you book and we confirm the number before we start.`,
  },
  {
    q: "The city already hauls furniture and appliances, don't they?",
    a: "They do — curbside, for a flat fee per item ($12 furniture, $25 appliance at last check). If you can get it to the curb and wait for the route, that's the cheaper move. We carry from inside, come on the day you pick, and take the whole pile at once.",
  },
  {
    q: "Can my neighbor and I book the same day?",
    a: `Please do. Two houses on one street the same day: $${block2.credit} off each. Three or more: $${block3.credit} off each. One trip across the bridge, one dump run, everyone pays less. It doesn't stack with the pre-season promo — you get the bigger one.`,
  },
];

export const Route = createFileRoute("/east-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      image: "/work/unit-haul.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Leaf cleanup, junk removal and gutter cleaning in East Grand Forks",
          serviceType: "Yard cleanup and junk removal",
          description: DESCRIPTION,
          path: PATH,
          priceLow: junkSingle.range.low,
          priceHigh: leafLarge.range.high,
          image: "/work/unit-haul.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "East Grand Forks"),
      ],
    }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      kicker="East Grand Forks, MN"
      title={
        <>
          Same truck, other side of the river.
          <br />
          Minnesota tax shown, not hidden.
        </>
      }
      intro={
        <>
          <p>
            East Grand Forks gets the same crew, the same pickup and the same price list as Grand Forks — leaf
            cleanup by the lot, junk by the truck bed, single-story gutters from the ground. The two things that
            change when we cross the bridge are the city's cleanup calendar and the state's tax line, and this page
            is about both.
          </p>
          <p className="mt-3">
            Pick your service and size for the base range; Minnesota's share is printed as its own row on the invoice.
            No surprises when it comes.
          </p>
        </>
      }
      cta={{ service: "leaf-cleanup", size: "medium", label: "Price my EGF job" }}
      photos={[
        { src: "/work/unit-haul.jpg", alt: "Contents of an emptied rental unit loaded in the pickup bed" },
        { src: "/work/empty-unit.jpg", alt: "Rental unit cleared out and swept after a haul" },
        { src: "/work/leaves-rake.jpg", alt: "Two-person crew raking a leaf pile toward the pickup" },
      ]}
      faqs={FAQS}
    >
      <Block title="Prices, plus the Minnesota line">
        <p>
          Base prices are identical on both sides of the Red. Minnesota then adds {MN_SALES_TAX} sales tax on leaf
          and gutter work, or the {MN_SWM_TAX} solid-waste management tax on a junk haul — one or the other, never
          both on the same line. The invoice prints it as a row so you can see exactly what the state took.
        </p>
        <PriceTable
          caption={`Leaf cleanup by lot (before the ${MN_SALES_TAX} line)`}
          rows={[
            [leafSmall.label, formatRange(leafSmall.range), leafSmall.hint],
            [leafMedium.label, formatRange(leafMedium.range), leafMedium.hint],
            [leafLarge.label, formatRange(leafLarge.range), leafLarge.hint],
          ]}
        />
        <PriceTable
          caption={`Junk by load (before the ${MN_SWM_TAX} line)`}
          rows={[
            [junkSingle.label, formatRange(junkSingle.range), junkSingle.hint],
            [junkQuarter.label, formatRange(junkQuarter.range), junkQuarter.hint],
            [junkHalf.label, formatRange(junkHalf.range), junkHalf.hint],
            [junkFull.label, formatRange(junkFull.range), junkFull.hint],
          ]}
        />
        <PriceTable
          caption={`Single-story gutters (before the ${MN_SALES_TAX} line)`}
          rows={[
            [gutterStd.label, formatRange(gutterStd.range), gutterStd.hint],
            [gutterComplex.label, formatRange(gutterComplex.range), gutterComplex.hint],
          ]}
        />
        <p>
          ${DEPOSIT} on the card holds the day and comes off the invoice, same as Grand Forks. Full details on each
          service:{" "}
          <Link to="/leaf-cleanup-grand-forks" className="underline underline-offset-4 hover:text-gold">
            leaf cleanup
          </Link>
          ,{" "}
          <Link to="/junk-removal-grand-forks" className="underline underline-offset-4 hover:text-gold">
            junk removal
          </Link>
          ,{" "}
          <Link to="/gutter-cleaning-grand-forks" className="underline underline-offset-4 hover:text-gold">
            gutters
          </Link>
          .
        </p>
      </Block>

      <Block title="Working around Fall Cleanup week">
        <p>
          East Grand Forks does something Grand Forks doesn't: one week each fall the city picks up bulky items at
          the curb for free. In 2026 that's October 5–9. If you have a couch and a Saturday, drag it out and let the
          city take it. We mean that.
        </p>
        <p>
          What we sell is everything around that week. The things the city won't take. The stuff that can't get to
          the curb because it's in the basement or the garage rafters or a second-floor unit. The pile that shows up
          two weeks later when the tenant finally moves out. And leaves — Fall Cleanup is for bulky items, and the
          trees on The Point are still full on October 9.
        </p>
        <p>
          The rest of the year the city hauls furniture and appliances curbside for a per-item fee. If your item is
          already outside and you're not in a hurry, that beats us. If it's inside, heavy, or you want it gone on a
          day you pick, that's the job we're built for.
        </p>
      </Block>

      <Block title="Where the truck goes in EGF">
        <p>
          The Point and Sherlock Park have the big old trees and the long lots — that's leaf country, and it's where
          the block deal earns its keep: two houses on one street the same day take ${block2.credit} off each, three
          or more take ${block3.credit}. The apartments and rentals off Central Avenue and DeMers are turn-and-haul
          work; landlords with several units in one week should look at the{" "}
          <Link to="/landlords" className="underline underline-offset-4 hover:text-gold">
            landlord packs
          </Link>
          . Out by the Boardwalk and Cabela's and along the campground edge of the Red River State Recreation Area
          it's mostly gutters and one-off hauls.
        </p>
        <p>
          Whatever we pick up in East Grand Forks rides back across the bridge with us: leaves to the Grand Forks
          yard-waste site, junk across the landfill scale, metal to the scrap yard. One truck, one route, both towns.
        </p>
      </Block>
    </ServicePage>
  );
}
