/**
 * Tax mechanics for a single-member LLC taxed as a sole proprietor (Schedule C).
 *
 * Pure arithmetic over published tables — no framework, no database — so the
 * owner books page and the node tests can both import it. Every number here is
 * an IRS figure with its source in the comment; nothing is a guess. If a rate
 * changes, change the table, never a call site.
 *
 * None of this is a filed position. It exists so the conversation with the CPA
 * starts from real numbers.
 */

// ---------------------------------------------------------------------------
// Standard mileage rate (cents per business mile), by effective date.
// IRS Notice 2025-5 (2025: 70¢); Notice 2026-10 (Jan–Jun 2026: 72.5¢);
// Announcement 2026-11 (Jul 1–Dec 31 2026: 76¢). Newest first.
// ---------------------------------------------------------------------------
export const MILEAGE_RATES: { from: string; cents: number; source: string }[] = [
  { from: "2026-07-01", cents: 76, source: "IRS Announcement 2026-11" },
  { from: "2026-01-01", cents: 72.5, source: "IRS Notice 2026-10" },
  { from: "2025-01-01", cents: 70, source: "IRS Notice 2025-5" },
  { from: "2024-01-01", cents: 67, source: "IRS Notice 2024-8" },
];

/** Rate in cents for a trip driven on `isoDate` (YYYY-MM-DD). */
export function mileageRateFor(isoDate: string): number {
  const day = isoDate.slice(0, 10);
  for (const r of MILEAGE_RATES) {
    if (day >= r.from) return r.cents;
  }
  return MILEAGE_RATES[MILEAGE_RATES.length - 1].cents;
}

/** Whole cents of deduction for a set of trips, each at the rate stamped when it was logged. */
export function mileageDeductionCents(trips: { miles: number; rate_cents: number }[]): number {
  return Math.round(trips.reduce((sum, t) => sum + t.miles * t.rate_cents, 0));
}

// ---------------------------------------------------------------------------
// Expense categories → Schedule C lines (Form 1040 Schedule C, Part II).
// The owner picks the plain label; the export carries the line number.
// ---------------------------------------------------------------------------
export type ExpenseCategory = {
  key: string;
  label: string;
  line: string;
  hint: string;
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { key: "advertising", label: "Advertising", line: "8", hint: "Door hangers, signs, Google Ads, business cards" },
  { key: "dump-fees", label: "Dump & landfill fees", line: "27a", hint: "Per-load tipping fees — pin to the job" },
  { key: "fuel", label: "Fuel (only if NOT taking mileage)", line: "9", hint: "Skip this while on the standard mileage rate — fuel is inside the rate" },
  { key: "supplies", label: "Supplies", line: "22", hint: "Bags, tarps, straps, rakes under $200, gloves" },
  { key: "equipment", label: "Equipment (tools, blower, vacuum, trailer)", line: "13", hint: "≤$2,500/item expensed under the de minimis election; above that §179" },
  { key: "insurance", label: "Insurance", line: "15", hint: "GL, tools policy. Truck insurance is inside the mileage rate" },
  { key: "software", label: "Software & web", line: "18", hint: "Netlify, Supabase, domain, Stripe fees go under 'fees'" },
  { key: "fees", label: "Bank, card & processing fees", line: "10", hint: "Stripe fees, Alerus fees" },
  { key: "phone", label: "Phone & internet (business %)", line: "25", hint: "Enter the business share only" },
  { key: "wages", label: "Helper wages", line: "26", hint: "Gross W-2 wages. Employer taxes go under 'taxes'" },
  { key: "taxes", label: "Taxes & licenses", line: "23", hint: "WSI premium, employer FICA/UI, city permits, SOS fees after year 1" },
  { key: "professional", label: "Legal & professional", line: "17", hint: "CPA, attorney" },
  { key: "repairs", label: "Repairs (equipment, not truck)", line: "21", hint: "Truck repairs are inside the mileage rate" },
  { key: "startup", label: "Start-up / organizational", line: "27a", hint: "§195: SOS filing, first door hangers, pre-open costs — up to $5,000 in year 1" },
  { key: "other", label: "Other", line: "27a", hint: "Anything ordinary and necessary that fits nowhere else" },
];

export function categoryFor(key: string): ExpenseCategory {
  return EXPENSE_CATEGORIES.find((c) => c.key === key) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
}

// ---------------------------------------------------------------------------
// Self-employment tax. IRC §1401/§1402: 15.3% (12.4% OASDI + 2.9% Medicare) on
// 92.35% of net profit; half is deductible above the line (§164(f)). The
// Social Security wage base is irrelevant at this scale but kept for honesty.
// ---------------------------------------------------------------------------
export const SE_TAX_RATE = 0.153;
export const SE_NET_FACTOR = 0.9235;
export const SS_WAGE_BASE_2026 = 184_500; // SSA 2026 contribution and benefit base

export function selfEmploymentTaxCents(netProfitCents: number): number {
  if (netProfitCents <= 0) return 0;
  const base = Math.min(netProfitCents * SE_NET_FACTOR, SS_WAGE_BASE_2026 * 100);
  return Math.round(base * SE_TAX_RATE);
}

/**
 * Default share of every collected dollar to move into the tax savings account.
 * 15.3% SE + ~12% federal + 1.95% ND ≈ 29%, less the QBI deduction and the
 * half-SE deduction. 25% is the round number that lands slightly over.
 */
export const DEFAULT_RESERVE_PCT = 25;

/** 2026 federal estimated-tax due dates (Form 1040-ES). */
export const ESTIMATED_TAX_DUE_2026 = ["2026-04-15", "2026-06-15", "2026-09-15", "2027-01-15"];

// ---------------------------------------------------------------------------
// Trip suggestion. Great-circle distance × a road factor; Grand Forks is a
// grid, so 1.3 is conservative. The owner always sees and can edit the number.
// ---------------------------------------------------------------------------
export function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const ROAD_FACTOR = 1.3;

export type Point = { lat: number; lon: number };

/**
 * Suggested logged miles for one job: home → job → (landfill →) home, road
 * factor applied, rounded to a tenth. Returns null when the job has no coords.
 */
export function suggestedTripMiles(home: Point, job: Point | null, landfill: Point | null): number | null {
  if (!job) return null;
  let d = haversineMiles(home.lat, home.lon, job.lat, job.lon);
  if (landfill) {
    d += haversineMiles(job.lat, job.lon, landfill.lat, landfill.lon);
    d += haversineMiles(landfill.lat, landfill.lon, home.lat, home.lon);
  } else {
    d += haversineMiles(job.lat, job.lon, home.lat, home.lon);
  }
  return Math.round(d * ROAD_FACTOR * 10) / 10;
}

// ---------------------------------------------------------------------------
// Deduction checklist — the one-time elections and set-ups from the plan.
// Ticks are stored in owner_settings as `check:<key>`.
// ---------------------------------------------------------------------------
export const DEDUCTION_CHECKLIST: { key: string; label: string; why: string }[] = [
  { key: "mileage-first-year", label: "Standard mileage rate chosen for the truck in year one", why: "Picking actual expenses first locks the truck out of the standard rate for good. Odometer photo on day one and Dec 31." },
  { key: "home-office", label: "Home office set up (dedicated, exclusive admin space)", why: "Makes home the principal place of business — every mile from the driveway is business, and $5/sq ft up to 300 sq ft." },
  { key: "de-minimis", label: "De minimis safe harbor election on the return", why: "Expenses every tool ≤ $2,500 in full the year it's placed in service. One statement, every year you use it." },
  { key: "startup-costs", label: "Start-up costs tallied (SOS fee, first hangers, pre-open insurance)", why: "§195: up to $5,000 deductible in year one." },
  { key: "equipment-contributed", label: "Pre-LLC equipment listed on OA Schedule A with receipts", why: "Contributed at fair market value — the basis for the deduction." },
  { key: "separate-accounts", label: "All business spend through Alerus checking or the business card", why: "Separation is the deduction system and the liability shield in one." },
  { key: "tax-savings", label: "Tax savings account open; 25% of each payout moved", why: "SE tax plus income tax lands near 29% before QBI. Quarterly 1040-ES if you'll owe $1,000+." },
  { key: "phone-pct", label: "Phone/internet business percentage decided and written down", why: "Pick a defensible number once; use it all year." },
  { key: "cpa-hour", label: "One CPA hour booked before the first W-2", why: "Payroll registration thresholds and the elections above are filed positions." },
];

// ---------------------------------------------------------------------------
// Cost phases — what "cost to start" vs "cost to run" means on the books page.
//   startup   §195 start-up/organizational costs: anything (other than
//             equipment) dated before the business opened. Up to $5,000
//             deductible in year one, the rest amortized over 15 years.
//   equipment Durable tools and machines. Deducted via the de minimis
//             election (≤ $2,500/item) or §179 — never lumped into start-up,
//             and never "operating".
//   operating Everything else once the doors are open.
// The business start date lives in owner_settings (`business.startDate`) and
// defaults to the day the LLC was filed.
// ---------------------------------------------------------------------------
export type CostPhase = "startup" | "equipment" | "operating";
export const DEFAULT_BUSINESS_START = "2026-09-11";

export function phaseFor(category: string, spentOn: string, businessStart: string = DEFAULT_BUSINESS_START): CostPhase {
  if (category === "equipment") return "equipment";
  if (category === "startup") return "startup";
  return spentOn.slice(0, 10) < businessStart.slice(0, 10) ? "startup" : "operating";
}

export const PHASE_LABEL: Record<CostPhase, string> = {
  startup: "Start-up",
  equipment: "Equipment",
  operating: "Operating",
};
