# NOW — pickitupe current truth

**As of:** 2026-11-13 · winter stack: PR 9 (hours) → PR 10 (winter redesign) → branch `claude/winter-higgsfield` (this). None merged.

> Keep under 150 lines. Current truth only; history goes in `ai/DECISIONS.md`.

## Goal
Winter 2026–27: lead with junk removal, appliance pickup and estate / whole-house cleanouts. Leaves come back in spring.

## In flight
- PR 9: truck hours built around the landfill (Mon–Fri 9:30–5:30 · Sat 12–4). Merge first.
- PR 10: junk-first home, estate / appliance / pricing pages, scroll road, snow. Merge second.
- `claude/winter-higgsfield` (stacked on PR 10): classy vintage truck (`src/lib/truck-art.ts`) on site + print, 3D hero off (`MEDIA.hero3D`), quick-quote truck-bed gauge, "Text a photo" button, guest confirmation email fix, phone centralised in `src/lib/site-phone.ts`, winter print set, Higgsfield workflow, marketing plans v2.

## Known facts / constraints
- **Phone:** owner (Nov 13) is retiring 701-213-3969 for a Twilio line + ElevenLabs voice agent. Not bought yet ((701) 738-1596 sat at Twilio's buy screen; 738-3210 was not reserved). Site still shows 3969 until the new line answers. Swap = `SITE_PHONE_DIGITS` + `NEW_LINE_DIGITS` in `src/lib/site-phone.ts`; `src/lib/og/site.json` share text also carries the number (JSON, edit by hand). Keep 3969 forwarding 6+ months.
- **Print:** `node scripts/make-winter-print.mjs` → `print/winter/` (card `?s=bcg`, canvass hanger `?s=dhc`, neighbor hanger `?s=dhn`). Proof-stamped until `NEW_LINE_DIGITS` is set. Hangers also wait on Grand Forks Finance (transient merchant license question). Ice-melt offer printed through Dec 31, 2026 — owner must confirm and stock it.
- **Higgsfield:** not connected. Owner adds connector `https://mcp.higgsfield.ai/mcp` in Claude settings on a Plus plan. Refs: `media/higgsfield/` (`node scripts/make-higgsfield-refs.mjs`). Ingest: `scripts/ingest-clip.mjs` (needs ffmpeg) → `MEDIA.heroLoop`. Brand animation only — never AI before/after or "job" footage.
- Guest bookers: Stripe checkout email is now saved to the booking (`finalizePaidDeposit(..., { email })`), so booked / done / reminder emails reach guests. Stripe no longer asks for phone (our form already requires it).
- Nav (winter): Junk removal · Estate cleanouts · Appliances · Landlords · Pricing · Book.
- Estate prices are `ESTATE_TIERS` in `pricebook.ts`; estate CTA is a free walkthrough, no $50 card wall.
- Every loop pauses via `html[data-motion="paused"]` and is off under prefers-reduced-motion. Scroll-driven motion = CSS scroll timelines only.
- Marketing plans v2: `docs/marketing/` (repo is public).
- `npm test` glob doesn't expand on Windows; run `node --test scripts/*.test.mjs` from bash (166/167 pass, 0 fail).
