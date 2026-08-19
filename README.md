# Pick It Up E

Seasonal leaf cleanup and junk removal site for **Grand Forks, ND**.

- Phone: [218-779-2553](tel:2187792553)
- Offer: book by **September 20** for **20% off, up to $75**, on any job
- Rig: silver 2020 crew-cab pickup (Sierra 1500)

Live site is a booking funnel: door-hanger mock, quote form, owner jobs board.

## Stack

- [TanStack Start](https://tanstack.com/start) + React + Vite
- Tailwind CSS v4
- Postgres via Neon in production, [PGLite](https://pglite.dev) when `DATABASE_URL` is unset
- [better-auth](https://www.better-auth.com) (Google / X in the Grok preview; optional locally)

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Dev server: `http://localhost:8080`

```bash
npm run typecheck
npm run build        # build only — run `npm run db:migrate` separately
```

## Routes

| Path | What |
| --- | --- |
| `/` | Home, offer, door hanger, scroll-haul scene, quote form |
| `/book` | Booking form |
| `/jobs` | Signed-in jobs board |
| `/login` | Auth |
| `/api/auth/*` | better-auth handler |

## Data

Migrations live in [`migrations/`](migrations/). Bookings table is `0002_bookings.sql`; `0003_booking_intel.sql` adds the job size, instant estimate, urgency, coordinates, and neighbor referral. The promo is a fixed calendar deadline (`PROMO_DEADLINE` in `src/lib/pricebook.ts`), not a database count — `early_bird` on a row just records whether that booking landed before the cutoff.

## Quoting

The site prices a job the moment the customer picks a size — deterministic math from
[`src/lib/pricebook.ts`](src/lib/pricebook.ts), no API key and no model involved. Ranges are
documented and calibrated in [`PRICEBOOK.md`](PRICEBOOK.md).

Address entry uses keyless OpenStreetMap search bounded to Greater Grand Forks
([`src/lib/service-area.ts`](src/lib/service-area.ts)) and tells the customer on the spot whether
we come out that far. Lookup failures never block a booking.

## Brand

Forest green `#064e2a`, cream `#ede3d0`, gold `#d4c4a0`, UND Sioux green `#009a44`. Display type: Playfair Display. UI type: Outfit.

Do **not** leave cards in mailboxes — that's a federal offense (18 U.S.C. § 1725). Hang on doors / hand to people.

Showing the truck we own is fine. Do not use GMC / Sierra wordmarks as if GM sponsors the business.

## For Claude / other agents

Read [`CLAUDE.md`](CLAUDE.md) before editing.
