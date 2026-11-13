# NOW — pickitupe current truth

**As of:** 2026-11-13 · winter junk-first redesign (branch `claude/winter-junk-3d`, stacked on PR 9 `claude/winter-booking-hours`).

> Keep under 150 lines. Current truth only; history goes in `ai/DECISIONS.md`.

## Goal
Winter 2026–27: lead with junk removal, appliance pickup and estate / whole-house cleanouts. Leaves come back in spring.

## In flight
- PR 9: truck hours built around the landfill (weekdays 9:30–5:30, Sat 12–4). Not merged.
- Winter redesign PR (stacked on PR 9): junk-first home, 3D truck hero, estate / appliance / pricing pages, scroll road, snow. Not merged. Merge PR 9 first.
- Owner may supply Higgsfield renders (3D truck loops, estate before/after). Swap slots: `TruckStage video={{ mp4, webm, poster }}` and `BeforeAfter before/after` props.

## Known facts / constraints
- Nav (winter): Junk removal · Estate cleanouts · Appliances · Landlords · Pricing · Book. Leaf and gutter pages live in the footer and the mobile "More" list.
- Estate prices are `ESTATE_TIERS` in `src/lib/pricebook.ts` (winter plan build-up, adjust after 3 real jobs). Estate CTA is text / call for a free walkthrough — no $50 card wall. Estate deposit policy is not published (owner's call).
- 3D hero = procedural three.js scene (`src/components/winter/truck-scene.ts`), lazy-loaded after idle; SVG poster first. Skipped on Save-Data / 2g / no WebGL.
- Every loop pauses via `html[data-motion="paused"]` (Pause snow button) and is off under prefers-reduced-motion.
- Scroll-driven motion is CSS scroll timelines only (no listeners, no pinning).
- `public/og.jpg` is the winter card rendered from the 3D scene.
