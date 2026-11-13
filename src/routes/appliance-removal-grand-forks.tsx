import { createFileRoute, Link } from "@tanstack/react-router";
import { Block, PriceTable, ServicePage, type Faq } from "@/components/service-page";
import { addOnsFor, DEPOSIT, formatRange, sizeOptionsFor } from "@/lib/pricebook";
import { breadcrumbJsonLd, faqJsonLd, pageHead, serviceJsonLd } from "@/lib/seo";

/**
 * /appliance-removal-grand-forks — "appliance removal Grand Forks", "fridge
 * pickup", "old washer haul away". Same pricebook as junk removal: an
 * appliance is the "A few pieces" rung (fridge / washer / stove aliases), a
 * refrigerant unit carries the freon add-on. Nothing here is typed by hand.
 */

const PATH = "/appliance-removal-grand-forks";
const TITLE = "Appliance Removal & Fridge Pickup in Grand Forks, ND | Pick It Up E";
const DESCRIPTION =
  "Old fridge, freezer, washer, dryer or stove hauled away in Grand Forks and East Grand Forks. Carried out of the basement or kitchen, priced before you book.";

const sizes = sizeOptionsFor("junk-removal");
const bySize = (v: string) => sizes.find((s) => s.value === v)!;
const addOns = addOnsFor("junk-removal");
const addOn = (k: string) => addOns.find((a) => a.key === k)!;

const appliance = bySize("appliance");
const fridge = bySize("fridge");
const few = bySize("quarter");
const half = bySize("half");
const freon = addOn("appliance-freon");
const stairs = addOn("stairs");
const longCarry = addOn("long-carry");

const fridgeLow = fridge.range.low + freon.range.low;
const fridgeHigh = fridge.range.high + freon.range.high;

const FAQS: Faq[] = [
  {
    q: "How much to haul away a refrigerator?",
    a: `${formatRange(fridge.range)} for the fridge, plus ${formatRange(freon.range)} if it still has refrigerant, so ${formatRange({ low: fridgeLow, high: fridgeHigh })} all in. Empty it and unplug it the night before.`,
  },
  {
    q: "Washer, dryer or stove?",
    a: `${formatRange(appliance.range)} for one, carried out. A matched washer and dryer is the same "a few pieces" rung, ${formatRange(few.range)}.`,
  },
  {
    q: "It's in the basement. Is that a problem?",
    a: `No. Stairs or a basement carry adds ${formatRange(stairs.range)}. Two people, a dolly and straps.`,
  },
  {
    q: "Do I need to disconnect it?",
    a: "Unplug it and shut the water off on a washer. Gas stoves need the gas shut off and capped by you or a plumber before we move it.",
  },
];

export const Route = createFileRoute("/appliance-removal-grand-forks")({
  head: () =>
    pageHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      image: "/work/fridge-stairs.jpg",
      jsonLd: [
        serviceJsonLd({
          name: "Appliance removal",
          serviceType: "Appliance removal",
          description: DESCRIPTION,
          path: PATH,
          priceLow: appliance.range.low,
          priceHigh: half.range.high,
          image: "/work/fridge-stairs.jpg",
        }),
        faqJsonLd(FAQS),
        breadcrumbJsonLd(PATH, "Appliance removal"),
      ],
    }),
  component: Page,
});

function Page() {
  return (
    <ServicePage
      kicker="Appliance removal · Grand Forks & East Grand Forks"
      title={
        <>
          The old fridge in the basement.
          <br />
          Gone, and you never touched it.
        </>
      }
      intro={
        <p>
          New one coming? We carry the old fridge, freezer, washer, dryer or stove out of wherever it sits, load it and
          drop it where it belongs. Refrigerant units are handled as refrigerant units. You see the price before you book.
        </p>
      }
      cta={{ service: "junk-removal", size: "quarter", label: "Price my appliance" }}
      photos={[
        { src: "/work/fridge-stairs.jpg", alt: "Refrigerator being carried up a flight of stairs on a dolly" },
        { src: "/work/empty-unit.jpg", alt: "Empty rental unit after the appliances and furniture were hauled out" },
        { src: "/work/couch-bed.jpg", alt: "Furniture loaded and strapped in the pickup bed" },
      ]}
      faqs={FAQS}
    >
      <Block title="What it costs">
        <PriceTable
          caption="Appliance removal"
          rows={[
            [appliance.label, formatRange(appliance.range), appliance.hint],
            [fridge.label, formatRange(fridge.range), fridge.hint],
            [freon.label, formatRange(freon.range), "Added only if it still has refrigerant"],
            [few.label, formatRange(few.range), "A washer and dryer pair, or an appliance plus a piece"],
            [half.label, formatRange(half.range), "Kitchen or laundry room cleared out"],
          ]}
        />
        <PriceTable
          caption="Add-ons, only when they apply"
          rows={[
            [stairs.label, formatRange(stairs.range), stairs.hint],
            [longCarry.label, formatRange(longCarry.range), longCarry.hint],
          ]}
        />
        <p>${DEPOSIT} on the card holds the day and comes off the invoice.</p>
      </Block>
      <Block title="More than appliances?">
        <p>
          Add the couch and the boxes and it&apos;s a{" "}
          <Link to="/junk-removal-grand-forks" className="underline underline-offset-4 hover:text-gold">
            junk removal
          </Link>{" "}
          load, priced by the bed. Clearing a whole house? That&apos;s an{" "}
          <Link to="/estate-cleanout-grand-forks" className="underline underline-offset-4 hover:text-gold">
            estate cleanout
          </Link>{" "}
          with a free walkthrough.
        </p>
      </Block>
    </ServicePage>
  );
}
