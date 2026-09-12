-- Receipts: the photo or PDF behind an expense, kept in the database so the
-- owner books need no second storage service. Uploads are downscaled to
-- ~1600px JPEG client-side (200–500 KB); PDFs are capped at 4.5 MB.
--
-- `sha256` is unique so the same photo uploaded twice books nothing twice.
-- `extracted` keeps the model's raw JSON for audit — what it read, before the
-- owner corrected anything.
--
-- Mirrored by ensureOwnerTables() in src/lib/owner-schema.ts.

create table if not exists receipts (
  id          serial primary key,
  expense_id  integer references expenses (id) on delete set null,
  mime        text not null,
  bytes       bytea not null,
  byte_size   integer not null,
  sha256      text not null,
  extracted   jsonb,
  created_at  timestamptz not null default now()
);
create unique index if not exists receipts_sha_idx on receipts (sha256);

-- Expense enrichment from the scan.
--   phase: 'startup' (§195, before the business opened), 'equipment'
--          (de minimis / §179 — tracked separately, never "start-up"), or
--          'operating'. See phaseFor() in src/lib/tax.ts.
--   review: 'auto' (model booked it, high confidence), 'needs-review'
--           (low confidence, odd date, or looked like a duplicate), 'reviewed'
--           (owner touched it).
alter table expenses add column if not exists receipt_id integer;
alter table expenses add column if not exists phase text;
alter table expenses add column if not exists tax_cents integer;
alter table expenses add column if not exists review text;
alter table expenses add column if not exists line_items jsonb;
