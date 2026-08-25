import { createFileRoute } from "@tanstack/react-router";
import type Stripe from "stripe";
import { getStripe, stripeConfigured } from "@/lib/stripe.server";
import {
  claimEvent,
  startNewServiceYear,
  upsertSubscription,
} from "@/lib/subscriptions.server";

/**
 * Stripe webhook endpoint — https://pickitupe.com/api/stripe/webhook
 *
 * THE RAW BODY IS LOAD-BEARING. Signature verification hashes the exact bytes
 * Stripe sent. `await request.text()` is correct; anything that parses to JSON
 * first and re-serialises will produce a different byte sequence (key order,
 * whitespace, unicode escaping) and every signature check will fail with an
 * error that looks like a bad secret.
 *
 * Events are claimed by id before any work happens, because Stripe guarantees
 * AT-LEAST-ONCE delivery: it retries for days on a non-2xx and replays after a
 * timeout even when the first attempt succeeded.
 *
 * RESPONSE DISCIPLINE: return 2xx as soon as the event is understood, even if
 * we chose to ignore it. A non-2xx makes Stripe retry with backoff and
 * eventually disable the endpoint — so an unhandled event type must be a 200,
 * not a 400. The only things that legitimately fail are a bad signature (400,
 * never retry) and a database error (500, please do retry).
 */
export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!stripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
          // 503 rather than 500: this is "not configured yet", and Stripe will
          // retry, which is the behaviour we want if a deploy briefly races
          // the env var being set.
          return new Response("stripe not configured", { status: 503 });
        }

        const signature = request.headers.get("stripe-signature");
        if (!signature) {
          return new Response("missing stripe-signature", { status: 400 });
        }

        const raw = await request.text();

        let event: Stripe.Event;
        try {
          event = getStripe().webhooks.constructEvent(
            raw,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET,
          );
        } catch (err) {
          // Never retryable — a replayed-but-stale or forged request. 400 tells
          // Stripe to stop rather than hammering the endpoint into disablement.
          const message = err instanceof Error ? err.message : "bad signature";
          return new Response(`signature verification failed: ${message}`, {
            status: 400,
          });
        }

        try {
          const fresh = await claimEvent(event.id, event.type);
          if (!fresh) {
            return new Response("duplicate, already applied", { status: 200 });
          }

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              if (session.mode !== "subscription" || !session.subscription) break;

              // Re-fetch rather than trusting the session's expansion state:
              // the session carries the subscription as a bare id unless it was
              // explicitly expanded, and we need the price and period.
              const sub = await getStripe().subscriptions.retrieve(
                typeof session.subscription === "string"
                  ? session.subscription
                  : session.subscription.id,
              );

              await upsertSubscription({
                subscriptionId: sub.id,
                customerId:
                  typeof sub.customer === "string" ? sub.customer : sub.customer.id,
                priceId: sub.items.data[0]?.price?.id ?? null,
                status: sub.status,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                currentPeriodEnd: sub.items.data[0]?.current_period_end
                  ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
                  : null,
                // The only place a service address is ever collected.
                name: session.customer_details?.name ?? null,
                email: session.customer_details?.email ?? null,
                phone: session.customer_details?.phone ?? null,
                address: formatAddress(session),
              });
              break;
            }

            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted": {
              const sub = event.data.object as Stripe.Subscription;
              await upsertSubscription({
                subscriptionId: sub.id,
                customerId:
                  typeof sub.customer === "string" ? sub.customer : sub.customer.id,
                priceId: sub.items.data[0]?.price?.id ?? null,
                // A deleted subscription arrives with whatever status it ended
                // on; force 'canceled' so the owner board and the notice job
                // both stop treating it as live.
                status:
                  event.type === "customer.subscription.deleted"
                    ? "canceled"
                    : sub.status,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                currentPeriodEnd: sub.items.data[0]?.current_period_end
                  ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
                  : null,
              });
              break;
            }

            case "invoice.paid": {
              // THE event that starts a service year. Not checkout.completed —
              // that only means they got through the form; this means the money
              // actually cleared, and it fires again on every renewal.
              const invoice = event.data.object as Stripe.Invoice;
              const subId = subscriptionIdOf(invoice);
              if (!subId) break;

              const sub = await getStripe().subscriptions.retrieve(subId);
              const end = sub.items.data[0]?.current_period_end
                ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
                : null;

              await upsertSubscription({
                subscriptionId: sub.id,
                customerId:
                  typeof sub.customer === "string" ? sub.customer : sub.customer.id,
                priceId: sub.items.data[0]?.price?.id ?? null,
                status: sub.status,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                currentPeriodEnd: end,
              });
              await startNewServiceYear(sub.id, end);
              break;
            }

            case "invoice.payment_failed": {
              const invoice = event.data.object as Stripe.Invoice;
              const subId = subscriptionIdOf(invoice);
              if (!subId) break;
              const sub = await getStripe().subscriptions.retrieve(subId);
              await upsertSubscription({
                subscriptionId: sub.id,
                customerId:
                  typeof sub.customer === "string" ? sub.customer : sub.customer.id,
                priceId: sub.items.data[0]?.price?.id ?? null,
                status: sub.status,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                currentPeriodEnd: sub.items.data[0]?.current_period_end
                  ? new Date(sub.items.data[0].current_period_end * 1000).toISOString()
                  : null,
              });
              break;
            }

            default:
              // Understood and deliberately ignored. Still a 200.
              break;
          }

          return new Response("ok", { status: 200 });
        } catch (err) {
          // Genuine failure on our side — 500 so Stripe retries. The event id
          // was already claimed, so log enough to replay it by hand if the
          // retries are exhausted.
          console.error(
            `[stripe-webhook] failed applying ${event.type} ${event.id}:`,
            err,
          );
          return new Response("handler error", { status: 500 });
        }
      },
    },
  },
});

/** Subscription id off an invoice, across API-version shape changes. */
function subscriptionIdOf(invoice: Stripe.Invoice): string | null {
  const direct = (invoice as unknown as { subscription?: string | { id: string } })
    .subscription;
  if (typeof direct === "string") return direct;
  if (direct && typeof direct === "object") return direct.id;
  const line = invoice.lines?.data?.[0] as unknown as
    | { subscription?: string | { id: string } }
    | undefined;
  const fromLine = line?.subscription;
  if (typeof fromLine === "string") return fromLine;
  if (fromLine && typeof fromLine === "object") return fromLine.id;
  return null;
}

function formatAddress(session: Stripe.Checkout.Session): string | null {
  const a =
    session.customer_details?.address ??
    (session.collected_information as unknown as
      | { shipping_details?: { address?: Stripe.Address } }
      | undefined)?.shipping_details?.address;
  if (!a) return null;
  return [a.line1, a.line2, a.city, a.state, a.postal_code]
    .filter(Boolean)
    .join(", ");
}
