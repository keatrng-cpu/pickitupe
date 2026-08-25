-- Seasonal Cleanup Plan — one spring visit + one fall visit, billed yearly
-- through Stripe and auto-renewing.
--
-- Why any of this is stored locally rather than read from Stripe on demand:
-- the owner board has to work when Stripe is slow or unreachable, and the
-- scheduled North Dakota pre-renewal notice (below) has to be able to find who
-- is due without paging the whole Stripe account every night.

create table if not exists subscriptions (
  id                       serial primary key,

  -- Stripe identity. subscription_id is the natural key; the unique index is
  -- what makes webhook handling idempotent, because Stripe delivers at least
  -- once and will happily send the same event twice.
  stripe_subscription_id   text not null unique,
  stripe_customer_id       text not null,
  stripe_price_id          text,

  -- Which lot tier they bought: 'small' | 'standard' | 'large'. Stored rather
  -- than derived from the price id so that archiving and re-creating a Stripe
  -- price (the only way to change an amount — prices are immutable) does not
  -- orphan the tier of everyone who already subscribed.
  tier                     text,

  -- Mirror of the Stripe subscription status: incomplete, trialing, active,
  -- past_due, canceled, unpaid, paused.
  status                   text not null default 'incomplete',
  cancel_at_period_end     boolean not null default false,
  current_period_end       timestamptz,

  -- Contact + service address, captured at checkout. Denormalised on purpose:
  -- this is the crew sheet, and it must survive the customer later editing
  -- their Stripe billing details.
  name                     text,
  email                    text,
  phone                    text,
  address                  text,

  -- NDCC ch. 51-37 requires written notice of an automatic renewal at least 30
  -- and not more than 60 days before it renews. Stripe's invoice.upcoming
  -- fires only a few days out and CANNOT satisfy this, so the notice is sent
  -- by our own scheduled job and stamped here. Null means not yet sent for the
  -- current period; the job clears it when a new period starts.
  renewal_notice_sent_at   timestamptz,

  -- Service delivery for the current paid year, so the plan can be shown as
  -- honoured (or not) without reconstructing it from job history.
  spring_visit_done_at     timestamptz,
  fall_visit_done_at       timestamptz,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- The renewal-notice job scans on this every day; without it that scan is a
-- full table sweep once the plan has any real number of subscribers.
create index if not exists subscriptions_period_end_idx
  on subscriptions (current_period_end)
  where status in ('active', 'trialing', 'past_due');

create index if not exists subscriptions_customer_idx
  on subscriptions (stripe_customer_id);

-- Every webhook event we have already applied. Stripe guarantees at-least-once
-- delivery, retries for days on any non-2xx, and will replay an event after a
-- timeout even if the first attempt actually succeeded. Recording the event id
-- is what stops a replayed invoice.paid from double-scheduling a visit.
create table if not exists stripe_events (
  id           text primary key,
  type         text not null,
  received_at  timestamptz not null default now()
);
