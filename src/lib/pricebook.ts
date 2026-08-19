/**
 * Pick It Up E — flat-rate pricebook and instant estimator.
 *
 * Every number here is a **local starting range the owner calibrates**, not a
 * quoted price. Structure borrowed from the E&E flat-rate pricebook: one range
 * per line item, trip + labor + haul included, add-ons stated separately, and
 * a hard "stop and re-quote if scope changes" rule.
 *
 * Deterministic on purpose — same answers every time, no API key, no model, no
 * network. The customer sees a number in under a second and the owner can
 * defend every dollar of it.
 *
 * PRICING POSITION: every tier sits under a named local comparable — see
 * PRICEBOOK.md for the benchmarks and their sources. Undercut, don't race to
 * the bottom: the cheapest bid in a trade nobody licenses reads as the least
 * reliable one.
 *
 * TO RE-PRICE: edit the tables below. Nothing else reads raw numbers.
 */

export const DEPOSIT = 50;

/**
 * Fall pre-season promo — replaces the old count-based "first 25 bookings"
 * cap. Two reasons:
 *
 * 1. A calendar date is verifiable by anyone; an unproven "spots left"
 *    counter on a brand-new site with zero completed jobs is not — it reads
 *    as fake scarcity to a skeptical visitor.
 * 2. It decouples the discount from leaf season. Grand Forks leaves aren't
 *    down by this date (city vacuum runs mid-Oct to mid-Nov), so this locks
 *    the RATE and the DEPOSIT now — it is not a promise the truck shows up
 *    by the deadline. `isPromoActive` gates booking eligibility, not service
 *    timing.
 *
 * Percent-with-a-cap on purpose, not a flat dollar amount: a flat discount
 * disproportionately crushes the cheapest tier (see FLOOR below) and
 * undershoots on the priciest one. Percent scales with the job; the cap
 * keeps a single acreage quote from giving away an unbounded amount.
 */
export const PROMO_PERCENT = 0.2;
export const PROMO_CAP = 75;
export const PROMO_DEADLINE_LABEL = "September 20";
/** 2026-09-20 23:59:59 America/Chicago (CDT, UTC-5 in September). */
export const PROMO_DEADLINE = new Date("2026-09-21T05:00:00.000Z");

export function isPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < PROMO_DEADLINE.getTime();
}

/** Never below this after discounts — a truck roll costs money. */
const FLOOR = 55;

export type Range = { low: number; high: number };

export type ServiceKey =
  | "leaf-cleanup"
  | "junk-removal"
  | "garage-basement"
  | "furniture-appliances"
  | "single-item"
  | "other";

export type SizeOption = {
  value: string;
  label: string;
  hint: string;
  range: Range;
};

/**
 * Leaf cleanup — rake, blow, bag, haul. Sized by lot, because that is what a
 * homeowner can answer without measuring anything.
 */
const LEAF_SIZES: SizeOption[] = [
  {
    value: "small",
    label: "Small city lot",
    hint: "One or two trees, light cover",
    range: { low: 95, high: 155 },
  },
  {
    value: "medium",
    label: "Standard lot",
    hint: "Full cover, front and back",
    range: { low: 145, high: 245 },
  },
  {
    value: "large",
    label: "Large / corner lot",
    hint: "Heavy cover, mature trees",
    range: { low: 245, high: 395 },
  },
  {
    value: "acreage",
    label: "Acreage or tree-heavy",
    hint: "We walk it first, then quote",
    range: { low: 395, high: 650 },
  },
];

/**
 * Haul work — sized by how much of the truck bed it fills. Silver Sierra 1500
 * crew cab, so a heaped "full load" is roughly two cubic yards.
 */
const LOAD_SIZES: SizeOption[] = [
  {
    value: "single",
    label: "One item",
    hint: "Couch, mattress, treadmill",
    range: { low: 59, high: 95 },
  },
  {
    value: "quarter",
    label: "Quarter load",
    hint: "A pickup corner — a few pieces",
    range: { low: 85, high: 130 },
  },
  {
    value: "half",
    label: "Half load",
    hint: "Half the bed, heaped",
    range: { low: 125, high: 195 },
  },
  {
    value: "full",
    label: "Full load",
    hint: "Bed full and strapped",
    range: { low: 175, high: 265 },
  },
];

/** Cleanouts price like haul work plus sort-and-carry labor. */
const CLEANOUT_LABOR: Range = { low: 50, high: 100 };

export function sizeOptionsFor(service: ServiceKey): SizeOption[] {
  if (service === "leaf-cleanup") return LEAF_SIZES;
  if (service === "single-item" || service === "furniture-appliances") {
    return LOAD_SIZES.slice(0, 3);
  }
  return LOAD_SIZES;
}

export type AddOnKey =
  | "bagging"
  | "stairs"
  | "long-carry"
  | "appliance-freon"
  | "wet-heavy";

export const ADD_ONS: {
  key: AddOnKey;
  label: string;
  hint: string;
  range: Range;
  appliesTo: ServiceKey[] | "all";
}[] = [
  {
    key: "bagging",
    label: "Leaves aren't curb-ready",
    hint: "We rake and bag from scratch",
    range: { low: 35, high: 70 },
    appliesTo: ["leaf-cleanup"],
  },
  {
    key: "wet-heavy",
    label: "Wet or matted leaves",
    hint: "Snow-packed or rained-in piles",
    range: { low: 30, high: 60 },
    appliesTo: ["leaf-cleanup"],
  },
  {
    key: "stairs",
    label: "Stairs or basement carry",
    hint: "Anything not at ground level",
    range: { low: 30, high: 60 },
    appliesTo: ["junk-removal", "garage-basement", "furniture-appliances", "single-item"],
  },
  {
    key: "long-carry",
    label: "Long carry",
    hint: "More than about 75 ft to the truck",
    range: { low: 20, high: 40 },
    appliesTo: "all",
  },
  {
    key: "appliance-freon",
    label: "Fridge, freezer, or AC",
    hint: "Refrigerant units cost extra to drop",
    range: { low: 25, high: 45 },
    appliesTo: ["junk-removal", "garage-basement", "furniture-appliances", "single-item"],
  },
];

export function addOnsFor(service: ServiceKey) {
  return ADD_ONS.filter(
    (a) => a.appliesTo === "all" || a.appliesTo.includes(service),
  );
}

/**
 * Loads we turn down. Straight from the door hanger — keep this list and the
 * printed card identical.
 */
export const REFUSED = [
  "paint",
  "chemicals",
  "oil",
  "propane",
  "concrete",
  "dirt",
  "roofing",
  "asbestos",
] as const;

/** Free-text scan so the estimator warns before the truck is dispatched. */
export function refusedItemsIn(text: string): string[] {
  const t = (text || "").toLowerCase();
  return REFUSED.filter((word) => t.includes(word));
}

export type EstimateInput = {
  service: ServiceKey;
  size: string;
  addOns: AddOnKey[];
  earlyBird: boolean;
  notes?: string;
};

export type Estimate = {
  /** Null when the job genuinely needs eyes on it before any number. */
  range: Range | null;
  /** Range before the early-bird credit, for showing the strike-through. */
  beforeDiscount: Range | null;
  discount: number;
  deposit: number;
  lines: { label: string; range: Range }[];
  notes: string[];
  refused: string[];
  needsWalkthrough: boolean;
};

function add(a: Range, b: Range): Range {
  return { low: a.low + b.low, high: a.high + b.high };
}

/** 20% off each end of the range, capped at $75, floored at $55. */
function applyPromo(range: Range): Range {
  const cut = (n: number) => Math.min(n * PROMO_PERCENT, PROMO_CAP);
  return {
    low: Math.max(FLOOR, Math.round(range.low - cut(range.low))),
    high: Math.max(FLOOR, Math.round(range.high - cut(range.high))),
  };
}

export function estimate(input: EstimateInput): Estimate {
  const sizes = sizeOptionsFor(input.service);
  const size = sizes.find((s) => s.value === input.size) ?? sizes[0];
  const lines: { label: string; range: Range }[] = [];
  const notes: string[] = [];

  let total: Range = { low: 0, high: 0 };

  if (input.service === "other") {
    return {
      range: null,
      beforeDiscount: null,
      discount: 0,
      deposit: DEPOSIT,
      lines: [],
      notes: [
        "Tell us what it is and we'll price it the same day — call or text 218-779-2553.",
      ],
      refused: refusedItemsIn(input.notes ?? ""),
      needsWalkthrough: true,
    };
  }

  lines.push({ label: size.label, range: size.range });
  total = add(total, size.range);

  if (input.service === "garage-basement") {
    lines.push({ label: "Sort & carry labor", range: CLEANOUT_LABOR });
    total = add(total, CLEANOUT_LABOR);
  }

  const available = addOnsFor(input.service);
  for (const key of input.addOns) {
    const addOn = available.find((a) => a.key === key);
    if (!addOn) continue;
    lines.push({ label: addOn.label, range: addOn.range });
    total = add(total, addOn.range);
  }

  const beforeDiscount = total;
  const discounted = input.earlyBird ? applyPromo(total) : total;
  // Dollars saved at the top of the range — the number worth putting in a
  // text message. The bottom of the range can save proportionally less (or
  // nothing, once the floor clamps it) — that's intentional, not a bug.
  const discount = input.earlyBird
    ? beforeDiscount.high - discounted.high
    : 0;

  const needsWalkthrough = size.value === "acreage";
  if (needsWalkthrough) {
    notes.push(
      "Acreage gets a free walk-through first — the range above is a starting point, not the quote.",
    );
  }
  if (discount > 0) {
    notes.push(
      `Book by ${PROMO_DEADLINE_LABEL} to lock this rate — ${Math.round(PROMO_PERCENT * 100)}% off (up to $${PROMO_CAP}) is already taken off this range.`,
    );
  }
  notes.push(
    `$${DEPOSIT} deposit holds your date and comes off the final invoice.`,
  );
  notes.push(
    "If the pile turns out bigger than described, we stop and re-quote before we load anything.",
  );

  return {
    range: discounted,
    beforeDiscount,
    discount,
    deposit: DEPOSIT,
    lines,
    notes,
    refused: refusedItemsIn(input.notes ?? ""),
    needsWalkthrough,
  };
}

export function formatRange(r: Range): string {
  return `$${r.low}–$${r.high}`;
}
