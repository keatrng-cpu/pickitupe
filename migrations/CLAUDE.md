# Schema

Read the root [`CLAUDE.md`](../CLAUDE.md). This is the **owner ops** workstream.

| File | Job |
|---|---|
| `0001_auth.sql` | better-auth tables |
| `0002_bookings.sql` | core bookings |
| `0003_booking_intel.sql` | size, estimate, urgency, lat/lon, neighbor |
| `0004`–`0006` | block deal, seasonal plan subscriptions, deposits/invoices |
| `0007_owner_books.sql` | owner books: `source`/`final_cents`/`owner_notes`/`completed_at`/`last_contact_at` on bookings; `booking_events`, `payments`, `expenses`, `mileage_trips`, `owner_settings`. Mirrored by `ensureOwnerTables()` in `src/lib/owner-schema.ts` — change both or neither |
| `0008_receipts.sql` | `receipts` (bytes in Postgres, sha256 unique, model output in `extracted`) + `expenses.receipt_id/phase/tax_cents/review/line_items`. Also mirrored by `ensureOwnerTables()` |
| `0009_crew.sql` | `crew_members` (sign-in email, `wage_cents`, `active`) + `time_entries` (one row per shift; `ended_at` null = on the clock; `paid_expense_id` → the wages expense). Mirrored by `ensureOwnerTables()` |
| `0010_rls.sql` | `enable row level security` on every public table, **no policies**. The app connects as the owning `postgres` role (RLS never applies to the owner); this only closes the Supabase Data API / anon key. New table → add it here and in `ensureOwnerTables()` |

Add a new numbered file — do not rewrite history. Run `npm run db:migrate` locally; Netlify build does **not** migrate.
