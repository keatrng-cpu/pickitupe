import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));
const { hoursBetween, payCents, totals, weekOf } = await import("../src/lib/crew-math.ts");

test("hours are decimal to the hundredth and never negative", () => {
  assert.equal(hoursBetween("2026-09-17T13:00:00Z", "2026-09-17T16:45:00Z"), 3.75);
  assert.equal(hoursBetween("2026-09-17T13:00:00Z", "2026-09-17T12:00:00Z"), 0);
  assert.equal(hoursBetween("2026-09-17T13:00:00Z", null, new Date("2026-09-17T13:30:00Z")), 0.5);
});

test("pay rounds to the cent per shift and totals add up", () => {
  assert.equal(payCents(3.75, 1800), 6750);
  const t = totals(
    [
      { started_at: "2026-09-17T13:00:00Z", ended_at: "2026-09-17T16:45:00Z" },
      { started_at: "2026-09-18T13:00:00Z", ended_at: "2026-09-18T15:20:00Z" },
    ],
    1800,
  );
  assert.equal(t.hours, 6.08);
  assert.equal(t.cents, 6750 + Math.round(2.33 * 1800));
});

test("weeks start Monday", () => {
  assert.deepEqual(weekOf("2026-09-17"), ["2026-09-14", "2026-09-20"]); // Thursday
  assert.deepEqual(weekOf("2026-09-14"), ["2026-09-14", "2026-09-20"]); // Monday
  assert.deepEqual(weekOf("2026-09-20"), ["2026-09-14", "2026-09-20"]); // Sunday
});
