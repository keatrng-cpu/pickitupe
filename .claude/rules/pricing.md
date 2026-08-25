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

`hero-quote-teaser.tsx` calls `estimate()` the same way `quote-form.tsx` does — same service, size **and** add-ons, no name/phone/address fields. It's the page's only estimate now, not a stripped-down teaser. If you change what `estimate()` requires, update both call sites.

**The home page no longer renders `QuoteForm`.** It used to, in a `#book` section, which made the page carry the same estimate widget twice (owner: *"this is too long and basically a duplicate from the one up top"*). `QuoteForm` renders only on `/book`. The hero card links there with `search={{ service, size, addons }}` and `book.tsx` validates those against the pricebook before seeding the form — so a visitor never picks their service and yard size twice, and a hand-edited URL falls back to defaults instead of feeding a bad key into `estimate()`.

Both estimate cards render the price at `font-display font-bold text-5xl` (48px, bold) with the savings pill at `text-sm font-semibold` — keep these two in sync if you retune either one, they're meant to read as siblings.

`quote-form.tsx` field order is now: contact grid → size → add-ons → urgency → optional details (notes/neighbor/photo) → **estimate card** → refusal warning → submit. The estimate card moved to sit last, directly above the button — don't move it back above the optional-details block without a reason, that's a deliberate fix (the number the funnel exists to deliver used to be buried mid-form).
