import assert from "node:assert/strict";
import test from "node:test";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./ts-strip-loader.mjs", pathToFileURL("./scripts/"));
const { isAmericanPennyPowerObject: isApp } = await import("../src/lib/foreign-stripe.ts");

/**
 * The Stripe account is shared. American Penny Power events must be ignored by
 * the webhook (no subscription rows, no service years); our own must not be.
 */
test("APP checkout sessions, subscriptions and invoices are recognised", () => {
  assert.equal(isApp({ mode: "subscription", metadata: { app: "apg", kind: "membership" } }), true);
  assert.equal(isApp({ id: "sub_1", metadata: { app: "apg" } }), true);
  assert.equal(isApp({ id: "sub_1", metadata: {}, items: { data: [{ price: { lookup_key: "apg_collector_monthly", metadata: {} } }] } }), true);
  assert.equal(isApp({ id: "sub_1", items: { data: [{ price: { id: "price_x", product: "prod_VV7WilOqfRELCF" } }] } }), true);
  assert.equal(isApp({ id: "sub_1", items: { data: [{ price: { metadata: { app: "apg" } } }] } }), true);
  assert.equal(isApp({ id: "in_1", subscription_details: { metadata: { app: "apg" } } }), true);
  assert.equal(isApp({ id: "in_1", parent: { subscription_details: { subscription: "sub_1", metadata: { app: "apg" } } } }), true);
  assert.equal(isApp({ id: "in_1", lines: { data: [{ pricing: { price_details: { lookup_key: "apg_collector_monthly" } } }] } }), true);
});

test("Pick It Up E objects are not mistaken for APP ones", () => {
  assert.equal(isApp({ mode: "payment", metadata: { bookingId: "12", kind: "deposit" } }), false);
  assert.equal(isApp({ mode: "subscription", metadata: {} }), false);
  assert.equal(isApp({ id: "sub_p", items: { data: [{ price: { id: "price_p", lookup_key: "pickitupe_plus", metadata: {}, product: "prod_pick" } }] } }), false);
  assert.equal(isApp({ id: "in_p", subscription: "sub_p", lines: { data: [{ price: { lookup_key: null } }] } }), false);
  assert.equal(isApp(null), false);
  assert.equal(isApp("evt"), false);
});
