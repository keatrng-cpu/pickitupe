# Schema

Read the root [`CLAUDE.md`](../CLAUDE.md). This is the **owner ops** workstream.

| File | Job |
|---|---|
| `0001_auth.sql` | better-auth tables |
| `0002_bookings.sql` | core bookings |
| `0003_booking_intel.sql` | size, estimate, urgency, lat/lon, neighbor |
| `0004`–`0006` | block deal, seasonal plan subscriptions, deposits/invoices |
| `0007_owner_books.sql` | owner books: `source`/`final_cents`/`owner_notes`/`completed_at`/`last_contact_at` on bookings; `booking_events`, `payments`, `expenses`, `mileage_trips`, `owner_settings`. Mirrored by `ensureOwnerTables()` in `src/lib/owner-schema.ts` — change both or neither |

Add a new numbered file — do not rewrite history. Run `npm run db:migrate` locally; Netlify build does **not** migrate.
