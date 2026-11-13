# Pick It Up E: the marketing workflow

v2, Nov 13, 2026. This revises the first draft of the same day. About **2 hours a week** plus 10–15 minutes per job.
Companions: [local-listings-and-seo.md](local-listings-and-seo.md) (listings and the Google plan),
[../HIGGSFIELD.md](../HIGGSFIELD.md) (video) and `print/winter/` (cards and hangers).
Nothing here is set up yet: no routine, automation, account or post.

> This repo is public. Everything in this folder is readable by anyone, competitors included. Keep partner names,
> numbers you'd rather not share and anything about customers out of it.

## Three blockers, in this order

| # | Blocker | What it holds up | Who |
|---|---|---|---|
| 1 | **The Twilio line is bought and answering** (ElevenLabs voice agent). 701-213-3969 is being retired | Every printed piece, every new listing's phone field, the Google profile phone, the site number (one line: `src/lib/site-phone.ts`) | Keat |
| 2 | **Grand Forks Finance (701-746-2664) confirms** hangers don't need a transient merchant license | Every door hanger route | Keat |
| 3 | **Site PRs merged in order:** #9 (hours) → #10 (winter) → the Higgsfield/print PR | Listing hours, the junk-first pages listings link to, guest confirmation emails | Keat (merge), me (PRs) |

**Why the number goes first:** a phone number printed on 1,000 hangers or typed into six directories is the most
expensive thing to change later. Name/phone consistency across listings is part of how Google trusts a local
business, and every listing made with the old number is one more to fix.

**Keep 3969 working after the switch.** Hangers, the Google profile and past customers have that number. Forward it
(or port it to Twilio, if it isn't your personal cell) for at least 6 months. Nobody who calls the old number should
hit a dead end.

## The loop in one line

Every job makes the next one: **finish → review ask at the truck → neighbor hangers on the block → post the real
photo → see which tag booked.**

## Per job (10–15 minutes, on site)

1. **Photos:** before, after, and one of the loaded bed. No faces or house numbers without asking. These are the
   only images that go on Google. Real jobs only, never AI.
2. **Review ask at the truck:** "Would you leave us a Google review? It's how neighbors find a one-truck outfit."
   Hand them the card (`?s=bcg`). Ask **every** customer, happy or not. Never tie it to a discount, the ice melt or
   the neighbor deal (Google bans review incentives).
3. **Done email/text:** it goes out automatically with the review link. Once the winter PRs merge, guests who paid
   on the site get it by email too (the site now keeps the email they typed at checkout).
4. **Neighbor route** *(on hold until blocker 2)*: the neighbor hanger (`print/winter/hanger-neighbor-*`, `?s=dhn`)
   on **6–10 door handles** on the same block, both sides. Write the street and date in the boxes. Skip "No
   soliciting" doors. **Never a mailbox** (18 U.S.C. § 1725). Log the street in the job note.
5. **If a neighbor walks over:** same street, same day is $25 off each house, 3+ houses $40 each, on jobs $95 and
   up. It never stacks with another offer.

## Weekly rhythm

| Day | Task | Time | Who |
|---|---|---|---|
| Mon | **Google post:** the best real job photo from last week, one line, booking link with `?s=gbp`. Reply to new reviews and Q&A | 15 min | Keat (I draft) |
| Mon | **Numbers:** bookings by `?s=` tag (gbp, fb, nd, dhn, dhc, bcg), new reviews, calls/texts | 10 min | Me, once tag tracking ships |
| Tue | **Facebook groups:** answer "who hauls…?" posts in 3–5 local groups; one helpful post a week, following each group's rules | 20 min | Keat |
| Wed | **Nextdoor:** one post, either a real before/after or a seasonal tip | 10 min | Keat (I draft) |
| Thu | **Partner touch:** one call or drop-in with an estate sale company, a property manager, a realtor or a senior-living move coordinator | 30 min | Keat |
| Sat | **Canvass route** *(after blocker 2)*: 50–100 canvass hangers (`?s=dhc`) in one neighborhood near the week's jobs | 60 min | Keat or a helper |
| Monthly, 1st Mon | **Listing check:** search the brand and "junk removal grand forks" on a phone. Name, phone, hours and site must match the site footer character for character on Google, Facebook, Nextdoor, Bing, Apple and Yelp | 20 min | Keat, my checklist |
| Monthly | **One brand clip** (optional): a Higgsfield loop or 15 s spot of the illustrated truck for Facebook/Nextdoor, per [HIGGSFIELD.md](../HIGGSFIELD.md). Illustration only, never fake job footage | 30 min | Me drafts, Keat posts |

## Seasonal calendar (from the winter plan; check dates before you rely on them)

- **Now to Dec 12:** garage and basement clear-outs before the holidays; UND semester turns; landlord trash-outs.
  Canvass hanger headline: "Get the garage back before January."
- **Dec 26 to Jan 31:** "the new appliance came, the old one goes"; the January purge. The city's 2027 tree pickup
  dates aren't out yet. Don't promise tree hauling until you decide to offer it.
- **Feb to Mar:** estate and move-out cleanouts; partner work.
- **Apr:** spring cleanup week (plan around the city's free week); leaf and yard work back on the site.

## Print (rebuilt Nov 13)

`node scripts/make-winter-print.mjs` → `print/winter/`: business card, canvass hanger, neighbor hanger. Each comes as
front and back PNGs at 300 dpi (upload these) plus PDF proofs.
- **Prices come from the site's pricebook, and the phone from `NEW_LINE_DIGITS` in `src/lib/site-phone.ts`.** While
  that's empty, every proof says NEW NUMBER and carries a red PROOF bar. That's on purpose, so a retired number can't
  be printed.
- Sized for VistaPrint: card 3.5×2 (3.61×2.11 with bleed), hanger "4.5×11" (4.72×11.22 with bleed, knob hole
  respected).
- Built for older eyes: nothing under 7.5 pt on the card or 8 pt on the hanger, the phone and prices largest,
  sentence case, no texture behind text.

**Before you order:**
1. The number is set and the build prints `PRINT-READY`.
2. Blocker 2 is answered (hangers only).
3. The ice-melt offer is confirmed and the bags are in the garage. It's printed through Dec 31, 2026.
4. Scan each QR from a printed proof at arm's length with two different phones.
5. Order a small run first (cards 250, hangers 250–500), then reorder whatever the `?s=` tags show is working.

## What can be automated with your stack

| Job | How | Effort | Status |
|---|---|---|---|
| Review ask | The done text and email carry the Google review link | Done | Email works now; texts need Twilio live |
| Guest confirmation email | Stripe's checkout email is saved to the booking | Done in this PR | Live after merge |
| Review follow-up | Netlify scheduled function: one reminder 3 days after "done" if no review | S | Ask once, no nagging |
| Weekly numbers | Bookings by `source` tag → Monday email via Resend | S | Waits on tags being saved for leads, not just paid bookings |
| Post drafts | Turn the week's job photos into a Google post, a Nextdoor post and a Facebook caption | S | You post them by hand |
| Hanger route log | A "streets hung" field on the job page, so every `dhn` booking can be matched to a route | M | Site change |
| Brand clips | Higgsfield connector in Claude, then `scripts/ingest-clip.mjs` | S | Waits on the connector and a Plus plan |

**Don't automate:** review replies (they should sound like you), Facebook group answers (groups ban bots), and
anything that texts people who aren't customers.

## Recommended routine (not created)

Monday at 7:10am Central:
1. Read last week's bookings by `?s=` tag.
2. Check for new Google reviews if a connector can see them.
3. Draft the Monday Google post, the Wednesday Nextdoor post and one Facebook answer template.

It posts nothing. It only messages you about a new review, a tag that booked 2+ jobs, or a listing that changed. Say
the word and it can be set up from the main chat.

## Voice rules (all channels)

- Short, plain, local: "We haul it. You don't."
- Prices from the live site only, never from memory.
- No franchise talk, no "fast, friendly, affordable".
- Name the street or neighborhood when you can: "Lincoln Park garage, cleared Saturday."
- Never post a customer's address, face or name without asking. Never pass AI images off as job photos.
