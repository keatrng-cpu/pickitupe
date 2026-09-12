---
paths:
  - src/routes/jobs.tsx
  - src/routes/jobs_.*.tsx
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

Owner ops workstream. `/jobs` is the signed-in board; `/jobs/$id`, `/jobs/books`, `/jobs/customers` are its siblings (trailing-underscore route files). `getOfferStatus` must keep working with no database. Don't rewrite home-hero marketing copy from here.

Books rules: money is integer cents; IRS mileage rates live only in `src/lib/tax.ts` `MILEAGE_RATES` (newest first — the lookup depends on it) and are stamped onto each trip when logged, never recomputed; Schedule C line numbers live in `EXPENSE_CATEGORIES`; `ensureOwnerTables()` must mirror `migrations/0007_owner_books.sql` exactly. Stripe payments are recorded by the webhook with `stripe_session_id` unique — never insert those by hand. Run `node --test scripts/tax.test.mjs` after touching tax.ts.

Receipts: the model only READS and RECOMMENDS a category; cents, category validity, cost phase and duplicate checks are decided in `scanReceipt` server-side. Never trust a model-supplied number without the zod schema. Receipt bytes stay in Postgres — don't add a storage bucket for this. `/api/receipt/$id` answers 404 (not 403) to anyone but the owner.
