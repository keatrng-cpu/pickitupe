/**
 * Seasonal Cleanup Plan — the shape of the product, not its price.
 *
 * Actual dollar amounts live in Stripe (prices are immutable there, so the
 * amount a customer agreed to is whatever their subscription points at) and
 * the LIST amounts live in pricebook.ts like every other number in this app.
 * This module holds the tier identity, the price-ID lookup, and the service
 * window language — the three things both the checkout flow and the owner
 * board need to agree on.
 */

export type PlanTier = "small" | "standard" | "large";

export const PLAN_TIERS: {
  tier: PlanTier;
  /** Must match a `value` in LEAF_SIZES so a plan maps onto a real job size. */
  sizeValue: string;
  label: string;
  hint: string;
  /** Netlify env var holding the Stripe price id for this tier. */
  envVar: string;
}[] = [
  {
    tier: "small",
    sizeValue: "small",
    label: "Small city lot",
    hint: "One or two trees, light cover",
    envVar: "STRIPE_PRICE_SMALL",
  },
  {
    tier: "standard",
    sizeValue: "medium",
    label: "Standard lot",
    hint: "Full cover, front and back",
    envVar: "STRIPE_PRICE_STANDARD",
  },
  {
    tier: "large",
    sizeValue: "large",
    label: "Large / corner lot",
    hint: "Heavy cover, mature trees",
    envVar: "STRIPE_PRICE_LARGE",
  },
];

/**
 * Acreage deliberately has no plan tier. It is `needsWalkthrough` in the
 * pricebook for the same reason — nobody can price an acre sight-unseen, and
 * selling an auto-renewing annual commitment against an unknown job is how you
 * end up owing two visits a year at a loss.
 */
export function planTierFor(sizeValue: string): PlanTier | null {
  return PLAN_TIERS.find((t) => t.sizeValue === sizeValue)?.tier ?? null;
}

export function priceIdFor(tier: PlanTier): string | null {
  const entry = PLAN_TIERS.find((t) => t.tier === tier);
  if (!entry) return null;
  return process.env[entry.envVar] || null;
}

export function tierForPriceId(priceId: string): PlanTier | null {
  for (const t of PLAN_TIERS) {
    if (process.env[t.envVar] && process.env[t.envVar] === priceId) {
      return t.tier;
    }
  }
  return null;
}

/** True only when every tier has a price configured. */
export function planConfigured(): boolean {
  return PLAN_TIERS.every((t) => Boolean(process.env[t.envVar]));
}

/**
 * THE SERVICE WINDOW. This is the load-bearing legal text of the whole
 * product, not marketing copy — do not soften it and do not name a date.
 *
 * "After snow melt" is not a date in North Dakota. At NDSU's Carrington NDAWN
 * station the last day of soil frost across 2015-2024 ranged from March 24 to
 * May 12 — a 49-day spread. Grand Forks still averages 3.5 inches of snowfall
 * in April on the 1991-2020 NOAA normals. On the fall side the City of Grand
 * Forks slipped its own published vacuum-leaf start from Oct 16 to Oct 23 in
 * 2023 for weather. If the municipality cannot hold its own date, neither can
 * a one-truck operation.
 *
 * So: name a TRIGGER, a TYPICAL window, and a HARD OUTER BOUND with an
 * automatic refund. The outer bound is a chargeback defence as much as an
 * honesty measure — card networks date a services-not-received dispute from
 * "the latest anticipated performance date specified by the merchant." Specify
 * nothing and the issuer resolves that ambiguity against you. Specify June 1
 * and November 30 and there is a definite clock plus a written term to submit
 * as evidence. And a customer who has already been refunded automatically does
 * not file a dispute at all.
 */
export const SERVICE_WINDOW = {
  spring: {
    trigger: "within 14 days of the first stretch your ground is bare and thawed",
    typical: "typically April 10 – May 15",
    outerBound: "June 1",
  },
  fall: {
    trigger: "after your trees are bare, before the city vacuum reaches your street",
    typical: "typically October 10 – November 10",
    outerBound: "November 30",
  },
} as const;

/** Exclusions that must appear anywhere the plan is sold. */
export const PLAN_EXCLUSIONS = [
  // The standard market definition of "spring cleanup" bundles gutter
  // cleaning. This business owns no ladder and no fall-protection gear, so
  // saying so up front is what stops the ask happening on every single visit.
  "Gutter cleaning is not included.",
  "Snow removal is not included.",
  "Mowing is not included.",
  "The refused-items list applies: no paint, chemicals, oil, propane, concrete, dirt, roofing, or asbestos.",
] as const;

/**
 * The auto-renewal disclosure. NDCC ch. 51-37 covers automatic renewals longer
 * than one month, so an annual plan is in scope: conspicuous renewal terms
 * before the customer is bound, an acknowledgment carrying cancellation
 * information, a simple cancellation route, and written notice 30-60 days
 * ahead of each renewal. Federal ROSCA (15 U.S.C. § 8403) applies on top and
 * is independent of the vacated FTC click-to-cancel rule.
 *
 * This string is shown BEFORE checkout, repeated in the confirmation, and
 * repeated again in the renewal notice. Changing it is a compliance change,
 * not a copy tweak — route it past the owner's attorney, not the copy stream.
 */
export function renewalDisclosure(amountLabel: string): string {
  return [
    `This plan is $${amountLabel} per year and renews automatically every year until you cancel.`,
    `We email you at least 30 days before each renewal, with the amount and the date.`,
    `You can cancel any time, in one click, from the link in any of those emails or your receipt — no phone call, no reason needed.`,
    `Cancel before a renewal and you are not charged again. Cancel after, and you keep the visits you paid for.`,
  ].join(" ");
}
