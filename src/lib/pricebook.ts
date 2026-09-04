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

/**
 * Same-week rush. "Before city vacuum" is the SEASONAL norm here, not a rush —
 * the whole business is built around that mid-Oct to mid-Nov window — so it
 * carries no surcharge. "This week" is the actual rush: it displaces work
 * already on the calendar and burns a slot that could have been routed with a
 * neighbour on the same street.
 *
 * Priced as a range, like every other line, because a squeeze-in costs more on
 * a full week than an empty one. Added BEFORE discounts, the same way add-ons
 * are, so one mechanism governs the whole quote.
 */
export const RUSH_SURCHARGE: Range = { low: 10, high: 20 };

/**
 * Block deal — two or more houses on the same street, the same day. One trip
 * down a street costs less than two, so we hand that back.
 *
 * This used to live only in marketing copy and get applied by hand on the
 * invoice. That was a real defect: `estimate()` could not produce the number
 * the site was advertising, and subtracting it after the fact walked straight
 * through FLOOR. Traced on the live site: a small lot with the promo landed at
 * $76, minus $25 by hand = $51, four dollars under the floor with nothing left
 * to re-check it. It also inverted the ladder — a standard lot at $145 − $29
 * promo − $25 block = $91, cheaper than a small lot's $95 list price.
 *
 * THE $40 IS DERIVED, NOT CHOSEN. The cheapest job the credit may touch lists
 * at BLOCK_MIN_JOB_LOW ($95) and FLOOR is $55, so $95 − $55 = $40 is the
 * largest per-house credit that can never breach the floor. Raising either
 * bound without re-deriving this breaks that guarantee — the unit tests in
 * scripts/pricebook.test.mjs assert it.
 *
 * Why $40 at three houses and not the $30 originally floated: the customer's
 * own credit moving $25 → $30 pays them $5 for recruiting the second
 * neighbour, after $25 bought the first. Neighbour #1 is the person you talk
 * to over the fence; neighbour #2 is the house you only wave at. Paying $25
 * for the easy ask and $5 for the hard one is a dead ladder. $25 → $40 pays
 * $15 for the second recruit — the same order of magnitude as the first.
 */
export const BLOCK_TIERS: { households: number; credit: number }[] = [
  { households: 2, credit: 25 },
  { households: 3, credit: 40 },
];

/**
 * The block credit is not offered on jobs listing below this. Without the
 * gate a $59 one-item haul quotes $55–$76 after the promo and then goes to
 * $30–$51 — both ends under the floor, on a single mattress.
 */
export const BLOCK_MIN_JOB_LOW = 95;

export type Range = { low: number; high: number };

export type ServiceKey =
  | "leaf-cleanup"
  | "junk-removal"
  | "furniture-appliances"
  | "gutter-cleaning"
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

/**
 * SPRING cleanup — dead thatch, winter street sand, matted leaves the fall
 * missed, downed branches. Sized by the same lot tiers as fall so a customer
 * answers one question, not two.
 *
 * DERIVED AT 0.80 x THE FALL BAND, and that ratio is sourced rather than
 * picked: HomeGuide (2026-02-04) puts spring cleanup at $125-$300 against fall
 * at $150-$400 — 0.833 at the low end, 0.75 at the high, 0.773 at midpoints.
 * The local mechanism agrees: Lawn King of Grand Forks describes spring as one
 * pass raking dead thatch, versus fall where they "make multiple passes."
 *
 * THIS REPLACED AN EARLIER 85% GUESS, which sat above HomeGuide's own
 * high-end AND midpoint ratios — i.e. it would have priced spring above what
 * the only sourced comparison supports.
 *
 * STILL AN ASSUMPTION IN ONE RESPECT: nobody has performed a spring cleanup
 * for this business yet, so the RATIO is sourced but the underlying hours are
 * not. PRICEBOOK.md's "what to check after a real season" list is where the
 * measured numbers replace these.
 */
const SPRING_SIZES: SizeOption[] = [
  {
    value: "small",
    label: "Small city lot",
    hint: "One or two trees, light winter debris",
    range: { low: 75, high: 125 },
  },
  {
    value: "medium",
    label: "Standard lot",
    hint: "Full yard, thatch and street sand",
    range: { low: 115, high: 195 },
  },
  {
    value: "large",
    label: "Large / corner lot",
    hint: "Heavy thatch, mature trees",
    range: { low: 195, high: 315 },
  },
  // Acreage deliberately absent — see PLAN_DISCOUNT_CAP below and
  // `needsWalkthrough`. We do not sell a fixed annual price for the one tier
  // the estimator already refuses to quote sight-unseen.
];

export function springSizeOptions(): SizeOption[] {
  return SPRING_SIZES;
}

/**
 * Seasonal plan discount — 20% off the two-visit pair, capped at $150.
 *
 * The percent is PROMO_PERCENT, reused on purpose: the plan and the Sept 20
 * promo are then worth the same, so a customer is never worse off on one path
 * than the other and there is no reason to let them stack.
 *
 * THE CAP IS DERIVED: a plan is TWO visits, so it is 2 x PROMO_CAP. Applying
 * the single-job $75 cap to a two-job bundle would halve the effective
 * discount on the largest tier — backwards for a subscription, where the big
 * lots are the ones most worth locking in. At current tiers the cap never
 * binds (largest cut is $115); it exists to bound a future acreage plan.
 *
 * NON-STACKING IS MANDATORY. Three things must never apply to a plan price:
 *   1. PROMO_PERCENT / PROMO_CAP — same 20%, would double-discount.
 *   2. BLOCK_TIERS — BLOCK_MIN_JOB_LOW is checked against a single job's
 *      total.low and has no meaning against one flat annual price, so it
 *      would silently pass the gate.
 *   3. DEPOSIT — it is credited against a final invoice, and a fully prepaid
 *      annual subscription has no invoice left to credit it to. Leaving it on
 *      both paths produces a self-contradictory quote.
 * `estimate()` is never called for plan pricing; the plan reads Stripe.
 */
export const PLAN_DISCOUNT_PERCENT = PROMO_PERCENT;
export const PLAN_DISCOUNT_CAP = PROMO_CAP * 2;

/** List price of a plan tier before the commitment discount. */
export function planPairTotal(sizeValue: string): number | null {
  const fall = LEAF_SIZES.find((s) => s.value === sizeValue);
  const spring = SPRING_SIZES.find((s) => s.value === sizeValue);
  if (!fall || !spring) return null;
  const mid = (r: Range) => (r.low + r.high) / 2;
  return Math.round(mid(fall.range) + mid(spring.range));
}

/** What a plan tier should cost per year. Stripe holds the sold price. */
export function planPriceFor(sizeValue: string): number | null {
  const pair = planPairTotal(sizeValue);
  if (pair === null) return null;
  const cut = Math.min(pair * PLAN_DISCOUNT_PERCENT, PLAN_DISCOUNT_CAP);
  return Math.round(pair - cut);
}

/**
 * GUTTER CLEANING — single-storey only, cleaned from the GROUND.
 *
 * PRICED BELOW THE OWNER'S FIRST PROPOSAL, ON PURPOSE. The original idea was
 * $175-$225 flat, described as "competitive". It is not: homeyou models
 * $160-$205 for Grand Forks and a local operator publicly quotes $125 for
 * one-storey. PRICEBOOK.md's standing position is that every tier sits under a
 * named local comparable, and $175 does not. $135-$165 does.
 *
 * NO TWO-STOREY TIER, AT ANY PRICE. The equipment is a ground-based vacuum
 * with 20 ft of pole — that covers a single-storey gutter (~10-12 ft)
 * comfortably and a two-storey run (~18-20 ft) only marginally. Selling work
 * the equipment cannot reliably reach is how someone ends up on a ladder they
 * bought this business to avoid. Longer pole sets exist; add the tier when the
 * poles are actually in the truck, not before.
 *
 * NO PER-LINEAR-FOOT OPTION. Published beside a flat price it creates adverse
 * selection: at Grand Forks' typical ~215 linear feet, $1.25-$1.75/ft yields
 * $269-$376, so its LOW end beats the flat price's HIGH end and every customer
 * who can multiply picks the cheaper method.
 */
const GUTTER_SIZES: SizeOption[] = [
  {
    value: "standard",
    label: "Single-story home",
    hint: "Standard ranch or rambler, straightforward roofline",
    range: { low: 135, high: 165 },
  },
  {
    // ASSUMPTION, not a measured figure: derived at ~1.3x the standard tier
    // for the extra runs, corners and setups a complex roofline adds. Replace
    // it once a few of these have actually been timed.
    value: "complex",
    label: "Large or complex single-story",
    hint: "Long runs, multiple corners, wraparound or split level",
    range: { low: 175, high: 215 },
  },
];

/** Cleanouts price like haul work plus sort-and-carry labor. */
const CLEANOUT_LABOR: Range = { low: 50, high: 100 };

export function sizeOptionsFor(service: ServiceKey): SizeOption[] {
  if (service === "leaf-cleanup") return LEAF_SIZES;
  if (service === "gutter-cleaning") return GUTTER_SIZES;
  if (service === "furniture-appliances") {
    return LOAD_SIZES.slice(0, 3);
  }
  return LOAD_SIZES;
}

export type AddOnKey =
  | "bagging"
  | "stairs"
  | "long-carry"
  | "appliance-freon"
  | "wet-heavy"
  | "cleanout"
  | "downspout";

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
    appliesTo: ["junk-removal", "furniture-appliances"],
  },
  {
    // The one real gutter add-on. A blocked downspout is a separate job from
    // clearing the trough — it needs flushing and sometimes snaking, and it is
    // where the callback comes from if it is skipped and the gutter overflows
    // anyway. Priced per visit, not per downspout, to keep the quote one number.
    key: "downspout",
    label: "Downspouts are draining slow",
    hint: "We flush them out, not just the gutters",
    range: { low: 25, high: 50 },
    appliesTo: ["gutter-cleaning"],
  },
  {
    key: "long-carry",
    label: "Long carry",
    hint: "More than about 75 ft to the truck",
    range: { low: 20, high: 40 },
    appliesTo: "all",
  },
  {
    // Was a hard-coded surcharge on the deleted "garage-basement" service. It
    // is real labour — sorting a basement is not the same job as lifting a
    // couch already at the curb — so removing the service without keeping this
    // would have quietly priced every cleanout $50-$100 under cost. As an
    // add-on it now applies to any haul that turns out to be a cleanout.
    key: "cleanout",
    label: "Garage or basement cleanout",
    hint: "We sort and carry it out, not just load at the curb",
    range: CLEANOUT_LABOR,
    appliesTo: ["junk-removal", "furniture-appliances"],
  },
  {
    key: "appliance-freon",
    label: "Fridge, freezer, or AC",
    hint: "Refrigerant units cost extra to drop",
    range: { low: 25, high: 45 },
    appliesTo: ["junk-removal", "furniture-appliances"],
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
  /**
   * Houses on the same street booked for the same day, INCLUDING this one.
   * 1 (or omitted) means no block deal.
   */
  households?: number;
  /** Only "this-week" changes the price. See RUSH_SURCHARGE. */
  urgency?: "before-vacuum" | "this-week" | "flexible";
};

/** Which credit actually got applied. Never both — see `estimate()`. */
export type DiscountKind = "none" | "promo" | "block";

export type Estimate = {
  /** Null when the job genuinely needs eyes on it before any number. */
  range: Range | null;
  /** Range before any credit, for showing the strike-through. */
  beforeDiscount: Range | null;
  discount: number;
  /**
   * Which mechanism produced `discount`. The UI must read this rather than
   * assuming the promo — quoting "book by Sept 20 to lock this rate" on a
   * quote that actually won on the block credit is a false statement.
   */
  appliedDiscount: DiscountKind;
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

/** A flat dollar credit off each end, floored the same way the promo is. */
function applyFlat(range: Range, credit: number): Range {
  return {
    low: Math.max(FLOOR, Math.round(range.low - credit)),
    high: Math.max(FLOOR, Math.round(range.high - credit)),
  };
}

/** Per-house block credit, or 0 when the job does not qualify. */
export function blockCreditFor(households: number, jobLow: number): number {
  if (!Number.isFinite(households) || households < 2) return 0;
  if (jobLow < BLOCK_MIN_JOB_LOW) return 0;
  const tier = [...BLOCK_TIERS]
    .sort((a, b) => b.households - a.households)
    .find((t) => households >= t.households);
  return tier ? tier.credit : 0;
}

/**
 * Which of two candidate quotes is better for the customer.
 *
 * Compared on the HIGH end, deliberately, and not on total dollars saved.
 * Total-saved picks the flat block credit on a standard lot ($80 saved vs
 * $78) even though it produces a HIGHER top-of-range number ($205 vs $196) —
 * i.e. recruiting a neighbour would have made someone's quote worse at the
 * number they actually plan around. Comparing the high end removes that.
 *
 * It is also safe in both directions: a flat credit that beats the percentage
 * at the top of the range necessarily beats it at the bottom too, because the
 * percentage cut shrinks with the number while the flat credit does not. So a
 * winning block credit dominates on BOTH ends, and a losing one leaves the
 * customer with exactly the promo they would have had anyway. Recruiting a
 * neighbour can never make a quote worse than not recruiting.
 */
function isBetter(candidate: Range, incumbent: Range): boolean {
  return candidate.high < incumbent.high;
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
      appliedDiscount: "none",
      deposit: DEPOSIT,
      lines: [],
      notes: [
        "Tell us what it is and we'll price it the same day — call or text 701-213-3969.",
      ],
      refused: refusedItemsIn(input.notes ?? ""),
      needsWalkthrough: true,
    };
  }

  lines.push({ label: size.label, range: size.range });
  total = add(total, size.range);

  const available = addOnsFor(input.service);
  for (const key of input.addOns) {
    const addOn = available.find((a) => a.key === key);
    if (!addOn) continue;
    lines.push({ label: addOn.label, range: addOn.range });
    total = add(total, addOn.range);
  }

  // Rush last, so it reads as a surcharge on the assembled job rather than
  // something bundled into the base price.
  if (input.urgency === "this-week") {
    lines.push({ label: "Same-week rush", range: RUSH_SURCHARGE });
    total = add(total, RUSH_SURCHARGE);
  }

  const beforeDiscount = total;

  // NON-STACKING, BY CONSTRUCTION. The customer gets whichever single credit
  // saves them more — never both. Stacking them is what drove a small-lot
  // block booking to $51 against a $55 floor, and what let a standard lot
  // undercut the small-lot list price. Compare the two candidates on total
  // dollars saved across the range, then commit to one mechanism for the
  // whole quote so the number and the explanation always agree.
  const promoApplied = input.earlyBird ? applyPromo(total) : total;
  const blockCredit = blockCreditFor(input.households ?? 1, total.low);
  const blockApplied =
    blockCredit > 0 ? applyFlat(total, blockCredit) : total;

  let appliedDiscount: DiscountKind = "none";
  let discounted = total;
  if (input.earlyBird && isBetter(promoApplied, discounted)) {
    appliedDiscount = "promo";
    discounted = promoApplied;
  }
  if (blockCredit > 0 && isBetter(blockApplied, discounted)) {
    appliedDiscount = "block";
    discounted = blockApplied;
  }
  const blockLost = blockCredit > 0 && appliedDiscount !== "block";

  // Dollars saved at the top of the range — the number worth putting in a
  // text message. The bottom of the range can save proportionally less (or
  // nothing, once the floor clamps it) — that's intentional, not a bug.
  const discount = beforeDiscount.high - discounted.high;

  const needsWalkthrough = size.value === "acreage";
  if (needsWalkthrough) {
    notes.push(
      "Acreage gets a free walk-through first — the range above is a starting point, not the quote.",
    );
  }
  if (appliedDiscount === "promo" && discount > 0) {
    notes.push(
      `Book by ${PROMO_DEADLINE_LABEL} to lock this rate — ${Math.round(PROMO_PERCENT * 100)}% off (up to $${PROMO_CAP}) is already taken off this range.`,
    );
  }
  if (appliedDiscount === "block" && discount > 0) {
    notes.push(
      `Block deal applied — $${blockCredit} off because we're doing ${input.households} houses on your street the same day. It beat the ${PROMO_DEADLINE_LABEL} rate, so you're getting the bigger of the two, not both.`,
    );
  }
  if (appliedDiscount === "promo" && blockLost) {
    notes.push(
      `Your ${PROMO_DEADLINE_LABEL} rate is worth more than the $${blockCredit} block credit on a job this size, so we applied that instead. You get the better one, never both.`,
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
    appliedDiscount,
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
