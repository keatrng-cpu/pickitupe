import type { Sql } from "@/lib/db";

let ready = false;

/**
 * Same idea as `ensurePayColumns`: the Netlify build runs vite only, never
 * migrate.mjs, so the owner books tables are created on first use. Every
 * statement is idempotent and mirrors migrations/0007_owner_books.sql and
 * 0008_receipts.sql — change both or neither.
 */
export async function ensureOwnerTables(sql: Sql) {
  if (ready) return;
  const stmts = [
    "alter table bookings add column if not exists source text",
    "alter table bookings add column if not exists final_cents integer",
    "alter table bookings add column if not exists owner_notes text",
    "alter table bookings add column if not exists completed_at timestamptz",
    "alter table bookings add column if not exists last_contact_at timestamptz",
    `create table if not exists booking_events (
       id serial primary key,
       booking_id integer not null references bookings (id) on delete cascade,
       kind text not null,
       body text,
       created_at timestamptz not null default now()
     )`,
    "create index if not exists booking_events_booking_idx on booking_events (booking_id, created_at desc)",
    `create table if not exists payments (
       id serial primary key,
       booking_id integer references bookings (id) on delete set null,
       paid_on date not null default current_date,
       amount_cents integer not null,
       method text not null,
       kind text not null default 'payment',
       stripe_session_id text unique,
       note text,
       created_at timestamptz not null default now()
     )`,
    "create index if not exists payments_paid_on_idx on payments (paid_on)",
    `create table if not exists expenses (
       id serial primary key,
       spent_on date not null,
       vendor text,
       category text not null,
       amount_cents integer not null,
       paid_with text,
       booking_id integer references bookings (id) on delete set null,
       note text,
       created_at timestamptz not null default now()
     )`,
    "create index if not exists expenses_spent_on_idx on expenses (spent_on)",
    `create table if not exists mileage_trips (
       id serial primary key,
       driven_on date not null,
       miles numeric(7,1) not null,
       purpose text not null,
       from_label text,
       to_label text,
       booking_id integer references bookings (id) on delete set null,
       rate_cents numeric(6,1) not null,
       created_at timestamptz not null default now()
     )`,
    "create index if not exists mileage_trips_driven_on_idx on mileage_trips (driven_on)",
    `create table if not exists owner_settings (
       key text primary key,
       value text not null,
       updated_at timestamptz not null default now()
     )`,
    // 0008 — receipts + expense enrichment
    `create table if not exists receipts (
       id serial primary key,
       expense_id integer references expenses (id) on delete set null,
       mime text not null,
       bytes bytea not null,
       byte_size integer not null,
       sha256 text not null,
       extracted jsonb,
       created_at timestamptz not null default now()
     )`,
    "create unique index if not exists receipts_sha_idx on receipts (sha256)",
    "alter table expenses add column if not exists receipt_id integer",
    "alter table expenses add column if not exists phase text",
    "alter table expenses add column if not exists tax_cents integer",
    "alter table expenses add column if not exists review text",
    "alter table expenses add column if not exists line_items jsonb",
  ];
  for (const text of stmts) {
    await sql.query(text);
  }
  ready = true;
}

/** Log one line on a job's timeline. Never throws — the log must not break the action it records. */
export async function logEvent(
  sql: Sql,
  bookingId: number,
  kind: "note" | "call" | "text" | "email" | "status" | "payment" | "system",
  body: string,
) {
  try {
    await sql.query(
      "insert into booking_events (booking_id, kind, body) values ($1, $2, $3)",
      [bookingId, kind, body],
    );
    if (kind === "call" || kind === "text" || kind === "email") {
      await sql.query("update bookings set last_contact_at = now() where id = $1", [bookingId]);
    }
  } catch {
    // swallowed on purpose
  }
}
