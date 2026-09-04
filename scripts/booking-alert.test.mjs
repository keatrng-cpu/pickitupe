import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));

const { bookingAlertSubject, bookingAlertText, serviceLabel } = await import(
  "../src/lib/booking-alert.ts"
);

/**
 * The alert is the owner's only push signal that a lead exists. These tests
 * pin the fields that decide whether the owner can act from the phone without
 * opening the board: who, where, what, how much, how soon.
 */

const full = {
  id: 42,
  name: "Dana Larson",
  phone: "(701) 555-0142",
  email: "dana@example.com",
  address: "1414 Belmont Rd, Grand Forks, ND",
  service: "gutter-cleaning",
  jobSize: "standard",
  addOns: ["downspout"],
  estimateLow: 160,
  estimateHigh: 215,
  urgency: "this-week",
  preferredDate: "next Saturday",
  notes: "Downspout on the north side overflows.",
  neighborOf: "1418 Belmont Rd",
  households: 2,
  appliedDiscount: "block",
  discount: 25,
  areaTier: "core",
};

test("subject carries id, service label, address and flags a rush", () => {
  const s = bookingAlertSubject(full);
  assert.ok(s.startsWith("RUSH — "), "same-week jobs must be visibly flagged");
  assert.ok(s.includes("#42"));
  assert.ok(s.includes("Gutter cleaning"));
  assert.ok(s.includes("1414 Belmont Rd"));
  assert.ok(!bookingAlertSubject({ ...full, urgency: "flexible" }).includes("RUSH"));
});

test("body has everything needed to act from a phone", () => {
  const t = bookingAlertText(full, "https://pickitupe.com/jobs");
  for (const must of [
    "Dana Larson",
    "(701) 555-0142",
    "dana@example.com",
    "1414 Belmont Rd",
    "Gutter cleaning",
    "standard",
    "downspout",
    "$160–$215",
    "block",
    "THIS WEEK",
    "next Saturday",
    "overflows",
    "2 houses",
    "1418 Belmont Rd",
    "sms:7015550142",
    "https://pickitupe.com/jobs",
  ]) {
    assert.ok(t.includes(must), `alert body missing: ${must}`);
  }
});

test("sparse bookings render without blanks or crashes", () => {
  const t = bookingAlertText(
    {
      id: 1,
      name: "A B",
      phone: "7015550000",
      address: "1 Main St",
      service: "other",
    },
    "https://pickitupe.com/jobs",
  );
  assert.ok(t.includes("Something else"));
  assert.ok(t.includes("needs a quote"), "a null estimate must say so, not print NaN");
  assert.ok(!/undefined|null|NaN/.test(t), `stray literal in alert:\n${t}`);
  assert.ok(!t.includes("Block:"), "single household must not print a block line");
});

test("unknown service keys fall back to the raw key rather than throwing", () => {
  assert.equal(serviceLabel("leaf-cleanup"), "Fall leaf cleanup");
  assert.equal(serviceLabel("something-new"), "something-new");
});
