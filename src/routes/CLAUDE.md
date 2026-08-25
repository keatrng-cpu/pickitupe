# Pages

Read the root [`CLAUDE.md`](../../CLAUDE.md) first.

| File | Job |
|---|---|
| `__root.tsx` | HTML shell. Used to mount `FallingLeaves` here — removed at the owner's request. If it ever comes back it mounts once here, never per-page. |
| `index.tsx` | Home. Promo lines, FAQ (keep in sync with `src/lib/seo.ts`), block deal. **No booking form** — see below. SEO workstream owns copy; visual owns the haul video. |
| `book.tsx` | Booking page — the only place `QuoteForm` renders. Validates `?service/?size/?addons` from the hero card. No extra phone button — header/footer already have it. |
| `jobs.tsx` | Owner ops board. Don't rewrite marketing copy from here. |
| `login.tsx` | Auth. |
| `api/auth/$.ts` | better-auth catch-all. |

Phone: header + footer only, plus the door-hanger replica.

## The home page has no booking form

`index.tsx` used to render `QuoteForm` again in a `#book` section under the block
deal. It was the hero's estimate widget a second time wrapped in twelve contact
fields — owner: *"this is too long and basically a duplicate from the one up top,
get rid of it and maybe make the one up top a little more detailed."* So:

- the **estimate** lives once, in `hero-quote-teaser.tsx` (service, size, add-ons,
  price, line breakdown)
- the **contact fields** live once, on `/book`
- the hero CTA is a `<Link to="/book">` carrying `search={{ service, size, addons }}`

Don't put a form back on `index.tsx`, and don't drop the search params — without
them a visitor re-picks their service and yard size on arrival.

### `validateSearch` must return every key, always

`book.tsx`'s `parseSearch` returns `service`, `size` **and** `addons` on every
path, including as `undefined`. The router merges anything `validateSearch` does
not return straight back out of the raw query string, so an early `return {}` on
a bad `?service` let a raw `?addons=bogus` **string** reach `QuoteForm`, where
`addOns.filter` white-screened the booking page. TypeScript does not catch this —
the declared type is the sanitised one. `QuoteForm` keeps an `Array.isArray`
guard as a second line of defence. Verify URL changes in a browser, not by types.

Section field sequence on the home page, top to bottom: page / page / band /
page / band / band-paper / page. The FAQ deliberately has **no** `.band` wrapper —
a band against the `bg-deep` footer measures 1.136:1, i.e. no visible edge.
