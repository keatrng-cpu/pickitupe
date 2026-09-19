import { createFileRoute, Link } from "@tanstack/react-router";
import { Block, PriceTable, ServicePage, type Faq } from "@/components/service-page";
import { addOnsFor, BLOCK_MIN_JOB_LOW, BLOCK_TIERS, DEPOSIT, formatRange, REFUSED, sizeOptionsFor } from "@/lib/pricebook";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /junk-removal-grand-forks — "junk removal Grand Forks", "furniture removal",
 * "appliance pickup". Priced by the truck bed; ranges come from LOAD_SIZES.
 * Landfill / city numbers are the city's own published rates.
 */

const PATH = "/junk-removal-grand-forks";
const TITLE = "Junk Removal & Furniture Hauling in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Junk, furniture and appliance removal in Grand Forks and East Grand Forks. Priced by the truck bed, range before you book, carried from the basement — curbside not required.";

const sizes = sizeOptionsFor("junk-removal");
const bySize = (v: string) => sizes.find((s) => s.value === v)!;
const addOns = addOnsFor("junk-removal");
const addOn = (k: string) => addOns.find((a) => a.key === k)!;

const bags = bySize("bags");
const single = bySize("single");
const quarter = bySize("quarter");
const halfBed = bySize("half");
const full = bySize("full");
const overflow = bySize("overflow");
const stairs = addOn("stairs");
const cleanout = addOn("cleanout");
const freon = addOn("appliance-freon");
const longCarry = addOn("long-carry");

const refusedList = `${REFUSED.slice(0, -1).join(", ")} or ${REFUSED.at(-1)}`;
const block2 = BLOCK_TIERS[0];

const FAQS: Faq[] = [
  {
    q: "How is junk removal priced?",
    a: `By how much of the truck bed it fills, not by the hour. One piece — a couch, a mattress, a dresser, one appliance — is ${formatRange(single.range)}. Half the bed heaped is ${formatRange(halfBed.range)}; a full, strapped load is ${formatRange(full.range)}. You pick the closest chip, see the range, and we confirm the number when we see the pile.`,
  },
  {
    q: "Does it have to be at the curb?",
    a: `No. We carry from the basement, the garage or the third-floor apartment. Stairs or a basement carry add ${formatRange(stairs.range)}; a walk longer than about 75 ft to the truck adds ${formatRange(longCarry.range)}. Curbside is fine too — it just lands you at the low end.`,
  },
  {
    q: "Can you take a refrigerator or freezer?",
    a: `Yes. Refrigerant units cost more to drop, so a fridge, freezer or AC unit carries a ${formatRange(freon.range)} add-on. Empty it and unplug it the night before so it's dry when we lift it.`,
  },
  {
    q: "What won't you take?",
    a: `${refusedList[0].toUpperCase()}${refusedList.slice(1)}. Everything else in a normal house, garage or basement pile is fine — furniture, appliances, boxes, bags, yard debris, scrap metal, mattresses, the exercise bike.`,
  },
  {
    q: "Where does it go?",
    a: "Household junk goes to the Grand Forks landfill at 2701 N 69th St, yard debris to the yard-waste site at 724 N 47th St, and metal to a scrap yard. We sort it in the bed so the dump fee stays low and your price does too.",
  },
  {
    q: "Do you do whole-house or estate cleanouts?",
    a: `Our full bed is about 2.5 cubic yards, so a whole house is several trips. We'll walk it first, quote it as a garage or basement cleanout (${formatRange(cleanout.range)} of sort-and-carry labor on top of the load) and tell you honestly if it's a dumpster job instead.`,
  },
];

export const Route = createFileRoute("/junk-removal-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      image: "/work/couch-bed.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Junk, furniture and appliance removal",
          serviceType: "Junk removal",
          description: DESCRIPTION,
          path: PATH,
          priceLow: bags.range.low,
          priceHigh: overflow.range.high,
          image: "/work/couch-bed.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "Junk removal"),
      ],
    }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      kicker="Junk removal · Grand Forks & East Grand Forks"
      title={
        <>
          The couch, the fridge, the pile in the garage.
          <br />
          Priced by the truck bed.
        </>
      }
      intro={
        <>
          <p>
            One pickup, two people, a dolly and straps. We come to where the stuff actually is — the basement, the
            back bedroom, the rental after the tenant left — load it, sort it in the bed, and drop it where it belongs.
            You don't drag anything to the curb and you don't rent a dumpster for one couch.
          </p>
          <p className="mt-3">
            Pick the chip that looks like your pile and the range shows up before you give us a name. The number is
            confirmed when we see it, before anything gets lifted.
          </p>
        </>
      }
      cta={{ service: "junk-removal", size: "single", label: "Price my haul" }}
      photos={[
        { src: "/work/couch-bed.jpg", alt: "Couch loaded in the pickup bed, strapped down for the landfill run" },
        { src: "/work/fridge-stairs.jpg", alt: "Refrigerator being carried up a flight of stairs on a dolly" },
        { src: "/work/unit-haul.jpg", alt: "Contents of an emptied rental unit stacked in the pickup bed" },
      ]}
      faqs={FAQS}
    >
      <Block title="What a haul costs">
        <p>
          The bed is the unit. A franchise "truck load" is 13 to 18 cubic yards; ours is about 2.5, which is why our
          full load is roughly their quarter load — and why we win the small jobs. One item, a corner of the bed,
          half, full, or two trips. That's the whole ladder.
        </p>
        <PriceTable
          caption="Junk removal by load"
          rows={[
            [bags.label, formatRange(bags.range), bags.hint],
            [single.label, formatRange(single.range), single.hint],
            [quarter.label, formatRange(quarter.range), quarter.hint],
            [halfBed.label, formatRange(halfBed.range), halfBed.hint],
            [full.label, formatRange(full.range), full.hint],
            [overflow.label, formatRange(overflow.range), overflow.hint],
          ]}
        />
        <PriceTable
          caption="Add-ons, only when they apply"
          rows={[
            [stairs.label, formatRange(stairs.range), stairs.hint],
            [longCarry.label, formatRange(longCarry.range), longCarry.hint],
            [freon.label, formatRange(freon.range), freon.hint],
            [cleanout.label, formatRange(cleanout.range), cleanout.hint],
          ]}
        />
        <p>
          ${DEPOSIT} on the card holds the day and comes off the invoice. Two households on one street the same day
          take ${block2.credit} off each on hauls listing from ${BLOCK_MIN_JOB_LOW} up — a landlord turning two
          units, or you and the neighbor both clearing a garage.
        </p>
      </Block>

      <Block title="How this compares">
        <p>
          The city's special curbside pickup is a good deal if your stuff is already at the curb: a $48 minimum, then
          about a dollar a minute of crew time. It doesn't come inside. The Fargo franchises drive roughly 75 miles
          each way and price for a big box truck. A typical local hauler bills around $125 an hour.
        </p>
        <p>
          We're the one-couch, one-fridge, half-a-garage answer: a pickup that's already in town, two people who
          carry from wherever it sits, and a flat range you saw before you called. When a job is bigger than two
          trips we say so and point you at a dumpster.
        </p>
      </Block>

      <Block title="What we take, where it goes">
        <p>
          Furniture, mattresses, appliances, boxes and bags, garage and basement clear-outs, yard debris, scrap
          metal, the treadmill nobody uses. The landfill at 2701 N 69th St charges a $23 minimum and then by weight
          (about $59.54 a ton for household waste), so we sort in the bed: yard waste to 724 N 47th St, metal to a
          scrap yard, only the true garbage across the scale. That sorting is why a full load isn't priced like a
          full dumpster.
        </p>
        <p>
          We don't take {refusedList}. Those need a licensed handler, and we'll tell you who to call instead of
          driving off with them.
        </p>
        <p>
          Turning units this fall? The{" "}
          <Link to="/landlords" className="underline underline-offset-4 hover:text-gold">
            landlord packs
          </Link>{" "}
          price several stops in one week.
        </p>
      </Block>
    </ServicePage>
  );
}
