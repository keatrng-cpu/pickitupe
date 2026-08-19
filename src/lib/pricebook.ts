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
 * TO RE-PRICE: edit the tables below. Nothing else reads raw numbers.
 */

export const DEPOSIT = 50;
export const EARLY_BIRD_DISCOUNT = 50;

/** Never below this after discounts — a truck roll costs money. */
const FLOOR = 65;

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
    range: { low: 145, high: 225 },
  },
  {
    value: "medium",
    label: "Standard lot",
    hint: "Full cover, front and back",
    range: { low: 225, high: 375 },
  },
  {
    value: "large",
    label: "Large / corner lot",
    hint: "Heavy cover, mature trees",
    range: { low: 375, high: 575 },
  },
  {
    value: "acreage",
    label: "Acreage or tree-heavy",
    hint: "We walk it first, then quote",
    range: { low: 575, high: 900 },
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
    range: { low: 75, high: 135 },
  },
  {
    value: "quarter",
    label: "Quarter load",
    hint: "A pickup corner — a few pieces",
    range: { low: 135, high: 210 },
  },
  {
    value: "half",
    label: "Half load",
    hint: "Half the bed, heaped",
    range: { low: 210, high: 320 },
  },
  {
    value: "full",
    label: "Full load",
    hint: "Bed full and strapped",
    range: { low: 320, high: 480 },
  },
];

/** Cleanouts price like haul work plus sort-and-carry labor. */
const CLEANOUT_LABOR: Range = { low: 60, high: 120 };

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
    range: { low: 40, high: 80 },
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
    range: { low: 35, high: 70 },
    appliesTo: ["junk-removal", "garage-basement", "furniture-appliances", "single-item"],
  },
  {
    key: "long-carry",
    label: "Long carry",
    hint: "More than about 75 ft to the truck",
    range: { low: 25, high: 50 },
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
  const discount = input.earlyBird ? EARLY_BIRD_DISCOUNT : 0;
  const discounted: Range = {
    low: Math.max(FLOOR, total.low - discount),
    high: Math.max(FLOOR, total.high - discount),
  };

  const needsWalkthrough = size.value === "acreage";
  if (needsWalkthrough) {
    notes.push(
      "Acreage gets a free walk-through first — the range above is a starting point, not the quote.",
    );
  }
  if (discount > 0) {
    notes.push(
      `Early-bird $${EARLY_BIRD_DISCOUNT} off is already taken off this range.`,
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
