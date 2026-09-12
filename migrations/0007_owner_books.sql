-- Owner books: what each job actually brought in, what it cost, how far the
-- truck drove for it, and every time the customer was contacted.
--
-- Why this lives in the app instead of a spreadsheet: the booking row already
-- knows the address, the date, the quoted range and whether the deposit hit —
-- so a payment, a dump fee and the round-trip miles can be pinned to the job
-- they belong to, and Schedule C comes out as a query instead of a shoebox.
--
-- Mirrored by `ensureOwnerTables()` in src/lib/owner-schema.ts (same pattern as
-- pay-columns.ts) so a Netlify deploy that never ran migrate.mjs still works.

-- The ?s= tag the visitor arrived with (dh = door hanger, gbp = Business
-- Profile, chat = the phone-line dispatcher). Null for anything untagged.
alter table bookings add column if not exists source text;

-- What the job was actually billed at once it was done. Null until the owner
-- closes it out; the quoted range stays in estimate_low/high untouched.
alter table bookings add column if not exists final_cents integer;

-- Owner-only notes (gate code, dog, "leaves are under the deck") — never shown
-- to the customer, never mixed into `notes`, which the customer wrote.
alter table bookings add column if not exists owner_notes text;
alter table bookings add column if not exists completed_at timestamptz;
alter table bookings add column if not exists last_contact_at timestamptz;

-- Contact log + timeline. kind: note | call | text | email | status | payment | system
create table if not exists booking_events (
  id          serial primary key,
  booking_id  integer not null references bookings (id) on delete cascade,
  kind        text not null,
  body        text,
  created_at  timestamptz not null default now()
);
create index if not exists booking_events_booking_idx
  on booking_events (booking_id, created_at desc);

-- Money in. Stripe writes rows through the webhook (stripe_session_id keeps a
-- replayed event from double-counting); cash, check, Venmo and Zelle are
-- recorded by the owner on the job page. Revenue = sum of this table.
create table if not exists payments (
  id                 serial primary key,
  booking_id         integer references bookings (id) on delete set null,
  paid_on            date not null default current_date,
  amount_cents       integer not null,
  method             text not null,            -- stripe | cash | check | venmo | zelle | other
  kind               text not null default 'payment', -- deposit | balance | payment | refund
  stripe_session_id  text unique,
  note               text,
  created_at         timestamptz not null default now()
);
create index if not exists payments_paid_on_idx on payments (paid_on);

-- Money out. `category` is a key from EXPENSE_CATEGORIES in src/lib/tax.ts,
-- each of which maps to a Schedule C line. booking_id pins a dump fee to the
-- job it was paid for; null is overhead.
create table if not exists expenses (
  id           serial primary key,
  spent_on     date not null,
  vendor       text,
  category     text not null,
  amount_cents integer not null,
  paid_with    text,                            -- card | checking | personal | cash
  booking_id   integer references bookings (id) on delete set null,
  note         text,
  created_at   timestamptz not null default now()
);
create index if not exists expenses_spent_on_idx on expenses (spent_on);

-- The mileage log the IRS actually accepts: date, where, why, how far, written
-- at the time. rate_cents is stamped from the IRS table for that date so a
-- mid-year rate change (2026 had one) is preserved per trip.
create table if not exists mileage_trips (
  id          serial primary key,
  driven_on   date not null,
  miles       numeric(7,1) not null,
  purpose     text not null,
  from_label  text,
  to_label    text,
  booking_id  integer references bookings (id) on delete set null,
  rate_cents  numeric(6,1) not null,
  created_at  timestamptz not null default now()
);
create index if not exists mileage_trips_driven_on_idx on mileage_trips (driven_on);

-- Small owner preferences: home address + coords (for suggested trip miles),
-- landfill, tax reserve percent, deduction-checklist ticks.
create table if not exists owner_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);
