import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// pricebook.ts is TypeScript with no runtime dependencies — strip the types and
// import it directly rather than standing up a bundler for one pure module.
register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));

const {
  estimate,
  blockCreditFor,
  sizeOptionsFor,
  BLOCK_TIERS,
  BLOCK_MIN_JOB_LOW,
  PROMO_CAP,
} = await import("../src/lib/pricebook.ts");

const FLOOR = 55;

const base = {
  service: "leaf-cleanup",
  size: "medium",
  addOns: [],
  earlyBird: true,
  notes: "",
};

/** Every size on every service, so the floor test can't miss a tier. */
function allJobs() {
  const services = [
    "leaf-cleanup",
    "junk-removal",
    "garage-basement",
    "furniture-appliances",
    "single-item",
  ];
  const out = [];
  for (const service of services) {
    for (const size of sizeOptionsFor(service)) {
      out.push({ service, size: size.value });
    }
  }
  return out;
}

test("THE floor invariant: nothing ever quotes below $55, on any combination", () => {
  for (const job of allJobs()) {
    for (const earlyBird of [true, false]) {
      for (const households of [1, 2, 3, 4, 12]) {
        const q = estimate({ ...base, ...job, earlyBird, households });
        if (!q.range) continue;
        assert.ok(
          q.range.low >= FLOOR,
          `${job.service}/${job.size} earlyBird=${earlyBird} households=${households} -> low $${q.range.low} breaches floor`,
        );
        assert.ok(q.range.high >= FLOOR);
        assert.ok(q.range.high >= q.range.low);
      }
    }
  }
});

test("discounts never stack — applied credit is always exactly one mechanism", () => {
  for (const job of allJobs()) {
    for (const households of [1, 2, 3, 5]) {
      const q = estimate({ ...base, ...job, earlyBird: true, households });
      if (!q.range || !q.beforeDiscount) continue;

      assert.ok(["none", "promo", "block"].includes(q.appliedDiscount));

      // The saving must equal what that ONE mechanism alone produces.
      const savedHigh = q.beforeDiscount.high - q.range.high;
      if (q.appliedDiscount === "block") {
        const credit = blockCreditFor(households, q.beforeDiscount.low);
        assert.equal(
          savedHigh,
          credit,
          `${job.service}/${job.size} block saving should be exactly the credit`,
        );
      }
      if (q.appliedDiscount === "promo") {
        const expected = Math.min(q.beforeDiscount.high * 0.2, PROMO_CAP);
        assert.ok(
          Math.abs(savedHigh - Math.round(expected)) <= 1,
          `${job.service}/${job.size} promo saving should be the capped percent`,
        );
      }
    }
  }
});

test("the customer always gets the better of the two credits", () => {
  for (const job of allJobs()) {
    for (const households of [2, 3]) {
      const withBoth = estimate({ ...base, ...job, earlyBird: true, households });
      const promoOnly = estimate({ ...base, ...job, earlyBird: true, households: 1 });
      const blockOnly = estimate({ ...base, ...job, earlyBird: false, households });
      if (!withBoth.range || !promoOnly.range || !blockOnly.range) continue;

      const best = Math.min(promoOnly.range.high, blockOnly.range.high);
      assert.equal(
        withBoth.range.high,
        best,
        `${job.service}/${job.size} households=${households}: should pick the better credit`,
      );
    }
  }
});

test("recruiting a neighbour can NEVER make your own quote worse", () => {
  for (const job of allJobs()) {
    for (const earlyBird of [true, false]) {
      const alone = estimate({ ...base, ...job, earlyBird, households: 1 });
      for (const households of [2, 3, 6]) {
        const together = estimate({ ...base, ...job, earlyBird, households });
        if (!alone.range || !together.range) continue;
        assert.ok(
          together.range.high <= alone.range.high,
          `${job.service}/${job.size} earlyBird=${earlyBird}: ${households} houses quoted a HIGHER top than going alone (${together.range.high} > ${alone.range.high})`,
        );
        assert.ok(
          together.range.low <= alone.range.low,
          `${job.service}/${job.size} earlyBird=${earlyBird}: ${households} houses quoted a HIGHER bottom than going alone`,
        );
      }
    }
  }
});

test("the three defects that were live in production are fixed", () => {
  // 1. Small lot + promo + 2-house block used to be hand-computed to $51.
  const smallPair = estimate({
    ...base,
    size: "small",
    earlyBird: true,
    households: 2,
  });
  assert.ok(smallPair.range.low >= FLOOR, "small-lot block booking breached floor");

  // The $40 tier is the one derived to land exactly on the floor.
  const smallTrio = estimate({
    ...base,
    size: "small",
    earlyBird: true,
    households: 3,
  });
  assert.equal(
    smallTrio.range.low,
    FLOOR,
    "small lot at 3 houses should land exactly on the floor, never through it",
  );

  // 2. The ladder used to invert: standard lot cheaper than small lot's list.
  const smallList = sizeOptionsFor("leaf-cleanup").find((s) => s.value === "small").range.low;
  const standard = estimate({
    ...base,
    size: "medium",
    earlyBird: true,
    households: 2,
  });
  assert.ok(
    standard.range.low >= smallList - 40,
    "standard lot should not undercut the small-lot list price by more than one credit",
  );

  // 3. The credit used to apply to a single mattress and go under floor twice.
  const oneItem = estimate({
    ...base,
    service: "single-item",
    size: "single",
    earlyBird: true,
    households: 3,
  });
  assert.equal(
    blockCreditFor(3, oneItem.beforeDiscount.low),
    0,
    "one-item hauls must not qualify for the block credit",
  );
  assert.ok(oneItem.range.low >= FLOOR);
});

test("$40 is derived from the floor, not chosen — this guards the derivation", () => {
  const topCredit = Math.max(...BLOCK_TIERS.map((t) => t.credit));
  assert.equal(
    topCredit,
    BLOCK_MIN_JOB_LOW - FLOOR,
    "largest block credit must equal (minimum qualifying job - floor), or the floor guarantee is void",
  );
});

test("block tiers: 1 house none, 2 houses $25, 3+ houses $40", () => {
  assert.equal(blockCreditFor(1, 200), 0);
  assert.equal(blockCreditFor(2, 200), 25);
  assert.equal(blockCreditFor(3, 200), 40);
  assert.equal(blockCreditFor(9, 200), 40);
  // Gated by job size regardless of household count.
  assert.equal(blockCreditFor(3, BLOCK_MIN_JOB_LOW - 1), 0);
  assert.equal(blockCreditFor(3, BLOCK_MIN_JOB_LOW), 40);
  // Junk input must not throw or produce a credit.
  assert.equal(blockCreditFor(NaN, 200), 0);
  assert.equal(blockCreditFor(0, 200), 0);
});

test("the note always matches the credit that was actually applied", () => {
  const blockWins = estimate({
    ...base,
    size: "small",
    earlyBird: true,
    households: 3,
  });
  assert.equal(blockWins.appliedDiscount, "block");
  assert.ok(
    blockWins.notes.some((n) => n.includes("Block deal applied")),
    "a block-credit quote must say so",
  );
  assert.ok(
    !blockWins.notes.some((n) => n.includes("is already taken off this range")),
    "a block-credit quote must NOT claim the promo produced the number",
  );

  const promoWins = estimate({
    ...base,
    size: "large",
    earlyBird: true,
    households: 2,
  });
  assert.equal(promoWins.appliedDiscount, "promo");
  assert.ok(promoWins.notes.some((n) => n.includes("already taken off this range")));
});

test("no households / no promo is plain list price", () => {
  const q = estimate({ ...base, earlyBird: false, households: 1 });
  assert.equal(q.appliedDiscount, "none");
  assert.equal(q.discount, 0);
  assert.deepEqual(q.range, q.beforeDiscount);
});
