# NOW — pickitupe current truth

**As of:** 2026-11-18 · scroll clear-out is on `cursor/scroll-clear-a1d6`, built on Claude's `4ac333d` stage.

## Goal
The homepage garage empties as you scroll, and the swept room stays behind the quote. The camera is wide enough to show the room and the pile.

## In flight
- Carry-out starts at progress 0.35 and is finished before QuickQuote (`#haul`).
- The quote sits in the same pin, over the clean room.
- Desktop orbit fov 44, phone fov 59. Closest radius is 6.8 (was 4.0).
- Phones do not load the canvas or Lenis until the first scroll or tap. Desktop loads the canvas immediately.
- Backup of main before this pass: `backup/pre-scrollclear-20261118` at `49bbb643`.

## Known facts
- Site phone remains `701-213-3969`. Hours remain Mon–Fri 9:30–5:30, Sat 12–4. Deposit remains $50.
- Full truck is still `$175–$265`. Prices still come from `pricebook.ts`.
- Truck file is the CC0 double-cab in `public/models/truck.glb` (no KTX2). License note: `public/models/TRUCK.md`.
- Preview Lighthouse mobile after the phone trim: performance 96, LCP 2.3s, CLS 0.001.
- Routes, Stripe, and the booking form are unchanged.
