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
