import { getSql } from "@/lib/db";
import { tierForPriceId } from "@/lib/plan";

/**
 * Persistence for the seasonal plan. Every write in here is idempotent,
 * because Stripe guarantees AT-LEAST-ONCE delivery: it retries for days on any
 * non-2xx, and it will replay an event after a timeout even when the first
 * attempt actually succeeded. Anything that appends rather than upserts will
 * eventually double.
 */

/**
 * Records an event id and reports whether this is the first time we have seen
 * it. `on conflict do nothing` + `returning` makes the check and the claim one
 * atomic statement — a plain "select then insert" races itself when Stripe
 * fires two retries at two concurrent function instances.
 */
export async function claimEvent(id: string, type: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ id: string }>`
    insert into stripe_events (id, type)
    values (${id}, ${type})
    on conflict (id) do nothing
    returning id
  `;
  return rows.length > 0;
}

export type SubscriptionUpsert = {
  subscriptionId: string;
  customerId: string;
  priceId: string | null;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

export async function upsertSubscription(input: SubscriptionUpsert) {
  const sql = await getSql();
  const tier = input.priceId ? tierForPriceId(input.priceId) : null;

  await sql`
    insert into subscriptions
      (stripe_subscription_id, stripe_customer_id, stripe_price_id, tier,
       status, cancel_at_period_end, current_period_end,
       name, email, phone, address, updated_at)
    values
      (${input.subscriptionId}, ${input.customerId}, ${input.priceId}, ${tier},
       ${input.status}, ${input.cancelAtPeriodEnd}, ${input.currentPeriodEnd},
       ${input.name ?? null}, ${input.email ?? null}, ${input.phone ?? null},
       ${input.address ?? null}, now())
    on conflict (stripe_subscription_id) do update set
      stripe_customer_id   = excluded.stripe_customer_id,
      stripe_price_id      = coalesce(excluded.stripe_price_id, subscriptions.stripe_price_id),
      tier                 = coalesce(excluded.tier, subscriptions.tier),
      status               = excluded.status,
      cancel_at_period_end = excluded.cancel_at_period_end,
      current_period_end   = coalesce(excluded.current_period_end, subscriptions.current_period_end),
      -- Contact details only ever fill blanks. The checkout session is the one
      -- place we collect a service address; a later subscription.updated event
      -- carries no address and must not wipe it.
      name    = coalesce(subscriptions.name, excluded.name),
      email   = coalesce(subscriptions.email, excluded.email),
      phone   = coalesce(subscriptions.phone, excluded.phone),
      address = coalesce(subscriptions.address, excluded.address),
      updated_at = now()
  `;
}

/**
 * A new paid year has begun. Clears the renewal-notice stamp and the two
 * visit stamps so the coming season starts unserviced — this is what makes
 * `invoice.paid` the event that actually schedules work.
 */
export async function startNewServiceYear(
  subscriptionId: string,
  currentPeriodEnd: string | null,
) {
  const sql = await getSql();
  await sql`
    update subscriptions set
      renewal_notice_sent_at = null,
      spring_visit_done_at   = null,
      fall_visit_done_at     = null,
      current_period_end     = coalesce(${currentPeriodEnd}, current_period_end),
      updated_at             = now()
    where stripe_subscription_id = ${subscriptionId}
  `;
}

export type SubscriptionRow = {
  id: number;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: string | null;
  status: string;
  cancel_at_period_end: boolean;
  current_period_end: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  renewal_notice_sent_at: string | null;
  spring_visit_done_at: string | null;
  fall_visit_done_at: string | null;
};

export async function listSubscriptions(): Promise<SubscriptionRow[]> {
  const sql = await getSql();
  return sql<SubscriptionRow>`
    select id, stripe_subscription_id, stripe_customer_id, tier, status,
           cancel_at_period_end, current_period_end, name, email, phone,
           address, renewal_notice_sent_at, spring_visit_done_at,
           fall_visit_done_at
    from subscriptions
    order by current_period_end asc nulls last
    limit 500
  `;
}

/**
 * Subscriptions renewing inside the NDCC 51-37 notice window that have not
 * been noticed yet.
 *
 * The statute wants notice at least 30 and not more than 60 days out, so the
 * job targets the middle of that band rather than its edge — running at day 30
 * exactly means one failed cron run puts the business out of compliance with
 * no room to recover.
 */
export async function subscriptionsDueForRenewalNotice(): Promise<SubscriptionRow[]> {
  const sql = await getSql();
  return sql<SubscriptionRow>`
    select id, stripe_subscription_id, stripe_customer_id, tier, status,
           cancel_at_period_end, current_period_end, name, email, phone,
           address, renewal_notice_sent_at, spring_visit_done_at,
           fall_visit_done_at
    from subscriptions
    where status in ('active', 'trialing', 'past_due')
      and cancel_at_period_end = false
      and renewal_notice_sent_at is null
      and current_period_end is not null
      and current_period_end <= now() + interval '55 days'
      and current_period_end >= now() + interval '31 days'
    order by current_period_end asc
  `;
}

export async function markRenewalNoticeSent(subscriptionId: string) {
  const sql = await getSql();
  await sql`
    update subscriptions
    set renewal_notice_sent_at = now(), updated_at = now()
    where stripe_subscription_id = ${subscriptionId}
  `;
}
