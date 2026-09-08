import type { Sql } from "@/lib/db";

let ready = false;

/** Additive columns so a deploy that skips migrate.mjs still takes a card. */
export async function ensurePayColumns(sql: Sql) {
  if (ready) return;
  const stmts = [
    "alter table bookings add column if not exists deposit_cents integer not null default 5000",
    "alter table bookings add column if not exists deposit_paid boolean not null default false",
    "alter table bookings add column if not exists deposit_session_id text",
    "alter table bookings add column if not exists extra_addresses text",
    "alter table bookings add column if not exists pack text",
    "alter table bookings add column if not exists stops integer not null default 1",
    "alter table bookings add column if not exists balance_paid boolean not null default false",
    "alter table bookings add column if not exists invoice_session_id text",
  ];
  for (const text of stmts) {
    await sql.query(text);
  }
  ready = true;
}

export const BOOKING_SELECT = `
  id, name, phone, email, address, service, notes,
  preferred_date, early_bird, status, created_at,
  urgency, job_size, add_ons, estimate_low, estimate_high,
  lat, lon, area_tier, neighbor_of,
  households, applied_discount, discount_amount,
  deposit_cents, deposit_paid, extra_addresses, pack, stops,
  balance_paid, invoice_session_id
`;
