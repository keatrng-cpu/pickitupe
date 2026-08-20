# Schema

Read the root [`CLAUDE.md`](../CLAUDE.md). This is the **owner ops** workstream.

| File | Job |
|---|---|
| `0001_auth.sql` | better-auth tables |
| `0002_bookings.sql` | core bookings |
| `0003_booking_intel.sql` | size, estimate, urgency, lat/lon, neighbor |

Add a new numbered file — do not rewrite history. Run `npm run db:migrate` locally; Netlify build does **not** migrate.
