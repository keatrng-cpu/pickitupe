import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// schedule.ts only imports pricebook.ts (pure) — same loader as the pricebook tests.
register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));

const {
  capacityFor,
  landfillCapacityFor,
  needFor,
  needsLandfill,
  fitsDay,
  firstOpenDay,
  dayOptions,
  fillFromRows,
  overCapacity,
  slotsFor,
} = await import("../src/lib/schedule.ts");

// 2026-11-16 is a Monday, 2026-11-21 a Saturday, 2026-11-22 a Sunday.
const MON = "2026-11-16";
const SAT = "2026-11-21";
const SUN = "2026-11-22";

test("capacity follows the truck hours: 4 weekday, 2 Saturday, 0 Sunday", () => {
  assert.equal(capacityFor(MON), 4);
  assert.equal(capacityFor(SAT), 2);
  assert.equal(capacityFor(SUN), 0);
});

test("landfill work only fits weekday slots A–C, never Saturday", () => {
  assert.equal(landfillCapacityFor(MON), 3);
  assert.equal(landfillCapacityFor(SAT), 0);
  assert.equal(landfillCapacityFor(SUN), 0);
});

test("junk reslot: full and half take 2 slots, two trips 3, a few pieces 1", () => {
  assert.equal(slotsFor("junk-removal", "full"), 2);
  assert.equal(slotsFor("junk-removal", "half"), 2);
  assert.equal(slotsFor("junk-removal", "overflow"), 3);
  assert.equal(slotsFor("junk-removal", "quarter"), 1);
  assert.equal(slotsFor("junk-removal", "single"), 1);
});

test("only junk loads bigger than one piece need the landfill", () => {
  assert.equal(needsLandfill("junk-removal", "full"), true);
  assert.equal(needsLandfill("junk-removal", "quarter"), true);
  assert.equal(needsLandfill("junk-removal", "single"), false);
  assert.equal(needsLandfill("junk-removal", "bags"), false);
  assert.equal(needsLandfill("gutter-cleaning", "standard"), false);
  assert.equal(needsLandfill("leaf-cleanup", "medium"), false);
});

test("a full truck fits a weekday but never a Saturday", () => {
  const full = needFor("junk-removal", "full");
  assert.equal(fitsDay(MON, 0, 0, full), true);
  assert.equal(fitsDay(SAT, 0, 0, full), false);
});

test("one piece books on Saturday (rides to the Monday dump)", () => {
  const one = needFor("junk-removal", "single");
  assert.equal(fitsDay(SAT, 0, 0, one), true);
  assert.equal(fitsDay(SAT, 1, 0, one), true);
  assert.equal(fitsDay(SAT, 2, 0, one), false);
});

test("the 4th weekday slot (3:30–5:30) takes light work, not a landfill load", () => {
  // Three landfill slots already used: a one-piece job still fits, a few-pieces load does not.
  assert.equal(fitsDay(MON, 3, 3, needFor("junk-removal", "single")), true);
  assert.equal(fitsDay(MON, 3, 3, needFor("junk-removal", "quarter")), false);
});

test("two trips fill the whole landfill window and leave slot D for light work", () => {
  const two = needFor("junk-removal", "overflow");
  assert.equal(fitsDay(MON, 0, 0, two), true);
  assert.equal(fitsDay(MON, 1, 1, two), false);
  assert.equal(fitsDay(MON, 3, 3, needFor("junk-removal", "single")), true);
});

test("fillFromRows counts landfill slots apart from total slots", () => {
  const fill = fillFromRows([
    { day: MON, service: "junk-removal", size: "full", addOns: [] },
    { day: MON, service: "junk-removal", size: "single", addOns: [] },
  ]);
  assert.deepEqual(fill, [{ day: MON, used: 3, landfill: 2 }]);
});

test("firstOpenDay skips Sunday and Saturday for a landfill load", () => {
  // From Friday 2026-11-13: Sat 14 can't take a full load, Sun 15 is closed → Mon 16.
  const day = firstOpenDay([], needFor("junk-removal", "full"), "2026-11-13");
  assert.equal(day, MON);
  // A single piece can take that Saturday.
  assert.equal(firstOpenDay([], needFor("junk-removal", "single"), "2026-11-13"), "2026-11-14");
});

test("dayOptions reports each day's own capacity", () => {
  const opts = dayOptions([], needFor("junk-removal", "single"), "2026-11-20");
  const sat = opts.find((d) => d.day === SAT);
  assert.equal(sat.capacity, 2);
  assert.equal(opts.some((d) => d.day === SUN), false);
});

test("overCapacity catches a race past either limit", () => {
  assert.equal(overCapacity({ day: MON, used: 4, landfill: 3 }), false);
  assert.equal(overCapacity({ day: MON, used: 4, landfill: 4 }), true);
  assert.equal(overCapacity({ day: SAT, used: 3, landfill: 0 }), true);
  assert.equal(overCapacity({ day: SAT, used: 2, landfill: 1 }), true);
});
