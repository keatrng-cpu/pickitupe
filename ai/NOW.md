# NOW — pickitupe current truth

**As of:** 2026-11-18 · winter stack reviewed and a scroll integration is on `cursor/winter-scroll-a1d6`.

> Keep under 150 lines. Current truth only; history goes in `ai/DECISIONS.md`.

## Goal
Winter site is junk-first, with landfill-aware hours, and one green work truck (the Higgsfield loop and cutouts). The cream mark stays the logo only.

## In flight
- PR 9 hours, PR 10 winter pages, PR 11 phone/print/slider, PR 12 count-up fix: reviewed GO. Merge 9 → 10 → 11 → 12, then the scroll integration.
- Integration: hero loop in `MEDIA.heroLoop` (poster is LCP, video attaches after first paint, 9:16 source on phones), snow/confetti overlay, estate before/after stills plus a play-once clip, green cutout on the how-it-works road, nav micros. 3D hero stays off so it does not load beside the loop.

## Known facts / constraints
- Backup of pre-winter main: `backup/pre-scroll-anim-20261113` at `27b6d381`.
- Site phone is still `701-213-3969` via `src/lib/site-phone.ts`. Print stays unready until `NEW_LINE_DIGITS` is set.
- Estate ranges live in `ESTATE_TIERS` (winter plan). Existing haul rates are unchanged.
- Hero counters read pricebook/schedule values only (`$59`, `$50`, `4`). Count-up cannot go negative.
- Do not present the estate stills as a customer's job. Caption says the walkthrough sets the price.
- `prefers-reduced-motion` and the Pause snow toggle keep stills. No video seeking.
- Lighthouse mobile on the production preview: perf 96, LCP 2.3s, CLS ~0.001. Live baseline before this work was perf 89, LCP 3.3s, CLS 0.
