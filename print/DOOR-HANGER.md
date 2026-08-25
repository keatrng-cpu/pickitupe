# Door hanger — print spec

Physical card for Grand Forks neighborhoods. Hang on the **doorknob**. Never the mailbox (18 U.S.C. § 1725).

## Size

- 4.25 in × 11 in
- Die-cut knob hole near the top (about 1 in diameter) with a slit to the edge
- Cardstock, CMYK
- Front: mahogany field, cream lettering
- Back: what we haul / what we don't / book-by date / mailbox warning

## Copy (keep in sync with `src/components/door-hanger.tsx`)

- Name: PICK IT UP E
- Line: Leaf Cleanup & Junk Removal
- Offer: **20% OFF**, up to $75, lock the rate by **Sept 20**
- Phone: **218-779-2553**
- City: Grand Forks, ND
- "Hang on the knob — never the mailbox."

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
