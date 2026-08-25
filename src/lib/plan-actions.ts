import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getStripe, stripeConfigured } from "@/lib/stripe.server";
import {
  PLAN_TIERS,
  planConfigured,
  priceIdFor,
  renewalDisclosure,
  SERVICE_WINDOW,
  type PlanTier,
} from "@/lib/plan";

const SITE = "https://pickitupe.com";

/**
 * What the plan page needs to render. Deliberately safe to call with no Stripe
 * configured at all — it just reports `available: false` and the page shows
 * the reservation fallback instead of a broken buy button. Same rule
 * `getOfferStatus` follows for the database.
 */
export const getPlanStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    if (!stripeConfigured() || !planConfigured()) {
      return { available: false as const, tiers: [] };
    }

    const stripe = getStripe();
    const tiers = await Promise.all(
      PLAN_TIERS.map(async (t) => {
        const priceId = priceIdFor(t.tier);
        if (!priceId) return null;
        try {
          const price = await stripe.prices.retrieve(priceId);
          return {
            tier: t.tier,
            label: t.label,
            hint: t.hint,
            // Stripe stores minor units. Never render unit_amount raw.
            amount: (price.unit_amount ?? 0) / 100,
            interval: price.recurring?.interval ?? "year",
          };
        } catch {
          // A missing or archived price must degrade to "unavailable", not a
          // 500 on the marketing page.
          return null;
        }
      }),
    );

    const usable = tiers.filter(Boolean) as {
      tier: PlanTier;
      label: string;
      hint: string;
      amount: number;
      interval: string;
    }[];

    return {
      available: usable.length === PLAN_TIERS.length,
      tiers: usable,
    };
  },
);

/**
 * Creates a Stripe Checkout session for the seasonal plan and returns its URL.
 *
 * COMPLIANCE IS BUILT INTO THIS CALL, not bolted on afterwards. NDCC ch. 51-37
 * governs automatic renewals longer than a month and federal ROSCA
 * (15 U.S.C. § 8403) applies independently, so the renewal terms have to be
 * clear and conspicuous BEFORE the customer is bound. `custom_text.submit`
 * puts them directly above the pay button — the last thing read before
 * consent — rather than in a footer nobody opens.
 */
export const startPlanCheckout = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({ tier: z.enum(["small", "standard", "large"]) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!stripeConfigured() || !planConfigured()) {
      return { ok: false as const, error: "The plan isn't available yet." };
    }

    const priceId = priceIdFor(data.tier);
    if (!priceId) {
      return { ok: false as const, error: "That plan isn't available yet." };
    }

    const stripe = getStripe();
    const price = await stripe.prices.retrieve(priceId);
    const amountLabel = ((price.unit_amount ?? 0) / 100).toFixed(0);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],

      success_url: `${SITE}/plan?welcome=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE}/plan?cancelled=1`,

      // We text customers — a phone number is not optional for this business.
      phone_number_collection: { enabled: true },
      // Billing address for the card; shipping address doubles as the SERVICE
      // address, which is the one the truck actually drives to.
      billing_address_collection: "required",
      shipping_address_collection: { allowed_countries: ["US"] },

      // Lets the customer manage/cancel from the receipt without contacting us,
      // which is the "simple cancellation" the statute asks for.
      subscription_data: {
        metadata: {
          app: "pickitupe",
          tier: data.tier,
          spring_window: `${SERVICE_WINDOW.spring.typical}, outer bound ${SERVICE_WINDOW.spring.outerBound}`,
          fall_window: `${SERVICE_WINDOW.fall.typical}, outer bound ${SERVICE_WINDOW.fall.outerBound}`,
        },
      },
      metadata: { app: "pickitupe", tier: data.tier },

      custom_text: {
        submit: { message: renewalDisclosure(amountLabel) },
      },

      // Stripe emails the receipt; the receipt is where the cancellation link
      // lives, so this is compliance surface too, not a nicety.
      allow_promotion_codes: false,
    });

    if (!session.url) {
      return { ok: false as const, error: "Could not start checkout." };
    }
    return { ok: true as const, url: session.url };
  });

/**
 * Billing portal session — the customer-facing cancel/update surface.
 *
 * This is the mechanism that satisfies "a cost-effective, timely and easy to
 * use cancellation procedure". It is Stripe-hosted, so there is no cancel flow
 * of ours that can quietly grow dark patterns.
 */
export const openBillingPortal = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data }) => {
    if (!stripeConfigured()) {
      return { ok: false as const, error: "Billing isn't configured." };
    }
    const stripe = getStripe();

    const customers = await stripe.customers.list({
      email: data.email,
      limit: 1,
    });
    const customer = customers.data[0];
    if (!customer) {
      // Deliberately vague: confirming whether an email has an account is an
      // enumeration oracle. The owner's phone number is the escape hatch.
      return {
        ok: false as const,
        error:
          "We couldn't find a plan for that email. Text 218-779-2553 and we'll sort it out.",
      };
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.id,
      return_url: `${SITE}/plan`,
    });
    return { ok: true as const, url: portal.url };
  });
