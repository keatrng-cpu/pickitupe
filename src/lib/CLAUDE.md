# Pricing, bookings, SEO, area

Read the root [`CLAUDE.md`](../../CLAUDE.md) first.

| File | Job |
|---|---|
| `pricebook.ts` | **Only place money numbers live.** Promo is Sept 20 / 20% / $75 cap, not a "first 25" count. Recalibrate via `PRICEBOOK.md`. |
| `bookings.ts` | Server fns. `getOfferStatus` must not require Postgres (home page depends on it). |
| `service-area.ts` | Keyless OSM, boxed to Greater Grand Forks. Lookup failure must not block a booking. |
| `messages.ts` | One-tap owner texts. Keep promo wording in sync with pricebook. |
| `seo.ts` | LocalBusiness + FAQ JSON-LD. FAQ answers on `src/routes/index.tsx` **must match**. |
| `db.ts` | PGLite if `DATABASE_URL` is empty; Postgres otherwise. |
| `auth/*` | Leave unless the task is auth. |

Do not expand `multiplayer/` — scaffold leftover.
