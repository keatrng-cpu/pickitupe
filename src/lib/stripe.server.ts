import Stripe from "stripe";

// No `server-only` package in this stack (that is a Next.js convention and it
// is not a dependency here). The guard is the filename: TanStack Start only
// pulls a module into the client graph if a client component imports it, and
// nothing may import this file outside a createServerFn handler. The runtime
// check below is the real backstop — if this ever evaluates in a browser it
// throws loudly instead of leaking a key into a bundle.
if (typeof window !== "undefined") {
  throw new Error(
    "src/lib/stripe.server.ts was imported into the browser bundle. It holds the Stripe secret key — import it only from a server function.",
  );
}

/**
 * Stripe client. Server-only, and deliberately lazy.
 *
 * LIVE vs TEST IS DECIDED ENTIRELY BY THE KEY. There is no mode flag in this
 * codebase and there must never be one — `sk_live_`/`rk_live_` in
 * STRIPE_SECRET_KEY is live, `sk_test_`/`rk_test_` is test. Anything that
 * branches on NODE_ENV to pick a Stripe mode is a bug waiting to charge a real
 * card from a preview build.
 *
 * The key in production is a RESTRICTED key (`rk_live_`), not a standard
 * secret key, because this Stripe account is shared with several unrelated
 * ventures. A restricted key is a drop-in replacement scoped to: Customers
 * write, Checkout Sessions write, Subscriptions write, Billing Portal Sessions
 * write, Products + Prices read. If a call ever fails with a permissions
 * error, that list is the first thing to check — it is not an SDK problem.
 *
 * Lazy because the home page must render with no Stripe configured at all.
 * `getOfferStatus` already holds that line for the database; the same rule
 * applies here. Nothing at import time may throw.
 */
let cached: Stripe | null = null;

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. The seasonal plan cannot be sold until it is configured in Netlify (Production context).",
    );
  }
  if (!cached) {
    cached = new Stripe(key, {
      // Pinned deliberately. An unpinned client silently follows whatever
      // version the account is on, which changes webhook payload shapes under
      // you. Bump this and the webhook endpoint's version together, never one
      // alone.
      apiVersion: "2026-05-27.dahlia" as Stripe.LatestApiVersion,
      appInfo: { name: "Pick It Up E", url: "https://pickitupe.com" },
      // Netlify functions are short-lived; fail fast rather than hanging a
      // request that the customer is watching a spinner for.
      timeout: 15_000,
      maxNetworkRetries: 2,
    });
  }
  return cached;
}

/** True when a real-money key is configured. Used to label the owner board. */
export function isLiveMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_live_") || key.startsWith("rk_live_");
}
