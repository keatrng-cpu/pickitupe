# Pick It Up E: getting found locally (listings and the Google plan)

v2, Nov 13, 2026. This revises the first draft of the same day. Read and draft only: no account was created,
claimed, signed into or edited, and nothing was posted. The first draft's sources and search results stand; this
version fixes what changed today.
**Public repo:** anyone can read this file.

## What changed since v1

- **Phone:** 701-213-3969 is being retired for the Twilio line. **Don't create any listing until that number
  answers**, then use it everywhere from day one. Below, `{PHONE}` means that number.
- **Hours:** the truck's hours are now **Mon–Fri 9:30–5:30 · Sat 12–4** (built around the landfill, PR #9). Listings
  copy the site footer the day you publish, character for character.
- **Site relevance:** most of the site fixes v1 asked for are already built in the winter PR (#10). See the table in
  section 3.

## 1. Where we show up today

- The v1 search check found pickitupe.com in **none of the top ~20 results** for junk searches in Grand Forks, East
  Grand Forks, appliance removal or estate cleanout, or for its own name.
- Those searches are filled by LoadUp and AAA Rousse city pages, 1-800-GOT-JUNK Fargo, and directories (Angi,
  HomeAdvisor, Zters).
- **Unverified:** our position in the Google map pack and the profile's current settings.

**Two minutes on your phone, in a private tab:**
1. Search "junk removal grand forks" and screenshot the map pack.
2. Search "Pick It Up E". If the profile doesn't come up for its own name, that's the first fix.

## 2. Listings to claim, ranked

Every one of these is free unless noted, and every one waits on the new number.

| # | Listing | Why | Address shown? |
|---|---|---|---|
| 1 | **Google Business Profile** (exists, needs a winter tune) | The map pack is where "junk removal near me" ends. Primary category is the biggest lever we control | Hidden (required for a service-area business) |
| 2 | **Facebook Page** + 3–5 local groups | Where people ask "who hauls junk?" | Service area only |
| 3 | **Nextdoor business page** | Neighbors recommend by name; pairs with the hangers | Skip it |
| 4 | **Bing Places** (import from Google) | 10 minutes; feeds Bing, Copilot, some car assistants | Hidden |
| 5 | **Apple Business Connect** | iPhone Maps and Siri; open to no-storefront businesses | Hidden |
| 6 | **Yelp** (free page; turn down the ads) | Feeds Apple Maps reviews | Service area |
| 7 | **Grand Forks/EGF Chamber** (dues: ask, 701-772-7271) | A real local link, plus estate-work networking | n/a |
| 8 | **BBB** (free basic listing) | Older homeowners and families clearing estates check it | Hidden |
| 9 | **Angi** free profile only. **Don't buy leads** at our ticket size | Its list pages rank for our searches | Hidden |

Later: Thumbtack (pay per lead, test with a low cap only), data aggregators once 1–6 are live.

### Paste-ready copy

- **Name:** `Pick It Up E`, with nothing added. Google bans keywords in the name and suspends profiles for it.
- **Phone:** `{PHONE}`.
- **Website:** `https://pickitupe.com/?s=gbp` on Google. On the others use `?s=fb`, `?s=nd`, `?s=bing`, `?s=apple`
  and `?s=yelp`, so every booking shows where it came from.
- **Categories:**
  - Primary: `Junk removal service`.
  - Secondary: `Debris removal service`, `Gutter cleaning service`, `Lawn care service`.
  - Don't use: "Garbage collection service" (reads as weekly trash) and "Estate liquidator" (that's selling estates,
    not clearing them).

**Short description (~250 characters):**
> Junk, furniture and appliance hauling in Grand Forks and East Grand Forks. We carry it out of the basement, the
> garage or the whole house. Price on the site before you call. $50 on a card holds the day. Text a photo to {PHONE}.

**Long description (Google, up to 750 characters):**
> Pick It Up E is a local Grand Forks hauling crew. We haul it. You don't.
> We take junk, furniture, mattresses and appliances out of your house, basement, garage or rental, load the truck
> and haul it off. Fridges and freezers too.
> Prices are on the site before you call: one piece from $59, half a truck $125–$195, a full truck $175–$265. Book a
> day online and $50 on a card holds it; it comes off your bill.
> Clearing a whole house after a move or an estate sale? Free walkthrough, then one written price.
> We serve Grand Forks, East Grand Forks, Thompson, Manvel, Emerado and the Air Force Base. We don't take paint,
> chemicals, oil, propane, concrete, dirt, roofing or asbestos.

The phone sentence is gone from the long version on purpose. Google gives the phone its own field and can reject
phone numbers in descriptions.

**Services with prices** (from the live pricebook; recheck on the day):

| Service | Price |
|---|---|
| Bags or one piece | $59–$95 |
| A few pieces | $85–$130 |
| Half the truck | $125–$195 |
| Full truck | $175–$265 |
| Two trips | $245–$365 |
| Fridge, freezer or AC (add-on) | +$25–$45 |
| Garage or basement cleanout (add-on) | +$50–$100 |
| Stairs or basement carry (add-on) | +$30–$60 |
| Estate / whole-house cleanout | $650–$4,500, free walkthrough |
| Gutter cleaning, single-story | $135–$215 |

**Service areas:** Grand Forks ND, East Grand Forks MN, Thompson ND, Manvel ND, Emerado ND, Grand Forks AFB ND. Only
add a town you'd drive to for one couch.

**Photos (real jobs only, no stock, no AI):** a logo square, a cover shot of the truck (plate unreadable), someone
carrying a couch down porch steps, a fridge on a dolly, before/after pairs, a loaded bed from above, an empty unit
after a tenant turn, the truck in snow. Add 2–3 a week.

**Opening Q&A to seed:** "Do you haul fridges?" · "Will you go into the basement?" · "What won't you take?" · "Do you
do whole houses?" Answer each with the matching line from the price list above.

### Signup steps (each one opens or changes an account, so they're yours)

1. **Google:** business.google.com → Edit profile, then set:
   - Category
   - Description
   - Services
   - Service area
   - Hours
   - Website with `?s=gbp`
   - Phone `{PHONE}`
   - 10 photos

   Then compare the "Ask for reviews" link to `REVIEW_URL` in `src/lib/messages.ts`.
2. **Facebook Page:** service area on, address off, the short description, a "Call now" button.
3. **Nextdoor:** business.nextdoor.com (you'll need a resident account first).
4. **Bing Places:** sign in with a Microsoft account → "Import from Google Business Profile".
5. **Apple Business Connect:** no address, service area only.
6. **Yelp:** free page; decline ads.
7. **Chamber / BBB:** call about dues before applying.
8. **Angi:** free profile; say no to the lead plan.

After each goes live, send me the URL and I'll add it to `SAME_AS` in `src/lib/seo.ts`.

## 3. Google ranking plan

Google ranks local results on **relevance, distance and prominence**. Prominence includes reviews and links. We
control the category, reviews, hours, site relevance and links. We can't control the searcher's distance, and hiding
the address costs a little, which Google requires of service-area businesses anyway.

### Site fixes: status

| v1 asked for | Status |
|---|---|
| Home title/meta lead with junk | **Done** in PR #10 ("Junk Removal, Appliance Pickup & Estate Cleanouts in Grand Forks, ND") |
| Schema description and image to winter/junk | **Done** in PR #10 |
| Share text without the old Sept 20 promo | **Done** in PR #10 (`src/lib/og/site.json`); it still carries the phone, so change it with the number |
| `/estate-cleanout-grand-forks` | **Done** in PR #10 |
| `/appliance-removal-grand-forks` | **Done** in PR #10 |
| `/pricing` | **Done** in PR #10 |
| EGF page leads with junk | Open: its description still leads with leaf cleanup |
| New listing URLs in `SAME_AS` | Open: waits on the listings |
| Resubmit the sitemap in Search Console | Open: after the PRs merge |
| One page per small town | **Don't.** Thin town pages rarely help a one-truck business |

### The levers, in order

- **A. Profile (week 1 after the number goes live).** Category, copy, hours, real photos.
- **B. Reviews (from the next job).**
  - Ask everyone, in person, with the card.
  - Reply to every review within a day, naming the job and never the customer.
  - Target: 10 reviews with text by Dec 15.
- **C. Site relevance.** The table above.
- **D. Citations and links.**
  - Listings 2–8, all with the identical name, phone and URL.
  - A mention from an estate sale company or property manager beats any directory.
- **E. Posts.** One a week. Google makes no ranking claim for posts; they're for the people who open the profile.
- **F. Skip geotagging photos.** Tests found no reliable ranking effect.

### 30-day order (Nov 16 to Dec 15)

| Days | Move | Who |
|---|---|---|
| 0 | **Buy and test the Twilio line; set it in `site-phone.ts`; merge the PRs** | Keat, then me |
| 1–2 | Map-pack phone check; tune the Google profile (new phone, new hours, category, photos) | Keat |
| 2–4 | Facebook Page plus groups; Nextdoor page | Keat |
| 3 | Bing import; Apple Business Connect | Keat |
| From the next job | Review ask at the truck; reply to every review | Keat |
| Week 1 | Call Grand Forks Finance about hangers; order the first small print run | Keat |
| Week 2 | Yelp, the free Angi profile, Chamber call; EGF page fix + `SAME_AS` + sitemap resubmit | Keat / me |
| Weeks 2–4 | The weekly rhythm in [marketing-workflow.md](marketing-workflow.md) | Keat, with my drafts |
| Day 30 | Rerun the searches; count reviews, calls and bookings by `?s=` tag | Me |

From experience, listings and reviews move the map pack within weeks, and new pages take longer to rank. That's not
a promise.
