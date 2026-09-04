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

**The block deal lives in `pricebook.ts` now, not on the invoice pad.** It was
advertised in six copy sites with zero pricing logic behind it, which put a
small-lot block booking at $51 against a $55 floor and let a standard lot
undercut the small-lot list price. `estimate()` takes `households` and returns
`appliedDiscount: "none" | "promo" | "block"`.

- Tiers: 2 houses $25 each, 3+ $40 each. **$40 is derived**, `BLOCK_MIN_JOB_LOW
  (95) − FLOOR (55)` — the largest credit that can never breach the floor. A
  unit test asserts the identity; don't retune either bound alone.
- **Never stacks.** Customer gets the promo or the block credit, whichever is
  better, compared on the HIGH end of the range (not total saved — that picked
  the flat credit while raising the top-of-range number, so recruiting a
  neighbour made the quote worse).
- Gated to jobs listing >= $95, so a one-item haul can't be discounted through
  the floor.
- The UI must read `appliedDiscount` rather than assuming the promo — saying
  "book by Sept 20 to lock this rate" on a block-credit quote is a false
  statement about why the number is what it is.
- `submitBooking` recomputes the credit server-side, like it already does for
  `earlyBird`. Never trust a client for something that changes the price.

Run `node --test scripts/pricebook.test.mjs` after touching any of this.

**`garage-basement` is no longer a ServiceKey.** The owner cut it as a duplicate
of the other haul options. Its $50-$100 labour survives as the `cleanout`
add-on — do not delete that, and do not re-add the service without also removing
the add-on, or cleanouts get charged the labour twice.

**Same-week rush is a real price input.** `estimate()` takes `urgency`, and
`this-week` adds `RUSH_SURCHARGE` ($10-$20). `before-vacuum` is the seasonal
norm and adds nothing. `submitBooking` recomputes it server-side like everything
else that moves the price.

**The neighbour's address is required when `households >= 2`,** enforced by a
zod `.refine` on the whole form object rather than on the field. The block credit
is a promise to route two houses on one street the same day; without the address
that is unroutable, so the discount cannot be claimed without it.

**`single-item` is no longer a ServiceKey either.** It priced identically to
`furniture-appliances` (both used the first three LOAD_SIZES), so it was pure
duplication in the picker. A single item is a **size**, not a service — the
"One item" tier ($59-$95) is how it is quoted, and a test asserts that tier
still exists so removing the service cannot quietly delete the cheapest thing
the business sells.

**"Something else" now requires a description.** `otherDescription` is required
by zod when `service === "other"`, rendered directly under the picker rather
than down with the optional details, and merged into `notes` on submit so it
lands in a column that already exists and gets scanned by `refusedItemsIn`.
The estimator returns `range: null` for that service — the description IS the
request, and without it the owner gets a booking saying only "something else"
and has to phone back, which is the callback this form exists to prevent.

**The job assessor recommends INPUTS, never a price.** `src/lib/assess-actions.ts`
reads the notes and/or photo and returns a size tier plus add-on keys; `estimate()`
still computes the number from them, exactly as when a customer picks by hand.
That split is deliberate and load-bearing — a model emitting a dollar figure is
guessing at the one thing this site refuses to guess at.

Everything the model returns is validated against the pricebook before it leaves
the server: an unknown size value or add-on key is dropped, and refused items are
re-derived with `refusedItemsIn()` so a model that misses one still cannot let it
through. The suggestion is applied only when the customer presses "Use this" —
the quote never changes under them.

The old `XAI_API_KEY` photo path is deleted. It was never configured in prod, so
its only live behaviour was an error toast.

**Gutter cleaning is a ServiceKey, single-story only.** `GUTTER_SIZES` has two
tiers (standard $135-$165, complex $175-$215 — the complex tier is a marked
ASSUMPTION at ~1.3x, re-time it). The `downspout` add-on applies to
`gutter-cleaning` only. The chat agent and the job assessor are both told the
limit explicitly: ground vacuum, no ladder, two-story homes are handed off to a
gutter company. If a two-story tier is ever added, the equipment has to change
first — the price is downstream of the vacuum's reach, not the other way round.
