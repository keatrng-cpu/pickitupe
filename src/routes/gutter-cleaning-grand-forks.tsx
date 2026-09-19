import { createFileRoute, Link } from "@tanstack/react-router";
import { Block, PriceTable, ServicePage, type Faq } from "@/components/service-page";
import { addOnsFor, DEPOSIT, formatRange, PLAN_FALL_GUTTERS, sizeOptionsFor } from "@/lib/pricebook";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /gutter-cleaning-grand-forks — single-story only, from the ground, with a
 * 120V gutter vacuum. The no-ladder rule is the product; say it plainly and
 * hand two-story work off. Ranges: GUTTER_SIZES + the leaf-stop bundle rates.
 */

const PATH = "/gutter-cleaning-grand-forks";
const TITLE = "Single-Story Gutter Cleaning in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Gutter cleaning for single-story homes in Grand Forks and East Grand Forks — from the ground with a 120V gutter vacuum, no ladder on your siding. Standalone or added to a leaf stop.";

const sizes = sizeOptionsFor("gutter-cleaning");
const standard = sizes.find((s) => s.value === "standard")!;
const complex = sizes.find((s) => s.value === "complex")!;
const downspout = addOnsFor("gutter-cleaning").find((a) => a.key === "downspout")!;
const leafAddOns = addOnsFor("leaf-cleanup");
const withLeaves = leafAddOns.find((a) => a.key === "gutters-here")!;
const withLeavesWrap = leafAddOns.find((a) => a.key === "gutters-wrap")!;

const FAQS: Faq[] = [
  {
    q: "Why single-story only?",
    a: "Because we don't put a ladder on your house. The gutter vacuum reaches a single-story eave from the ground, which means nobody is standing on your siding, your flower bed or a wet rung in November. Two-story? We'll tell you straight and hand you off to someone with the rig for it.",
  },
  {
    q: "What does gutter cleaning cost?",
    a: `A standard ranch or rambler is ${formatRange(standard.range)}. Long runs, several corners, a wraparound or a split level is ${formatRange(complex.range)}. If we're already at your house for leaves, ranch gutters drop to ${formatRange(withLeaves.range)} because the trip is paid.`,
  },
  {
    q: "Do you flush the downspouts?",
    a: `When they need it. Clearing the trough and clearing a plugged downspout are different jobs — a downspout gets flushed and sometimes snaked, and skipping it is where the overflow callback comes from. It's a ${formatRange(downspout.range)} add-on per visit, not per downspout.`,
  },
  {
    q: "When is the right time to do it?",
    a: "After the trees are mostly bare and before the debris freezes solid — in Grand Forks that's late October through the third week of November most years. Once the gutters are a frozen brick we stop until spring. Book the leaf visit and the gutters in one stop and the timing takes care of itself.",
  },
  {
    q: "What do you do with what comes out?",
    a: "It goes in the bed with the leaves and out to the yard-waste site at 724 N 47th St. We don't leave a pile of black mush on your lawn or in your downspout splash blocks.",
  },
];

export const Route = createFileRoute("/gutter-cleaning-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      image: "/work/leaves-rake.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Single-story gutter cleaning",
          serviceType: "Gutter cleaning",
          description: DESCRIPTION,
          path: PATH,
          priceLow: withLeaves.range.low,
          priceHigh: complex.range.high,
          image: "/work/leaves-rake.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "Gutter cleaning"),
      ],
    }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      kicker="Gutter cleaning · single-story · Grand Forks"
      title={
        <>
          Gutters cleared from the ground.
          <br />
          No ladder on your siding.
        </>
      }
      intro={
        <>
          <p>
            A 120V gutter vacuum on a pole pulls the leaves, seed pods and roof grit out of a single-story gutter
            while both of our feet stay on your lawn. It's quieter than it sounds, it doesn't dent the trough, and
            nothing gets flung onto the house.
          </p>
          <p className="mt-3">
            Standalone, or added to your leaf stop for less. Two stories is a different job with different gear —
            we'll say so and point you at someone who does it.
          </p>
        </>
      }
      cta={{ service: "gutter-cleaning", size: "standard", label: "Price my gutters" }}
      photos={[
        { src: "/work/leaves-rake.jpg", alt: "Crew raking a leaf pile toward the pickup on a single-story Grand Forks home" },
        { src: "/work/leaves-lot.jpg", alt: "Pickup bed heaped with leaves and gutter debris headed to the yard-waste site" },
        { src: "/haul-junk-poster.jpg", alt: "Two-person crew loading leaves and debris into the pickup" },
      ]}
      faqs={FAQS}
    >
      <Block title="What it costs">
        <p>
          Two sizes, because a single-story roofline is either simple or it isn't. The number is the trough and the
          dump run; the downspout flush is separate so you only pay for it when a downspout is actually slow.
        </p>
        <PriceTable
          caption="Gutter cleaning, standalone visit"
          rows={[
            [standard.label, formatRange(standard.range), standard.hint],
            [complex.label, formatRange(complex.range), complex.hint],
            [downspout.label, formatRange(downspout.range), downspout.hint],
          ]}
        />
        <PriceTable
          caption="Added to a leaf stop (trip already paid)"
          rows={[
            ["Ranch, one story", formatRange(withLeaves.range), withLeaves.hint],
            ["Wraparound or split level", formatRange(withLeavesWrap.range), withLeavesWrap.hint],
            ["Fall visit on the two-visit plan", formatRange(PLAN_FALL_GUTTERS), "Billed with the year"],
          ]}
        />
        <p>
          ${DEPOSIT} on the card holds the day and comes off the invoice. The pre-season percent applies to the leaf
          base, not to the gutter add-on — it's already the discounted trip rate.
        </p>
      </Block>

      <Block title="Why the ground rule">
        <p>
          Most gutter damage in this town isn't from ice; it's from a ladder foot hooked over the front lip. The
          vacuum head rides inside the trough on a pole, so the gutter never carries weight and the fascia never
          takes a ladder rail. No ladder also means no one on a frosted rung in November, which is the reason we can
          send two people to a job and still be home for supper.
        </p>
        <p>
          The trade is reach. A single-story eave is comfortably inside the pole's range; a second story isn't, and
          we won't pretend a longer pole makes it safe or clean. When your house is two stories, or the back drops
          to a walk-out basement, we'll tell you before we book it and hand you a name.
        </p>
      </Block>

      <Block title="Timing it with the leaves">
        <p>
          Gutters fill on the same schedule the yard does: the first hard freeze around October 6 drops most of
          the canopy, the second wave comes after the first real wind, and by the third week of November what's in
          the trough is frozen to it. Do it too early and you're back in three weeks; too late and it waits for
          April.
        </p>
        <p>
          The clean answer is one stop. We rake the yard first, then run the gutters while the bed is already open
          and the truck is already in your driveway — that's why the add-on rate is lower than the standalone visit.
          Book leaves, tick the gutter box, done. On the{" "}
          <Link to="/plan" className="underline underline-offset-4 hover:text-gold">
            two-visit plan
          </Link>{" "}
          the fall gutter pass is billed with the year at the same-stop rate.
        </p>
      </Block>
    </ServicePage>
  );
}
