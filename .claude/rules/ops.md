---
paths:
  - src/routes/jobs.tsx
  - src/routes/jobs_.*.tsx
  - src/routes/crew.tsx
  - src/lib/crew.ts
  - src/lib/crew-math.ts
  - src/components/owner-shell.tsx
  - src/lib/books.ts
  - src/lib/tax.ts
  - src/lib/owner-schema.ts
  - src/lib/owner.ts
  - src/lib/receipts.ts
  - src/lib/receipt-client.ts
  - src/components/receipt-drop.tsx
  - src/routes/api/receipt.$id.ts
  - src/lib/messages.ts
  - src/lib/bookings.ts
  - src/lib/db.ts
  - migrations/**
---

Owner ops workstream. `/jobs` is the signed-in board; `/jobs/$id`, `/jobs/books`, `/jobs/customers`, `/jobs/crew` are its siblings (trailing-underscore route files). `/crew` is the helpers' page — gated by a `crew_members` row, not `isOwnerEmail`; anything a crew session may read about a booking is listed in `CREW_BOOKING_SELECT` (src/lib/crew.ts) and nothing with money is on it. `getOfferStatus` must keep working with no database. Don't rewrite home-hero marketing copy from here.

Books rules: money is integer cents; IRS mileage rates live only in `src/lib/tax.ts` `MILEAGE_RATES` (newest first — the lookup depends on it) and are stamped onto each trip when logged, never recomputed; Schedule C line numbers live in `EXPENSE_CATEGORIES`; trip suggestions are `routeMiles()` over a chain of stops (home / job / drop sites from `OwnerSettings.drops`, stored as JSON in `owner_settings.drops.sites` — the old `landfill.*` keys are read once as a fallback) — never assume home → job → home; `ensureOwnerTables()` must mirror `migrations/0007`–`0010` exactly (RLS on for every table, no policies — the app is the owner role). Stripe payments are recorded by the webhook with `stripe_session_id` unique — never insert those by hand. Run `node --test scripts/tax.test.mjs` after touching tax.ts and `node --test scripts/crew.test.mjs` after touching crew-math.ts. Crew pay: `recordPay` books gross wages (line 26) only — employer FICA comes from the payroll provider's reports.

Receipts: the model only READS and RECOMMENDS a category; cents, category validity, cost phase and duplicate checks are decided in `scanReceipt` server-side. Never trust a model-supplied number without the zod schema. Receipt bytes stay in Postgres — don't add a storage bucket for this. `/api/receipt/$id` answers 404 (not 403) to anyone but the owner.
