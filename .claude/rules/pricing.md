---
paths:
  - src/lib/pricebook.ts
  - PRICEBOOK.md
  - src/components/quote-form.tsx
  - src/components/hero-quote-teaser.tsx
  - src/components/address-field.tsx
  - src/lib/service-area.ts
---

Pricing / quoting workstream. Money numbers live only in `src/lib/pricebook.ts`. Promo is book-by **September 20**, **20% off up to $75** — not a first-25-jobs cap. Don't restyle the haul animation from here.

`hero-quote-teaser.tsx` calls `estimate()` the same way `quote-form.tsx` does, with `addOns: []` and no name/phone/address fields — it's a teaser, not a booking form. If you change what `estimate()` requires, update both call sites.

Both estimate cards render the price at `font-display font-bold text-5xl` (48px, bold) with the savings pill at `text-sm font-semibold` — keep these two in sync if you retune either one, they're meant to read as siblings.

`quote-form.tsx` field order is now: contact grid → size → add-ons → urgency → optional details (notes/neighbor/photo) → **estimate card** → refusal warning → submit. The estimate card moved to sit last, directly above the button — don't move it back above the optional-details block without a reason, that's a deliberate fix (the number the funnel exists to deliver used to be buried mid-form).
