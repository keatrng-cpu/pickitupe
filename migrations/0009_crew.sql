-- Crew: the helper(s). A crew member signs in at /login with the email listed
-- here and gets /crew — the day's jobs, clock in/out, their own hours and pay.
-- Nothing with a dollar sign from the customer side (estimates, deposits,
-- payments, books, owner notes) is ever selected for a crew session; see the
-- CREW_BOOKING_SELECT list in src/lib/crew.ts.
--
-- Mirrored by ensureOwnerTables() in src/lib/owner-schema.ts.

create table if not exists crew_members (
  id          serial primary key,
  email       text not null unique,          -- lowercased; the sign-in identity
  name        text not null,
  phone       text,
  wage_cents  integer not null default 1800, -- per hour
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- One row per shift. `ended_at` null = clocked in right now. `paid_expense_id`
-- is set when the owner records pay — that expense (category "wages") is how
-- payroll reaches Schedule C.
create table if not exists time_entries (
  id               serial primary key,
  crew_id          integer not null references crew_members (id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz,
  booking_id       integer references bookings (id) on delete set null,
  note             text,
  paid_expense_id  integer,
  created_at       timestamptz not null default now()
);
create index if not exists time_entries_crew_idx on time_entries (crew_id, started_at desc);
