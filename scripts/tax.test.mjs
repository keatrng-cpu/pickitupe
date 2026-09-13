import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// tax.ts is pure arithmetic over IRS tables — same loader trick as pricebook.
register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));

const {
  mileageRateFor,
  mileageDeductionCents,
  selfEmploymentTaxCents,
  suggestedTripMiles,
  haversineMiles,
  EXPENSE_CATEGORIES,
  categoryFor,
  MILEAGE_RATES,
} = await import("../src/lib/tax.ts");

test("2026 has two rates and the July 1 switch lands on the right day", () => {
  assert.equal(mileageRateFor("2026-06-30"), 72.5);
  assert.equal(mileageRateFor("2026-07-01"), 76);
  assert.equal(mileageRateFor("2026-12-31"), 76);
  assert.equal(mileageRateFor("2025-09-11"), 70);
});

test("dates before the table fall back to the oldest rate, not zero", () => {
  const oldest = MILEAGE_RATES[MILEAGE_RATES.length - 1].cents;
  assert.equal(mileageRateFor("2019-01-01"), oldest);
});

test("the table is newest-first, which the lookup depends on", () => {
  for (let i = 1; i < MILEAGE_RATES.length; i += 1) {
    assert.ok(MILEAGE_RATES[i - 1].from > MILEAGE_RATES[i].from, "MILEAGE_RATES must be sorted newest first");
  }
});

test("deduction uses the rate stamped on each trip, in whole cents", () => {
  // 10 mi @ 72.5¢ + 10 mi @ 76¢ = 725 + 760 = 1485¢
  assert.equal(mileageDeductionCents([{ miles: 10, rate_cents: 72.5 }, { miles: 10, rate_cents: 76 }]), 1485);
  assert.equal(mileageDeductionCents([]), 0);
});

test("self-employment tax: 15.3% of 92.35% of net, zero at or below zero", () => {
  assert.equal(selfEmploymentTaxCents(0), 0);
  assert.equal(selfEmploymentTaxCents(-50_000), 0);
  // $10,000 net → 10,000 × 0.9235 × 0.153 = $1,412.96
  assert.equal(selfEmploymentTaxCents(1_000_000), 141_296);
});

test("every expense category maps to a Schedule C line and unknown keys fall to Other", () => {
  for (const c of EXPENSE_CATEGORIES) assert.match(c.line, /^\d+[a-z]?$/);
  assert.equal(categoryFor("not-a-category").key, "other");
  assert.equal(categoryFor("dump-fees").line, "27a");
});

test("trip suggestion: home→job→home, or via the landfill when set", () => {
  const home = { lat: 47.9060, lon: -97.0555 }; // S 20th St
  const job = { lat: 47.9195, lon: -97.0311 }; // Belmont & 6th Ave S
  const straight = haversineMiles(home.lat, home.lon, job.lat, job.lon);
  assert.ok(straight > 1 && straight < 2.5, `straight-line should be ~1.5 mi, got ${straight}`);
  const roundTrip = suggestedTripMiles(home, job, null);
  assert.ok(Math.abs(roundTrip - 2 * straight * 1.3) < 0.1);
  const landfill = { lat: 47.98, lon: -97.13 };
  assert.ok(suggestedTripMiles(home, job, landfill) > roundTrip);
  assert.equal(suggestedTripMiles(home, null, landfill), null);
});

test("route legs: start at the last drop, unload, roll on to the next job — no return leg", async () => {
  const { routeMiles, ROAD_FACTOR } = await import("../src/lib/tax.ts");
  const home = { lat: 47.906, lon: -97.0555 };
  const job = { lat: 47.9195, lon: -97.0311 };
  const landfill = { lat: 47.98, lon: -97.13 };
  const compost = { lat: 47.95, lon: -97.1 };
  // classic leg equals the old function
  assert.equal(routeMiles([home, job, landfill, home]), suggestedTripMiles(home, job, landfill));
  // landfill → job → compost, then straight to the next job: two legs, no home
  const chained = routeMiles([landfill, job, compost, null]);
  const expected = (haversineMiles(landfill.lat, landfill.lon, job.lat, job.lon) + haversineMiles(job.lat, job.lon, compost.lat, compost.lon)) * ROAD_FACTOR;
  assert.ok(Math.abs(chained - expected) < 0.1, `${chained} vs ${expected}`);
  // null stops are skipped; a single real stop is no trip
  assert.equal(routeMiles([home, null, null]), null);
  assert.equal(routeMiles([null, job, null, home]), routeMiles([job, home]));
});

test("cost phase: equipment is always equipment, pre-open spend is start-up, the rest operating", async () => {
  const { phaseFor, DEFAULT_BUSINESS_START } = await import("../src/lib/tax.ts");
  assert.equal(DEFAULT_BUSINESS_START, "2026-09-11");
  assert.equal(phaseFor("equipment", "2026-12-01"), "equipment");
  assert.equal(phaseFor("supplies", "2026-09-10"), "startup");
  assert.equal(phaseFor("supplies", "2026-09-11"), "operating");
  assert.equal(phaseFor("startup", "2026-12-01"), "startup");
  assert.equal(phaseFor("dump-fees", "2026-10-01", "2026-10-15"), "startup");
  assert.equal(phaseFor("dump-fees", "2026-10-15", "2026-10-15"), "operating");
});
