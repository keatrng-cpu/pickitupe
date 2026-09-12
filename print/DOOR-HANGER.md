# Door hanger — print spec

Physical card for Grand Forks neighborhoods. Hang on the **doorknob**. Never the mailbox (18 U.S.C. § 1725).

## Size

- **VistaPrint "4.5 × 11" door hanger** (their large size; there is no 4.25 option).
  Full-bleed artboard **4.72 × 11.22 in**, trim 0.11 in in, safety 0.28 in in.
- Die-cut knob hole Ø≈1.1 in, centered 2.36 in from the left / 1.42 in from the
  top of the artboard; slit exits **left** on the front (mirrors right on the back).
  **Nothing sits above y = 2.25 in except the mahogany field.**
- 16pt "Premium" cardstock, matte, two-sided.
- Front: mahogany field, cream lettering, offer, prices, truck, towns
- Back: URL / truck / what we haul / what we don't / phone / QR / deposit line

## Build (print-ready files live in this folder)

```bash
node scripts/make-door-hanger-pdf.mjs
```

Source is [`door-hanger.html`](door-hanger.html) (Playfair Display + Outfit from
Google Fonts, palette from `src/styles.css`, QR inlined from `qr-pickitupe.svg`,
truck from `public/haul-truck.webp`). Outputs `door-hanger-front.png` and
`door-hanger-back.png` at exactly 300 dpi (1419 × 3369) — **upload the PNGs, not
the PDF**: VistaPrint rejects Chromium's PDF for "un-embedded fonts". The PNGs are
rendered 0.04 in taller than the artboard on purpose so VistaPrint's fit-to-width
never leaves a hairline at the bottom.

VistaPrint Studio gotchas learned 2026-09-11: setting a Background color
*replaces* a full-canvas image (undo it); an image added from the Uploads panel
lands at 50 % — drag the top-left handle to the canvas corner first (it snaps),
then the bottom-right; the back side's "Upload your design" path auto-fills and
exposes a **Fill** button, the front's does not.

## Copy (keep in sync with `src/components/door-hanger.tsx`)

- Name: PICK IT UP E
- Line: Fall leaf cleanup · Junk removal · Single-story gutter cleaning
- Offer: **20% OFF**, up to $75, lock the rate by **Sept 20**
- Prices (from `pricebook.ts`, "typical"): Most city lots $160–$345 ·
  Junk & furniture from $59 · Gutters from $135 · Furniture & appliances
  $59–$130 for 1–2 pieces · Single-story gutters $135–$165
- Refusals: paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos
- Phone: **701-213-3969** — **owner decision 2026-09-11**: the same number as
  the site goes on this print run. Print response is therefore measured by the
  QR's `?s=dh` tag, not by the phone number (218-779-2553 stays unused on print
  until the owner says otherwise).
- Towns: Grand Forks · East Grand Forks · Thompson · Manvel
- "$50 card hold at booking, credited to your invoice."
- Knob-hang instruction is for the crew, not the customer — it is NOT printed.

## QR code

Files: [`qr-pickitupe.svg`](qr-pickitupe.svg) (vector — **send this one to the printer**) and
[`qr-pickitupe.png`](qr-pickitupe.png) (2400px raster fallback).

Regenerate with `node scripts/make-qr.mjs` — and **reprint** if you do. The URL
is physically baked into the pattern; there is no editing it after the cards
are cut.

| | |
|---|---|
| Encodes | `https://pickitupe.com/?s=dh` |
| Error correction | **H** (30% recoverable) — it lives outdoors on a knob |
| Grid | 33×33 modules + 4-module quiet zone = 41 across |
| Ink | mahogany `#3c1e14` on cream `#f3ead6` |
| **Printed size** | **1.0–1.25 in square, including the quiet zone** |

Below 1.0 in the modules drop under 0.6mm and phones start failing at arm's
length. 0.75 in does **not** scan reliably — do not let a designer shrink it
to make room.

Two rules the print shop must not "improve":

- **Do not invert it.** Dark modules must sit on the light ground. A cream-on-
  mahogany QR fails on a meaningful share of scanners, and you will not find
  out until the cards are in your hand. That is why the code gets its own
  cream panel rather than sitting directly on the mahogany field.
- **Do not crop the quiet zone.** The 4-module blank margin is part of the
  symbol, not padding.

`?s=dh` tags the scan as coming from a door hanger. Nothing reads it yet —
capturing it needs a `source` column on `bookings` and a hidden field on the
form. It costs 5 characters now and is the only way to ever answer "did the
door hangers work?", because a printed card cannot be re-tagged later.

## References in the repo

- On-site replica: [`src/components/door-hanger.tsx`](../src/components/door-hanger.tsx)
- Older PDF proof: [`attachments/PickItUpE-DoorHanger.pdf`](../attachments/PickItUpE-DoorHanger.pdf)
- Mahogany flyer: [`attachments/Ks1nw.jpg`](../attachments/Ks1nw.jpg)

If you change the promo in `src/lib/pricebook.ts`, change this file and the on-site card in the same commit.
