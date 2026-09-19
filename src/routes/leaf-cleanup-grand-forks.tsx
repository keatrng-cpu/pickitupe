import { createFileRoute, Link } from "@tanstack/react-router";
import { Block, PriceTable, ServicePage, type Faq } from "@/components/service-page";
import {
  addOnsFor,
  BLOCK_TIERS,
  DEPOSIT,
  formatRange,
  LEAF_KSF,
  PROMO_CAP,
  PROMO_DEADLINE_LABEL,
  PROMO_PERCENT,
  sizeOptionsFor,
} from "@/lib/pricebook";
import { breadcrumbJsonLd, faqJsonLd, NEIGHBORHOODS, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /leaf-cleanup-grand-forks — the page that should rank for "leaf removal
 * Grand Forks". Every dollar figure below is computed from pricebook.ts; the
 * only hand-typed numbers are the city's (vacuum dates, the Public Works line).
 */

const PATH = "/leaf-cleanup-grand-forks";
const TITLE = "Leaf Cleanup & Removal in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Fall leaf cleanup in Grand Forks and East Grand Forks — we rake, blow, tarp and haul before the city vacuum runs. Priced by the lot, range before you book, no bags for you.";

const sizes = sizeOptionsFor("leaf-cleanup");
const bySize = (v: string) => sizes.find((s) => s.value === v)!;
const addOns = addOnsFor("leaf-cleanup");
const addOn = (k: string) => addOns.find((a) => a.key === k)!;

const small = bySize("small");
const medium = bySize("medium");
const large = bySize("large");
const half = bySize("half");
const acre = bySize("acre");
const gutters = addOn("gutters-here");
const guttersWrap = addOn("gutters-wrap");
const porch = addOn("porch-piece");
const bagging = addOn("bagging");
const wet = addOn("wet-heavy");

const promoPct = Math.round(PROMO_PERCENT * 100);
const block2 = BLOCK_TIERS[0];
const block3 = BLOCK_TIERS[1];

const FAQS: Faq[] = [
  {
    q: "Do I have to bag the leaves first?",
    a: "No. Leave them where they fell. We rake, blow, tarp and load — you never touch a bag. If you already piled them, that's fine too, and it usually lands you at the low end of your range.",
  },
  {
    q: "What does leaf cleanup cost on a normal Grand Forks lot?",
    a: `A standard lot (about 7,500 sq ft, front and back) runs ${formatRange(medium.range)}. A small lot with one or two trees is ${formatRange(small.range)}; a large corner lot with mature trees is ${formatRange(large.range)}. That's roughly $${LEAF_KSF.city.low}–$${LEAF_KSF.city.high} per 1,000 sq ft of lot. You see the range before you book and we confirm the number before we start.`,
  },
  {
    q: "Should I wait for the city leaf vacuum instead?",
    a: "You can, if your leaves are down before your street's week and you can get them loose to within 3 ft of the curb. The vacuum usually starts the third week of October and works route by route into mid-November. Most people who call us either miss their week, have more than a curb pile, or want the back yard done too. Check your route with Public Works at 701-738-8740.",
  },
  {
    q: "Can you clean the gutters while you're here?",
    a: `Yes, single-story only. We work from the ground with a 120V gutter vacuum — no ladder on your siding. Ranch gutters add ${formatRange(gutters.range)} on a leaf stop because the trip is already paid; a wraparound or split level is ${formatRange(guttersWrap.range)}. Two-story? We'll tell you straight and hand you off.`,
  },
  {
    q: "How does the neighbor deal work?",
    a: `Two houses on one street, same day: $${block2.credit} off each. Three or more: $${block3.credit} off each. It never stacks with the pre-season promo — you get whichever is bigger.`,
  },
  {
    q: "What if it snows before you get here?",
    a: `We still come. Wet, matted or snow-packed leaves take longer to lift, so that's a ${formatRange(wet.range)} add-on. Book before the first hard freeze drops everything at once and you skip it.`,
  },
];

export const Route = createFileRoute("/leaf-cleanup-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      image: "/work/leaves-lot.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Fall leaf cleanup and removal",
          serviceType: "Leaf removal",
          description: DESCRIPTION,
          path: PATH,
          priceLow: small.range.low,
          priceHigh: acre.range.high,
          image: "/work/leaves-lot.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "Leaf cleanup"),
      ],
    }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      kicker="Leaf cleanup · Grand Forks & East Grand Forks"
      title={
        <>
          Leaves gone before the city vacuum.
          <br />
          You never touch a bag.
        </>
      }
      intro={
        <>
          <p>
            Fall in Grand Forks is three good weeks between the first hard freeze and the first inch of snow.
            Our pickup, two people, rakes and blowers and a tarp: we clear the front, the back and the boulevard,
            haul it to the yard-waste site, and you get your Saturday back.
          </p>
          <p className="mt-3">
            Priced by the lot, not by the hour. Pick your yard size and you get the range on the spot; we confirm the
            number before the first rake hits the grass.
          </p>
        </>
      }
      cta={{ service: "leaf-cleanup", size: "medium", label: "Get my leaf price" }}
      photos={[
        { src: "/work/leaves-rake.jpg", alt: "Two-person crew raking a leaf pile toward the pickup on a Grand Forks lawn" },
        { src: "/work/leaves-lot.jpg", alt: "Pickup bed heaped with fall leaves, strapped for the haul to the yard-waste site" },
        { src: "/haul-junk-poster.jpg", alt: "Crew loading a leaf-filled tarp and a junk pile into the same truck" },
      ]}
      faqs={FAQS}
    >
      <Block title="What a leaf job costs">
        <p>
          The first {LEAF_KSF.city.upTo.toLocaleString()} square feet of a city lot run about ${LEAF_KSF.city.low}–$
          {LEAF_KSF.city.high} per 1,000 sq ft, house footprint included. The truck, the dump run and the first hour are
          the real cost, so a small lot isn't half the price of a standard one. Past a quarter acre the rate per foot
          drops because the crew is already there.
        </p>
        <p>
          Two products live inside every range. The low end is a rake-to-the-curb during your street's vacuum week:
          we pile it loose within 3 ft of the curb and the city takes it. The high end is the full tarp-and-haul, any
          week, back yard included, nothing left for the city.
        </p>
        <PriceTable
          caption="Leaf cleanup by lot size"
          rows={[
            [small.label, formatRange(small.range), small.hint],
            [medium.label, formatRange(medium.range), medium.hint],
            [large.label, formatRange(large.range), large.hint],
            [half.label, formatRange(half.range), half.hint],
            [acre.label, formatRange(acre.range), acre.hint],
          ]}
        />
        <PriceTable
          caption="Same-stop extras (trip already paid)"
          rows={[
            [gutters.label, formatRange(gutters.range), gutters.hint],
            [guttersWrap.label, formatRange(guttersWrap.range), guttersWrap.hint],
            [porch.label, formatRange(porch.range), porch.hint],
            [bagging.label, formatRange(bagging.range), bagging.hint],
            [wet.label, formatRange(wet.range), wet.hint],
          ]}
        />
        <p>
          ${DEPOSIT} on the card holds your day and comes off the invoice. Book by {PROMO_DEADLINE_LABEL} and the rate
          drops {promoPct}% (up to ${PROMO_CAP}) — that locks the price, not the date, because the leaves aren't down
          yet.
        </p>
      </Block>

      <Block title="Timing it around the city">
        <p>
          Grand Forks runs a leaf vacuum every fall, and it's a good program. It has started October 17, 23, 21 and
          20 in the last four years, then works street by street until roughly mid-November. Leaves have to be loose,
          within 3 ft of the curb, out of the street and never bagged. If yours are down in time and you can get them
          there, use it.
        </p>
        <p>
          The trouble is the calendar. The first hard freeze lands around October 6 and drops most of the canopy at
          once; the median first inch of snow is November 8. That leaves a window where the elms on Reeves Drive and
          the maples in Lincoln Park all let go the same week, and the vacuum can only be on one street at a time. We
          fill the gap: before your week when you want it gone now, or after it when the second drop comes and the
          truck has already been through.
        </p>
        <p>
          Everything we haul goes to the city's yard-waste site at 724 N 47th St. Nothing ends up in the landfill
          and nothing ends up in your alley.
        </p>
      </Block>

      <Block title="Where we work">
        <p>
          Door hangers this fall are going to {NEIGHBORHOODS.slice(0, -1).join(", ")} and {NEIGHBORHOODS.at(-1)}.
          We run the rest of Grand Forks, East Grand Forks, the Air Force Base, Emerado, Thompson and Manvel on the
          same board — pick a day and the truck comes.
        </p>
        <p>
          Neighbors on one street the same day: ${block2.credit} off each for two houses, ${block3.credit} off each for
          three or more. One trip, one dump run, and everyone pays less. It doesn't stack with the pre-season promo;
          you get the bigger of the two.
        </p>
        <p>
          Want it handled every year without thinking about it? The{" "}
          <Link to="/plan" className="underline underline-offset-4 hover:text-gold">
            two-visit plan
          </Link>{" "}
          books a fall and a spring pass up front.
        </p>
      </Block>
    </ServicePage>
  );
}
