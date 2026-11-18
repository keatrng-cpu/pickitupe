# Print — door hanger

Read [`DOOR-HANGER.md`](DOOR-HANGER.md) and the root [`CLAUDE.md`](../CLAUDE.md).

- Size: VistaPrint **4.5 × 11 in** (artboard 4.72 × 11.22 full bleed), die-cut knob hole, slit to the edge — build with `node scripts/make-door-hanger-pdf.mjs`, upload the PNGs
- Hang on the **knob**. Never the mailbox (18 U.S.C. § 1725)
- Front: mahogany field, cream lettering, **20% OFF up to $75 by Sept 20**
- Phone on the **fall** hanger is **701-213-3969** (owner decision 2026-09-11) — see DOOR-HANGER.md; do not flip it back to 218
- **Winter set (Nov 13): `print/winter/`** — business card, canvass hanger (`?s=dhc`), neighbor hanger (`?s=dhn`), built by `node scripts/make-winter-print.mjs` from `pricebook.ts`, `truck-art.ts` and `NEW_LINE_DIGITS` in `site-phone.ts`. 3969 is being retired: while `NEW_LINE_DIGITS` is null every proof says NEW NUMBER and carries a red PROOF bar — do not upload those. Type floor for older readers: 7.5 pt card, 8 pt hanger. The build fails if anything overflows its safe area.
- On-site replica: `src/components/door-hanger.tsx` — keep copy in sync
- References: `attachments/PickItUpE-DoorHanger.pdf`, `attachments/Ks1nw.jpg`

If the promo in `src/lib/pricebook.ts` changes, update this folder and the on-site card in the same commit.
