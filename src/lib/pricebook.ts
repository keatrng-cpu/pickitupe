export const PHONE = "701-213-3969";
export const PHONE_TEL = "7012133969";
export const DEPOSIT = 50;
export const PROMO_PERCENT = 0.2;
export const PROMO_CAP = 75;
export const PROMO_DEADLINE_LABEL = "September 20";
export const PROMO_DEADLINE = new Date("2026-09-20T23:59:59-05:00");
export const MIN_AFTER_DISCOUNT = 55;

export type ServiceKey =
  | "leaf-cleanup"
  | "junk-removal"
  | "furniture-appliances"
  | "gutter-cleaning"
  | "other";

/** Old links used furniture-appliances; that job is junk removal. */
export function canonicalService(service: ServiceKey): ServiceKey {
  return service === "furniture-appliances" ? "junk-removal" : service;
}

export type Range = { low: number; high: number };

export type SizeOption = {
  value: string;
  label: string;
  hint: string;
  range: Range;
};

export type AddOn = {
  key: string;
  label: string;
  hint: string;
  range: Range;
  appliesTo: ServiceKey[] | "all";
};

export const SERVICES: { value: ServiceKey; label: string }[] = [
  { value: "leaf-cleanup", label: "Fall leaf & yard cleanup" },
  { value: "junk-removal", label: "Junk & furniture" },
  { value: "gutter-cleaning", label: "Gutter cleaning" },
  { value: "other", label: "Something else" },
];

export const LEAF_SIZES: SizeOption[] = [
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

export const JUNK_SIZES: SizeOption[] = [
  {
    value: "bags",
    label: "A few bags",
    hint: "Contractor bags or a small pile at the curb",
    range: { low: 69, high: 95 },
  },
  {
    value: "small-item",
    label: "One small piece",
    hint: "Chair, nightstand, microwave, lamp",
    range: { low: 69, high: 89 },
  },
  {
    value: "single",
    label: "One item",
    hint: "Anything we can carry in one trip to the truck",
    range: { low: 69, high: 95 },
  },
  {
    value: "dresser",
    label: "Dresser, table, bed frame",
    hint: "One mid-size furniture piece",
    range: { low: 75, high: 99 },
  },
  {
    value: "sofa",
    label: "Couch or mattress",
    hint: "One bulky living-room piece",
    range: { low: 89, high: 119 },
  },
  {
    value: "appliance",
    label: "Washer, dryer, or stove",
    hint: "One large appliance, no stairs",
    range: { low: 99, high: 129 },
  },
  {
    value: "fridge",
    label: "Refrigerator",
    hint: "Includes the refrigerant drop fee in the range",
    range: { low: 99, high: 139 },
  },
  {
    value: "two",
    label: "Two bulky items",
    hint: "Same stop, same truck",
    range: { low: 129, high: 169 },
  },
  {
    value: "three",
    label: "Three mixed items",
    hint: "Furniture, appliances, bags, or both",
    range: { low: 169, high: 219 },
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
  {
    value: "overflow",
    label: "Overflowing / two trips",
    hint: "More than one pickup bed",
    range: { low: 245, high: 365 },
  },
  {
    value: "building",
    label: "Building / turnover",
    hint: "One address, several units, same week — we walk it first",
    range: { low: 365, high: 890 },
  },
];

/** @deprecated Same list as junk — kept so old item quotes still resolve. */
export const FURNITURE_SIZES: SizeOption[] = JUNK_SIZES;

export const GUTTER_SIZES: SizeOption[] = [
  {
    value: "standard",
    label: "Single-story home",
    hint: "Standard ranch or rambler",
    range: { low: 135, high: 165 },
  },
  {
    value: "complex",
    label: "Large or complex single-story",
    hint: "Long runs, wraparound, split level",
    range: { low: 175, high: 215 },
  },
];

export const ADD_ONS: AddOn[] = [
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
    key: "cleanout",
    label: "Garage or basement cleanout",
    hint: "We sort and carry it out",
    range: { low: 50, high: 100 },
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

export const BLOCK_TIERS = [
  { households: 2, credit: 25 },
  { households: 3, credit: 40 },
];

/** Extra complex after the first, cheaper than booking a second full building. */
export const EXTRA_COMPLEX: Range = { low: 285, high: 640 };

export const PORTFOLIO_TIERS = [
  { complexes: 2, credit: 150 },
  { complexes: 3, credit: 275 },
  { complexes: 4, credit: 400 },
];

/** Dollars off each extra landlord stop this week. First stop stays full rate. */
export const EXTRA_STOP_CUT: Range = { low: 30, high: 45 };

/** One-time cut when they book tenant turns AND a leaf route the same week. */
export const COMBO_CREDIT = 40;

export const STOP_COUNTS = [1, 2, 3, 4, 6] as const;

export type LandlordPack = "turns" | "leaves" | "combo";

export const LANDLORD_PACKS: {
  value: LandlordPack;
  label: string;
  kicker: string;
  hint: string;
  service: ServiceKey;
  size: string;
}[] = [
  {
    value: "turns",
    label: "Tenant turns",
    kicker: "Move-out junk",
    hint: "Empty the unit after they leave. First unit pays the truck. Each extra unit this week is cheaper — same crew, stacked days.",
    service: "junk-removal",
    size: "three",
  },
  {
    value: "leaves",
    label: "Leaf route",
    kicker: "Yards at your buildings",
    hint: "Fronts, sides, and the pile at the curb. Extra yards this week ride the same dump run.",
    service: "leaf-cleanup",
    size: "medium",
  },
  {
    value: "combo",
    label: "Yard + unit",
    kicker: "Both, same week",
    hint: "Turns and leaves on the same properties. One truck roll, $40 off the stack, bigger deposit so the week stays yours.",
    service: "junk-removal",
    size: "three",
  },
];

export const LANDLORD_TURN_SIZES: SizeOption[] = [
  {
    value: "bags",
    label: "A few bags",
    hint: "Curb pile or contractor bags",
    range: { low: 69, high: 95 },
  },
  {
    value: "three",
    label: "Typical unit",
    hint: "Furniture, bags, one unit",
    range: { low: 169, high: 219 },
  },
  {
    value: "full",
    label: "Trashed unit",
    hint: "Bed full — we take the day",
    range: { low: 175, high: 265 },
  },
  {
    value: "building",
    label: "Whole building",
    hint: "Several units, we walk it first",
    range: { low: 365, high: 890 },
  },
];

export const LANDLORD_LEAF_SIZES: SizeOption[] = LEAF_SIZES.filter((s) => s.value !== "acreage");

export const RUSH: Range = { low: 10, high: 20 };

export const REFUSED = [
  "paint",
  "chemicals",
  "oil",
  "propane",
  "concrete",
  "dirt",
  "roofing",
  "asbestos",
];

export type FurnitureRateRow = {
  item: string;
  local: string;
  ours: string;
  promo: string;
};

export const FURNITURE_RATE_CARD: FurnitureRateRow[] = [
  {
    item: "Chair, nightstand, microwave",
    local: "$79",
    ours: "$69",
    promo: "$55",
  },
  {
    item: "Dresser, table, bed frame",
    local: "$79",
    ours: "$75",
    promo: "$60",
  },
  {
    item: "Couch or mattress",
    local: "$99",
    ours: "$89",
    promo: "$71",
  },
  {
    item: "Washer, dryer, or stove",
    local: "$109",
    ours: "$99",
    promo: "$79",
  },
  {
    item: "Refrigerator (we come inside)",
    local: "$109 apps / $48 city curb",
    ours: "$99",
    promo: "$79",
  },
  {
    item: "Two bulky items, same stop",
    local: "$138–$168",
    ours: "$129",
    promo: "$103",
  },
  {
    item: "Three mixed items",
    local: "$170–$230",
    ours: "$169",
    promo: "$135",
  },
];

export function isPromoLive(now = new Date()) {
  return now.getTime() <= PROMO_DEADLINE.getTime();
}

export function sizesFor(service: ServiceKey): SizeOption[] {
  const s = canonicalService(service);
  if (s === "leaf-cleanup") return LEAF_SIZES;
  if (s === "gutter-cleaning") return GUTTER_SIZES;
  if (s === "junk-removal") return JUNK_SIZES;
  return LEAF_SIZES;
}

export function addOnsFor(service: ServiceKey): AddOn[] {
  const s = canonicalService(service);
  return ADD_ONS.filter(
    (a) => a.appliesTo === "all" || a.appliesTo.includes(s) || a.appliesTo.includes(service),
  );
}

function add(a: Range, b: Range): Range {
  return { low: a.low + b.low, high: a.high + b.high };
}

function applyPercent(range: Range): Range {
  const cut = (n: number) => Math.min(n * PROMO_PERCENT, PROMO_CAP);
  return {
    low: Math.max(MIN_AFTER_DISCOUNT, Math.round(range.low - cut(range.low))),
    high: Math.max(MIN_AFTER_DISCOUNT, Math.round(range.high - cut(range.high))),
  };
}

function applyCredit(range: Range, credit: number): Range {
  return {
    low: Math.max(MIN_AFTER_DISCOUNT, Math.round(range.low - credit)),
    high: Math.max(MIN_AFTER_DISCOUNT, Math.round(range.high - credit)),
  };
}

function blockCredit(households: number, jobLow: number) {
  if (!Number.isFinite(households) || households < 2 || jobLow < 95) return 0;
  const tier = [...BLOCK_TIERS]
    .sort((a, b) => b.households - a.households)
    .find((t) => households >= t.households);
  return tier ? tier.credit : 0;
}

function portfolioCredit(complexes: number) {
  if (!Number.isFinite(complexes) || complexes < 2) return 0;
  const tier = [...PORTFOLIO_TIERS]
    .sort((a, b) => b.complexes - a.complexes)
    .find((t) => complexes >= t.complexes);
  return tier ? tier.credit : 0;
}

function extraStopRange(base: Range, size: string): Range {
  if (size === "building") return { ...EXTRA_COMPLEX };
  return {
    low: Math.max(MIN_AFTER_DISCOUNT, base.low - EXTRA_STOP_CUT.low),
    high: Math.max(base.low, base.high - EXTRA_STOP_CUT.high),
  };
}

export function clampStops(n: unknown) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return 1;
  return Math.min(8, Math.max(1, v));
}

export function landlordDeposit(stops: number, pack: LandlordPack = "turns") {
  const n = clampStops(stops);
  if (pack === "combo") return Math.min(150, 75 + 25 * Math.min(n - 1, 3));
  if (n <= 1) return DEPOSIT;
  if (n === 2) return 75;
  return 100;
}

export function packService(pack: LandlordPack): ServiceKey {
  return pack === "leaves" ? "leaf-cleanup" : "junk-removal";
}

export function packDefaultSize(pack: LandlordPack) {
  return LANDLORD_PACKS.find((p) => p.value === pack)?.size ?? "three";
}

export function sizesForPack(pack: LandlordPack): SizeOption[] {
  return pack === "leaves" ? LANDLORD_LEAF_SIZES : LANDLORD_TURN_SIZES;
}

function cheaper(a: Range, b: Range) {
  return a.high < b.high;
}

export function formatRange(range: Range) {
  return `$${range.low}–$${range.high}`;
}

export function refusedIn(notes: string) {
  const t = (notes || "").toLowerCase();
  return REFUSED.filter((w) => t.includes(w));
}

export type QuoteInput = {
  service: ServiceKey;
  size: string;
  addOns: string[];
  urgency?: "before-vacuum" | "this-week" | "flexible";
  households?: number;
  complexes?: number;
  stops?: number;
  pack?: LandlordPack;
  notes?: string;
  earlyBird?: boolean;
};

export type QuoteLine = { label: string; range: Range };

export type Quote = {
  range: Range | null;
  beforeDiscount: Range | null;
  discount: number;
  appliedDiscount: "none" | "promo" | "block" | "portfolio" | "route" | "combo";
  deposit: number;
  lines: QuoteLine[];
  notes: string[];
  refused: string[];
  needsWalkthrough: boolean;
};

export function quote(input: QuoteInput): Quote {
  const earlyBird = input.earlyBird ?? isPromoLive();
  const service = canonicalService(input.service);
  if (service === "other") {
    return {
      range: null,
      beforeDiscount: null,
      discount: 0,
      appliedDiscount: "none",
      deposit: DEPOSIT,
      lines: [],
      notes: [
        `Tell us what it is and we'll price it the same day — call or text ${PHONE}.`,
      ],
      refused: refusedIn(input.notes ?? ""),
      needsWalkthrough: true,
    };
  }

  const pack = input.pack;
  const stops = clampStops(input.stops ?? (pack ? 1 : input.complexes ?? 1));
  const sizes = pack ? sizesForPack(pack === "combo" ? "turns" : pack) : sizesFor(service);
  const size = sizes.find((s) => s.value === input.size) ?? sizes[0];
  const noun = pack === "leaves" ? "yard" : pack === "combo" ? "address" : "unit";
  const yard = LANDLORD_LEAF_SIZES.find((s) => s.value === "medium") ?? LEAF_SIZES[1];
  const lines: QuoteLine[] = [
    {
      label: pack ? `${size.label} — first ${noun}` : size.label,
      range: size.range,
    },
  ];
  let total: Range = { ...size.range };

  if (pack === "combo") {
    lines.push({ label: `${yard.label} — first yard`, range: yard.range });
    total = add(total, yard.range);
    for (let i = 2; i <= stops; i += 1) {
      const extraUnit = extraStopRange(size.range, size.value);
      const extraYard = extraStopRange(yard.range, yard.value);
      lines.push({ label: `${noun} ${i} — route rate`, range: extraUnit });
      lines.push({ label: `yard ${i} — route rate`, range: extraYard });
      total = add(total, extraUnit);
      total = add(total, extraYard);
    }
  } else if (pack && stops > 1) {
    const extra = extraStopRange(size.range, size.value);
    for (let i = 2; i <= stops; i += 1) {
      lines.push({
        label: `${noun} ${i} — route rate`,
        range: extra,
      });
      total = add(total, extra);
    }
  } else {
    const complexes = Math.min(8, Math.max(1, Math.round(input.complexes ?? 1)));
    if (size.value === "building" && complexes > 1) {
      for (let i = 2; i <= complexes; i += 1) {
        lines.push({
          label: `Complex ${i} — investor rate`,
          range: EXTRA_COMPLEX,
        });
        total = add(total, EXTRA_COMPLEX);
      }
    }
  }

  const available = addOnsFor(pack === "leaves" ? "leaf-cleanup" : service);
  for (const key of input.addOns) {
    const addOn = available.find((a) => a.key === key);
    if (addOn) {
      lines.push({ label: addOn.label, range: addOn.range });
      total = add(total, addOn.range);
    }
  }

  if (input.urgency === "this-week") {
    lines.push({ label: "Same-week rush", range: RUSH });
    total = add(total, RUSH);
  }

  const before = pack
    ? {
        low: (size.range.low + (pack === "combo" ? yard.range.low : 0)) * stops,
        high: (size.range.high + (pack === "combo" ? yard.range.high : 0)) * stops,
      }
    : { ...total };
  if (pack === "combo") {
    total = applyCredit(total, COMBO_CREDIT);
    lines.push({
      label: "Yard + unit bundle",
      range: { low: -COMBO_CREDIT, high: -COMBO_CREDIT },
    });
  }

  const complexes = Math.min(8, Math.max(1, Math.round(input.complexes ?? stops)));
  const promoRange = earlyBird && !pack ? applyPercent(total) : total;
  const credit = pack ? 0 : blockCredit(input.households ?? 1, total.low);
  const blockRange = credit > 0 ? applyCredit(total, credit) : total;
  const portCredit = !pack && size.value === "building" ? portfolioCredit(complexes) : 0;
  const portfolioRange = portCredit > 0 ? applyCredit(total, portCredit) : total;

  let applied: Quote["appliedDiscount"] = pack === "combo" ? "combo" : pack && stops > 1 ? "route" : "none";
  let final = total;
  if (!pack) {
    applied = "none";
    if (earlyBird && cheaper(promoRange, final)) {
      applied = "promo";
      final = promoRange;
    }
    if (credit > 0 && cheaper(blockRange, final)) {
      applied = "block";
      final = blockRange;
    }
    if (portCredit > 0 && cheaper(portfolioRange, final)) {
      applied = "portfolio";
      final = portfolioRange;
    }
  }

  const saved = before.high - final.high;
  const notes: string[] = [];
  const walk = size.value === "acreage" || size.value === "building" || stops >= 6;
  if (pack) {
    notes.push(
      stops === 1
        ? "One stop. Add a second address this week and that one runs at route rate — first stop stays full price so the truck is paid."
        : `First ${noun} is full rate. The other ${stops - 1} this week run at route rate ($${EXTRA_STOP_CUT.low}–$${EXTRA_STOP_CUT.high} off each). Same crew, stacked days, one PICK code.`,
    );
    if (pack === "combo") {
      notes.push(`Yard + unit bundle: $${COMBO_CREDIT} off the stack. Two services, one set of miles.`);
    }
    if (stops >= 6) {
      notes.push("Six or more stops: we walk the first address, then stack the week.");
    }
  } else if (walk) {
    notes.push(
      size.value === "building"
        ? "We walk the first building. Extra complexes stack on the next open days that week — one code, one deposit."
        : "Acreage gets a free walk-through first — the range above is a starting point, not the quote.",
    );
  }
  if (applied === "promo" && saved > 0) {
    notes.push(
      `Book by ${PROMO_DEADLINE_LABEL} to lock this rate — ${Math.round(PROMO_PERCENT * 100)}% off (up to $${PROMO_CAP}) is already taken off this range.`,
    );
  }
  if (applied === "block" && saved > 0) {
    notes.push(
      `Block deal applied — $${credit} off because we're doing ${input.households} houses on your street the same day. It beat the ${PROMO_DEADLINE_LABEL} rate, so you're getting the bigger of the two, not both.`,
    );
  }
  if (applied === "portfolio" && saved > 0) {
    notes.push(
      `Investor special — ${complexes} complexes the same week, $${portCredit} off. Beats the ${PROMO_DEADLINE_LABEL} cap. One truck, stacked days, one PICK code.`,
    );
  }
  if (applied === "promo" && (credit > 0 || portCredit > 0)) {
    notes.push(
      `Your ${PROMO_DEADLINE_LABEL} rate is worth more on a job this size, so we applied that instead. You get the better one, never stacked.`,
    );
  }
  const deposit = pack ? landlordDeposit(stops, pack) : DEPOSIT;
  notes.push(
    `$${deposit} deposit holds the first day and comes off the final invoice.${pack && stops > 1 ? " Bigger stack, bigger hold — so a one-off couch doesn't bump your week." : ""}`,
  );
  notes.push(
    "If the pile turns out bigger than described, we stop and re-quote before we load anything.",
  );

  return {
    range: final,
    beforeDiscount: before,
    discount: Math.max(0, saved),
    appliedDiscount: applied,
    deposit,
    lines,
    notes,
    refused: refusedIn(input.notes ?? ""),
    needsWalkthrough: walk,
  };
}

export function sizeLabelFor(service: ServiceKey) {
  const s = canonicalService(service);
  if (s === "junk-removal") return "How much is there?";
  if (s === "gutter-cleaning") return "What kind of house?";
  return "Yard size";
}
