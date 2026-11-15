# NOW — pickitupe current truth

**As of:** 2026-11-14 · winter stack: PR 9 (hours) → PR 10 (winter redesign) → PR 11 `claude/winter-higgsfield`. None merged.

> Keep under 150 lines. Current truth only; history goes in `ai/DECISIONS.md`.

## Goal
Winter 2026–27: junk-removal-first. Every order priced from the pricebook, easy to pick, and able to go through. Fun to scroll, plainly Grand Forks. Leaves come back in spring.

## In flight
- PR 9: truck hours built around the landfill (Mon–Fri 9:30–5:30 · Sat 12–4). Merge first.
- PR 10: junk-first home, estate / appliance / pricing pages, scroll road, snow. Merge second.
- PR 11 (stacked on PR 10):
  - Site: classy vintage truck (`src/lib/truck-art.ts`), 3D hero off (`MEDIA.hero3D`), **load slider with a pickup that fills** (home + `/call`), **junk add-ons pickable and priced** (stairs, long carry, cleanout, fridge/freezer/AC), Sorlie Bridge river scene in "Where we work", masked confirmation email on the booked screen.
  - Design pass (Nov 14, agency-design-director + vault quality bar):
    - haul rates as a printed **receipt** from `estimate()`, with one sourced like-for-like comparison (`LOCAL_COMPARABLE`)
    - numbered how-it-works steps on hairlines (no icon cards)
    - FAQ as `<details>`
    - segmented service switch
    - `scripts/price-literals.test.mjs` bans typed dollar amounts on price surfaces
  - Fixes: phone centralised in `src/lib/site-phone.ts`, guest email from Stripe saved, CountUp never stuck at $0, road no longer widens the page, reduced-motion ticker no longer wraps.
  - Also: winter print set, Higgsfield workflow, marketing plans v2, order e2e test.

## Known facts / constraints
- **Orders: `npm run e2e:order`** (start the `pickitupe-e2e` server first — the command is in the header of `scripts/order-e2e.mjs`). It runs a fake Stripe on 127.0.0.1:12111 and Chromium through these scenarios:
  - junk via the slider + add-ons
  - landlord tiered deposit
  - gutters
  - old furniture link
  - true guest via /book
  - signed webhook + replay
  - bad phone
  - cancel

  Last run: 26/26. The Stripe test-API override in `stripe.server.ts` works only for `sk_test_`/`rk_test_` keys on a loopback host.
- No `.env` locally (no Stripe / DB / Resend). Production has live keys — never run test orders against production or the deploy preview (the preview may share the production DB).
- Junk sizes for the slider = `featuredSizesFor("junk-removal")`. Add-ons = `addOnsFor(service)` minus bundle keys; "all" add-ons (long carry) count for junk.
- **Never compare our bed sizes with box-truck "half/full load" prices.** It's a different volume: `BED_CUBIC_YARDS` 2.5 yd vs 13–18 yd. Single-item comparison only; re-check `LOCAL_COMPARABLE` (LoadUp GF from $70, checked Nov 2026) each season.
- **Phone:** owner (Nov 13) is retiring 701-213-3969 for a Twilio line + ElevenLabs voice agent. Not bought yet. Site keeps 3969 until the new line answers.
  - Swap: `SITE_PHONE_DIGITS` + `NEW_LINE_DIGITS` in `src/lib/site-phone.ts`.
  - `src/lib/og/site.json` also carries the number — it's JSON, so edit it by hand.
  - Keep 3969 forwarding 6+ months.
- **Print:** `node scripts/make-winter-print.mjs` → `print/winter/` (card `?s=bcg`, canvass `?s=dhc`, neighbor `?s=dhn`).
  - Proof-stamped until `NEW_LINE_DIGITS` is set.
  - Hangers wait on Grand Forks Finance (transient merchant license).
  - Ice-melt offer through Dec 31, 2026 — owner to confirm and stock.
- **Higgsfield:** connector attached (Plus), but it can't generate.
  - `MEDIA.heroLoop` is still empty.
  - Kling 3.0 is 16:9 only → use `media/higgsfield/hero-start-frame-16x9.png`, then `ingest-clip.mjs --slot hero-loop --aspect 4:3`.
  - Brand animation only. The account's photoreal before/after and green-Toyota takes are off-limits.
- Nav (winter): Junk removal · Estate cleanouts · Appliances · Landlords · Pricing · Book. `/call` service chips: Junk · Gutters · Leaves.
- Every loop pauses via `html[data-motion="paused"]` and is off under prefers-reduced-motion. Scroll-driven motion = CSS scroll timelines only (`--road`, `--river`); the agency skills' GSAP/Lenis advice does not apply here.
- `npm test` glob doesn't expand on Windows; run `node --test scripts/*.test.mjs` from bash (172/173 pass, 0 fail).
- `dist/assets` contains PGLite wasm/data (~16 MB) from the server build; no client chunk references it, so browsers never download it.
