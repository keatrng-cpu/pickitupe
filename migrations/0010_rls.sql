-- Row Level Security on every table in `public`.
--
-- Supabase exposes `public` through PostgREST with the (by design, public)
-- anon key. Without RLS, anyone holding that key could list bookings —
-- customer names, phones, addresses — plus payments and receipt bytes. This
-- app never uses PostgREST: it connects straight to Postgres as the `postgres`
-- role that owns these tables, and RLS does not apply to a table's owner. So:
-- RLS on, zero policies = the Data API is a locked door and the app is
-- unchanged. Add a policy only if something ever needs the anon/authenticated
-- roles, and say why in this file.
--
-- Also covers better-auth's tables and _migrations. New tables: add a line
-- here AND in ensureOwnerTables() (src/lib/owner-schema.ts) — the Netlify
-- build never runs this file.

alter table if exists "user"          enable row level security;
alter table if exists session         enable row level security;
alter table if exists account         enable row level security;
alter table if exists verification    enable row level security;
alter table if exists _migrations     enable row level security;
alter table if exists bookings        enable row level security;
alter table if exists subscriptions   enable row level security;
alter table if exists stripe_events   enable row level security;
alter table if exists booking_events  enable row level security;
alter table if exists payments        enable row level security;
alter table if exists expenses        enable row level security;
alter table if exists mileage_trips   enable row level security;
alter table if exists owner_settings  enable row level security;
alter table if exists receipts        enable row level security;
alter table if exists crew_members    enable row level security;
alter table if exists time_entries    enable row level security;
