# Pick It Up E — Pricebook

The instant estimate on the site reads **one file**: [`src/lib/pricebook.ts`](src/lib/pricebook.ts).
Change a number there and the site, the owner board, and the quote texts all move together.

Structure follows the E&E flat-rate pricebook: one range per line item, trip +
labor + haul included, add-ons priced separately, and a hard rule that scope
changes stop the job for a re-quote.

**Position: every tier sits under a named local comparable.** Benchmarks and
sources are below — recheck them each season, because they move.

---

## Leaf cleanup — sized by lot

| Size | What it means | Our range | Market comparable |
|---|---|---|---|
| Small city lot | One or two trees, light cover | **$95–$155** | $100–$250 medium yard |
| Standard lot | Full cover, front and back | **$145–$245** | $160–$290 standard ¼-acre |
| Large / corner lot | Heavy cover, mature trees | **$245–$395** | $400–$600 half-acre, heavy |
| Acreage or tree-heavy | Walk it first | **$395–$650** | $400–$700 upper band |

National 2026 leaf removal runs **$150–$700 per visit**, averaging $160–$290 for
a standard quarter-acre. Rural and small-metro labor prices below big metros,
which is why Grand Forks should sit at the bottom of every national band before
we even discount.

## Haul work — sized by the bed

Silver Sierra 1500 crew cab. A heaped bed is roughly **2.5 cubic yards**.

| Size | What it means | Our range | Market comparable |
|---|---|---|---|
| One item | Couch, mattress, treadmill | **$59–$95** | LoadUp Grand Forks starts **$70**; industry minimum $75–$100 |
| Quarter bed | A pickup corner | **$85–$130** | Grand Forks ¼ truck load $111–$164 |
| Half bed | Half the bed, heaped | **$125–$195** | between local ¼ and ½ truck load |
| Full bed | Bed full and strapped | **$175–$265** | Grand Forks ½ truck load $211–$344 |

Garage / basement cleanouts add **$50–$100** of sort-and-carry labor on top of
the load size.

### The truck-size caveat — read before quoting a big job

A junk-removal company's "truck load" is a **13–18 cubic yard box truck**. Our
full bed is ~2.5 yards, so our *full load* is closer to their *quarter load* by
volume. That means:

- **We win small.** One item, one corner, one room. Their minimum is a floor we
  duck under; ours is a real price for a real trip.
- **We lose whole-house.** At $45–$65 per cubic yard, an 18-yard truck beats a
  pickup on a full cleanout every time. Quote those honestly or hand them off —
  a bad price on a big job costs a whole Saturday.

Local Grand Forks reference points: ¼ truck $111–$164 (avg $133), ½ truck
$211–$344 (avg $271), full truck $422–$550.

## Add-ons

| Add-on | Applies to | Range | Why |
|---|---|---|---|
| Leaves aren't curb-ready | Leaf cleanup | $35–$70 | Raking from scratch, not just hauling |
| Wet or matted leaves | Leaf cleanup | $30–$60 | Industry adds 20–30% for sat-too-long piles; this is under that on a standard lot |
| Stairs or basement carry | Haul work | $30–$60 | |
| Long carry (>75 ft) | Everything | $20–$40 | |
| Fridge, freezer, or AC | Haul work | $25–$45 | Refrigerant units carry a real disposal fee |

## Rules

- **Pre-season promo:** 20% off, capped at $75, book by September 20
  (`PROMO_PERCENT` / `PROMO_CAP` / `PROMO_DEADLINE` in `src/lib/pricebook.ts`).
  A calendar deadline, not a job-count cap — see "Why a date, not a count"
  below.
- **Floor:** nothing prices below $55 after discounts — a truck roll costs money.
- **Deposit:** $50 holds the date, comes off the invoice. Same for every
  booking, promo or not.
- **Block deal:** two houses on one street the same day, $25 off each.
- **Scope change:** stop and re-quote before loading. Never load first, bill later.
- **Refused loads:** paint, chemicals, oil, propane, concrete, dirt, roofing,
  asbestos. The estimator scans the notes field and warns before dispatch.

### Why a date, not a count

The site originally ran a flat $50 off the first 25 bookings. Replaced because:

1. **A count isn't verifiable.** "25 spots, X left" has no proof behind it on
   a brand-new site with zero completed jobs — it reads as fake scarcity.
   A calendar date is checkable by anyone.
2. **Leaves aren't down by September.** The old cap tied the discount to
   being early in line; the deadline now locks the *rate*, not the *service
   date* — the site says so explicitly so nobody expects a rake crew before
   their yard actually needs one.
3. **A flat dollar amount doesn't scale.** $50 off a $95 job is 53% — deep
   enough to clamp at the floor. $50 off a $650 acreage job is 8% — barely
   felt. Percent-with-a-cap scales with the job and can't blow past a fixed
   dollar giveaway on the biggest jobs.

### Why capped, not a flat percent

An uncapped 20% (or worse, the 35% originally floated) still has two failure
modes worth naming:

- **Small jobs:** 35% off a $59 one-item job computes to $38.35 — the $55
  floor catches it, but that means the advertised percentage silently isn't
  what's actually charged on the cheapest tier. That's a truth-in-advertising
  problem, not just a margin one.
- **Big jobs:** 35% off a $650 acreage quote gives away $227.50 on one job,
  uncapped, with no corresponding drop in cost. The $75 cap bounds this
  regardless of how big the quoted range gets.

## What to check after a real season

1. Are large-lot jobs landing above or below $395? Move the top of the band.
2. Is the bagging add-on covering the extra time, or eating it?
3. What did the dump actually charge per load? That is the floor under the haul
   ranges, and the one number no competitor's website will tell you.
4. Re-pull the benchmarks below — a year-old comparable is not a comparable.

## Sources

- [LoadUp — Grand Forks, ND](https://goloadup.com/grand-forks-nd/) — single bulky item starting price
- [homeyou — Junk removal costs, Grand Forks ND](https://www.homeyou.com/nd/junk-removal-grand-forks-costs) — local truck-load bands
- [Angi — Leaf removal cost, 2026](https://www.angi.com/articles/how-much-does-leaf-removal-cost.htm)
- [LawnStarter — Leaf removal cost, 2026](https://www.lawnstarter.com/blog/cost/leaf-removal-price/)
- [Angi — Junk removal cost, 2026](https://www.angi.com/articles/how-much-does-junk-removal-cost.htm)
- [HireAHelper — Junk removal cost](https://blog.hireahelper.com/how-much-does-junk-removal-cost/) — per-cubic-yard and truck capacity
