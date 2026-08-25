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
- **Block deal:** two houses on one street the same day, $25 off each; three or
  more, $40 off each (`BLOCK_TIERS` / `BLOCK_MIN_JOB_LOW`). **Never stacks with
  the promo** — the customer gets whichever is bigger. See below.
- **Same-week rush:** `this-week` urgency adds **$10-$20** (`RUSH_SURCHARGE`).
  "Before city vacuum" is the seasonal norm, not a rush, and costs nothing extra
  — the whole business is built around that mid-Oct to mid-Nov window. "This
  week" displaces booked work and burns a slot that could have been routed with
  a neighbour on the same street.
- **Scope change:** stop and re-quote before loading. Never load first, bill later.
- **Refused loads:** paint, chemicals, oil, propane, concrete, dirt, roofing,
  asbestos. The estimator scans the notes field and warns before dispatch.

### Why "Single-item pickup" is no longer a service

Same reason as garage/basement: it was duplication in the picker. It resolved to
exactly the same price table as "Furniture & appliances" (the first three load
sizes), so two dropdown entries produced identical quotes.

**A single item is a SIZE, not a service.** The "One item" tier ($59-$95) is how
it gets quoted, under either haul service. A test asserts that tier still exists,
because removing the service without it would have quietly deleted the cheapest
thing this business sells.

### Why "Garage / basement" is no longer a service

Removed at the owner's request — the dropdown listed six options where several
read as the same job to a customer ("junk removal", "garage / basement",
"furniture & appliances", "single-item pickup" are all *hauling*).

**Its $50-$100 sort-and-carry labor did NOT go away.** It became the `cleanout`
add-on, available on any haul service. Sorting a basement genuinely is not the
same job as lifting a couch already at the curb, so deleting the service without
keeping the labor would have quietly priced every cleanout $50-$100 under cost.
`scripts/pricebook.test.mjs` asserts the add-on still exists and still adds
exactly $50-$100.

Garage and basement cleanouts remain in the SEO service list and the JSON-LD —
we still do the work, it is just priced as a haul plus the cleanout add-on
rather than as its own tier.

### The block deal: why $40, and why it can't stack

Shipped for weeks as marketing copy in six places and **zero lines of pricing
logic**. `estimate()` had no household input and never subtracted anything, so
the site advertised a credit its own estimator could not produce, and the owner
applied it by hand on the invoice. Three defects followed, all verified against
the real code before the fix:

1. **It broke the floor.** Small lot with the promo: `cut(95) = 19` → $76, which
   clears $55. Then $25 off by hand → **$51**, four dollars under the floor,
   with nothing left to re-check it because `applyPromo` had already returned.
2. **It inverted the ladder.** Standard lot: `145 − 29 promo − 25 block = $91`,
   cheaper than the small city lot's $95 **list** price. A bigger job cost less
   than a smaller one.
3. **It wasn't gated to yard work.** A one-item haul quoted $55–$76 after the
   promo, then $30–$51 after the credit — both ends under the floor, on a
   single mattress.

**$40 is derived, not chosen.** The cheapest job the credit may touch is
`BLOCK_MIN_JOB_LOW` ($95) and `FLOOR` is $55, so **$95 − $55 = $40** is the
largest per-house credit that can never breach the floor. Change either bound
and the guarantee dies — `scripts/pricebook.test.mjs` asserts the identity so
it fails loudly instead of silently.

**Why not the $30 that was first floated.** The customer's own credit moving
$25 → $30 pays them **$5** for recruiting the second neighbour, after $25 bought
the first. Neighbour #1 is the person you talk to over the fence; neighbour #2
is the house you only wave at. Paying $25 for the easy ask and $5 for the hard
one is a dead ladder. $25 → $40 pays $15 for the second recruit — same order of
magnitude as the first. (The behavioural claim is an assumption at n=0; the
$5-vs-$15 arithmetic is not.)

**Non-stacking, compared on the high end.** The customer gets the promo *or* the
block credit, never both. The comparison is on the **top** of the range, not on
total dollars saved — total-saved picks the flat credit on a standard lot ($80
vs $78) while producing a *higher* top-of-range number ($205 vs $196), i.e.
recruiting a neighbour would have made someone's quote worse at the number they
plan around. Comparing the high end also happens to be safe in both directions:
a flat credit that beats a percentage at the top necessarily beats it at the
bottom too, so a winning block credit dominates on both ends, and a losing one
leaves the customer exactly the promo they'd have had anyway. There is a unit
test named for this: *recruiting a neighbour can NEVER make your own quote
worse*.

**Consequence worth knowing:** during promo season the block credit only wins on
small lots — on standard and large jobs the capped 20% is worth more, so the
promo simply applies and the block tier costs nothing extra. After September 20
the promo is gone and the block credit becomes the primary acquisition lever.
That is intended, not a bug.

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
