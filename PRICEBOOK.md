# Pick It Up E — Pricebook

The instant estimate on the site reads **one file**: [`src/lib/pricebook.ts`](src/lib/pricebook.ts).
Change a number there and the site, the owner board, and the quote texts all move together.

Structure follows the E&E flat-rate pricebook: one range per line item, trip +
labor + haul included, add-ons priced separately, and a hard rule that scope
changes stop the job for a re-quote.

**These are starting ranges, not quoted prices.** Calibrate against your real
dump fees, fuel, and how long a yard actually takes you before a season runs on
them.

## Leaf cleanup — sized by lot

| Size | What it means | Range |
|---|---|---|
| Small city lot | One or two trees, light cover | $145–$225 |
| Standard lot | Full cover, front and back | $225–$375 |
| Large / corner lot | Heavy cover, mature trees | $375–$575 |
| Acreage or tree-heavy | Walk it first | $575–$900 |

## Haul work — sized by the bed

Silver Sierra 1500 crew cab. A heaped "full load" is roughly two cubic yards.

| Size | What it means | Range |
|---|---|---|
| One item | Couch, mattress, treadmill | $75–$135 |
| Quarter load | A pickup corner | $135–$210 |
| Half load | Half the bed, heaped | $210–$320 |
| Full load | Bed full and strapped | $320–$480 |

Garage / basement cleanouts add **$60–$120** of sort-and-carry labor on top of
the load size.

## Add-ons

| Add-on | Applies to | Range |
|---|---|---|
| Leaves aren't curb-ready | Leaf cleanup | $40–$80 |
| Wet or matted leaves | Leaf cleanup | $30–$60 |
| Stairs or basement carry | Haul work | $35–$70 |
| Long carry (>75 ft) | Everything | $25–$50 |
| Fridge, freezer, or AC | Haul work | $25–$45 |

## Rules

- **Early bird:** $50 off, first 25 jobs, applied to both ends of the range.
- **Floor:** nothing prices below $65 after discounts — a truck roll costs money.
- **Deposit:** $50 holds the date, comes off the invoice.
- **Block deal:** two houses on one street the same day, $25 off each.
- **Scope change:** stop and re-quote before loading. Never load first, bill later.
- **Refused loads:** paint, chemicals, oil, propane, concrete, dirt, roofing,
  asbestos. The estimator scans the notes field and warns before dispatch.

## What to check after a real season

1. Are large-lot jobs landing above or below $575? Move the top of the band.
2. Is the bagging add-on covering the extra time, or eating it?
3. What did the dump actually charge per load? That is the floor under the
   haul ranges.
