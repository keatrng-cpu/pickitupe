# CLAUDE.md — Pick It Up E

You are working on the **Pick It Up E** repo: a real local business site, not a template.

**Read this whole file before editing.** Then `git pull origin main`. Two agents (Claude Code and Grok) share this repo — stay in your workstream, don't revert the other one's files.

Live site: https://pickitupe.com  (Netlify project `pickitupe`; the pickitupe.netlify.app subdomain still resolves)
GitHub: https://github.com/keatrng-cpu/pickitupe

Nested instructions load automatically:

- [`src/components/CLAUDE.md`](src/components/CLAUDE.md) — visual / motion
- [`src/lib/CLAUDE.md`](src/lib/CLAUDE.md) — pricing, bookings, SEO, area
- [`src/routes/CLAUDE.md`](src/routes/CLAUDE.md) — pages
- [`print/CLAUDE.md`](print/CLAUDE.md) — door hanger
- [`migrations/CLAUDE.md`](migrations/CLAUDE.md) — schema

Path-scoped rules also live in [`.claude/rules/`](.claude/rules/).

---

## Business (do not invent a new one)

- Name: Pick It Up E (temporary)
- Owner market: Grand Forks, ND / East Grand Forks
- Phone — TWO numbers, both the owner's, split on purpose so print response can be measured apart from web: **701-213-3969 is the SITE number** (header + footer only, plus error toasts / emails / JSON-LD — do not repeat it on every section). **218-779-2553 is the PRINT number** — reserved for print. **Owner decision 2026-09-11: the VistaPrint door-hanger run uses 701-213-3969 anyway** (see `print/DOOR-HANGER.md`); print response is tracked by the QR `?s=dh` tag instead. Never put both numbers on one surface.
- Services: fall leaf cleanup, junk/debris haul, furniture & appliances, gutter cleaning (**single-story only** — 120V ground vacuum, no ladder work; two-story is handed off). Garage & basement cleanouts survive as the `cleanout` add-on, not a service.
- Real truck: **2020 GMC Sierra 1500 Denali**, silver. Do not brand the company as GMC.
- Marketing art: **vintage cream letterpress pickup** (right-facing, leaves in the bed). Owner replaced the silver photo. `public/haul-truck.webp` is still used on `/login`; source sketch `attachments/image.png`.
- Site mark / favicon: cream pickup on a maple leaf, rounded forest tile — `public/logo.png`, `public/favicon.svg`. Source: `attachments/logo-source.png`.
- The haul section on the home page is a **video**, not the illustrated scroll rig it used to be — `public/haul-junk.mp4` + poster `public/haul-junk-poster.jpg`, a Grok Imagine clip of a two-person crew (owner: "I may have a helper here and there, so the two-person crew is okay") loading a leaf-filled tarp AND a junk pile (chair, drum, rake) into the same truck, then driving off onto a clear lawn — one clip covers both services. Autoplay is gated on IntersectionObserver (plays only while on screen); `prefers-reduced-motion` drops the `<video>` element entirely and shows the poster as a plain `<img>` — not a paused video, no motion mounted at all. Source was 10.04s; sped 1.5x to 6.67s rather than trimmed, since the drive-off ending is the point.
- **`public/haul-crew.mp4` / `haul-crew-poster.jpg` are the previous cut — leaves only, no junk.** Superseded, kept in the repo, not referenced anywhere. If you're tempted to restore them: don't, `haul-junk.mp4` is a strict superset of what they showed.
- **Do not put `public/hero-truck.jpg` back on the page.** Its art is baked onto a near-black field, so on the Sioux-green background it renders as a dark hole instead of part of the design — the owner asked for it gone. The file is kept as source art and for `og.jpg`; it is not displayed. On-page art needs a transparent cutout (`haul-truck.webp`) **or** its own background close enough to `--color-bg` to blend, which is why `haul-junk-poster.jpg`/`haul-junk.mp4` are fine as an opaque rounded card — check that visually before shipping a new opaque asset, don't assume it from the rule alone.
- Goal: book fall work before city leaf vacuum (typically mid-Oct to mid-Nov)
- Pre-season promo: book by **September 20** for **20% off, up to $75**, any job (`PROMO_PERCENT` / `PROMO_CAP` / `PROMO_DEADLINE` in `src/lib/pricebook.ts`). Calendar deadline, not a job-count cap. Locks the **rate**, not the service date (leaves aren't down by Sept 20).
- **$50 deposit** applied to invoice on every booking, promo or not
- Block deal: two houses on one street the same day **$25 off each**, three or more **$40 off each** (`BLOCK_TIERS` in `pricebook.ts`). **Never stacks with the promo** — customer gets the bigger of the two. $40 is derived as `BLOCK_MIN_JOB_LOW − FLOOR`, don't retune it by feel
- Refuse: paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos

Legal: USPS mailboxes are off-limits (18 U.S.C. § 1725). Marketing = door hangers on knobs, handoffs, this site, texts.

---

## Workstreams — pick one, don't trample the others

Pull before you start. Commit only the files you meant to change.

| Area | Own these | Do not casually rewrite |
|---|---|---|
| **Visual / motion** | `src/components/falling-leaves.tsx`, `haul-on-scroll.tsx`, `door-hanger.tsx`, `src/styles.css`, `src/routes/__root.tsx`, `public/hero-truck.jpg`, `public/haul-*.webp`, `public/haul-junk.mp4`, `public/haul-junk-poster.jpg`, `public/grain.png`, `public/og.jpg` | pricebook, bookings, jobs |
| **Pricing / quoting** | `src/lib/pricebook.ts`, `PRICEBOOK.md`, `src/components/quote-form.tsx`, `hero-quote-teaser.tsx`, `address-field.tsx`, `src/lib/service-area.ts` | haul animation, leaf overlay |
| **Owner ops** | `src/routes/jobs.tsx`, `src/routes/jobs_.$id.tsx`, `src/routes/jobs_.books.tsx`, `src/routes/jobs_.customers.tsx`, `src/routes/jobs_.crew.tsx`, `src/routes/crew.tsx`, `src/components/owner-shell.tsx`, `src/lib/books.ts`, `src/lib/tax.ts`, `src/lib/crew.ts`, `src/lib/crew-math.ts`, `src/lib/owner-schema.ts`, `src/lib/messages.ts`, `src/lib/bookings.ts`, `migrations/` | marketing copy on the home hero |
| **SEO / copy** | `src/lib/seo.ts` (FAQ on page **must match** JSON-LD), `src/routes/index.tsx` promo lines | don't invent prices — they live in pricebook.ts |
| **Print** | `print/DOOR-HANGER.md`, `attachments/PickItUpE-DoorHanger.pdf`, `attachments/Ks1nw.jpg`, `door-hanger.tsx` | keep 4.25×11 knob hole, never mailbox |
| **Deploy** | `DEPLOY.md`, `netlify.toml`, `.env.example` | |

If a task spans two columns, touch the minimum files and say so in the commit message.

---

## What this app already does

- `falling-leaves.tsx` exists but **is not mounted anywhere** (owner: "lets get rid of the falling leafs on the sides"). It used to render in `__root.tsx`; the import and `<FallingLeaves />` call were removed there, not the component file.
- Hero is a **live instant-estimate widget** (`hero-quote-teaser.tsx`) — service + size + add-ons, real number and a line-by-line breakdown from `pricebook.ts`, no name/phone/address collected there. Replaced the on-site door-hanger picture (owner: "get rid of the door hanger picture and replace it with the estimated quote section"). `door-hanger.tsx` still exists for the print replica but is not currently mounted anywhere on the page.
- **The home page has no booking form.** It used to also render `QuoteForm` in a `#book` section at the bottom; that was the hero's estimate widget a second time wrapped in twelve contact fields (owner: "this is too long and basically a duplicate from the one up top"). The estimate lives **once**, in the hero; the contact fields live **once**, on `/book`. The hero CTA links to `/book` carrying `?service=&size=&addons=` so nobody picks their service and yard size twice. Don't re-add a form to `index.tsx`.
- The haul section is a **video** of a two-person crew loading leaves AND a junk pile into the same truck, then driving off (`haul-on-scroll.tsx` renders `public/haul-junk.mp4`), autoplay gated on IntersectionObserver, no `<video>` mounted under reduced motion
- Quote / book form → `bookings` table
- **Instant estimate** — deterministic flat-rate math, no API key (`pricebook.ts`, calibrate in `PRICEBOOK.md`)
- **Address autocomplete + service-area verdict** — keyless OpenStreetMap, boxed to Greater Grand Forks
- **Owner account** (`/jobs`, `/jobs/$id`, `/jobs/books`, `/jobs/customers`) — board with same-day clusters, a
  summary strip (today, open leads, collected YTD, owed, expenses, miles), a per-job page (status, final bill,
  payments incl. cash/check/Venmo, job costs, mileage with suggested miles, contact log, one-tap texts that log
  themselves, owner-only notes), a customers page with a derived follow-up queue (reply <4h, confirm day before,
  review ask 2 days after), and **Books & taxes** — Schedule C by line, expenses, IRS-rate mileage log
  (72.5¢ H1 / 76¢ H2 2026, stamped per trip), income, SE-tax estimate, 25% tax set-aside, one-time deduction
  checklist, CSV export for the CPA. **Receipt scanning:** photo/PDF → `scanReceipt` (Claude, `RECEIPT_MODEL` in
  `src/lib/receipts.ts`) reads vendor/date/total/tax/items/serials, picks a category from `EXPENSE_CATEGORIES`, and
  books the expense with a cost **phase** (start-up / equipment / operating, `phaseFor()` in tax.ts against the
  `business.startDate` setting). Bytes live in Postgres (`receipts`, sha256-unique), served owner-only at
  `/api/receipt/$id`. Duplicates (same bytes, or same vendor+date+total) are refused and handed back with
  "Book anyway". Gate: `isOwnerEmail` — `pickitupe@gmail.com` plus `OWNER_EMAILS`. Money is
  integer cents. Stripe deposits/balances land in `payments` through the webhook (idempotent on session id).
  Bookings carry a `source` tag from `?s=` (dh = door hanger, gbp, chat).
- **Crew portal** (`/crew`) — for the 1–2 helpers, and for the owner when he's the one on the truck. A crew
  member signs in with the email the owner listed under **Crew** (`/jobs/crew`) and sees: clock in/out with
  the running shift, this week's hours and pay, unpaid total, and the schedule (yesterday forward) as job cards
  with address → Google Maps directions, Call, and one-tap texts (on my way / running late / here / done) that
  log themselves on the job. `CREW_BOOKING_SELECT` in `src/lib/crew.ts` is the whole list of booking columns a
  crew session can see — **no estimate, deposit, payments, source or owner notes**; the crew texts never mention
  money. The owner's login gets a `$0/hr` crew row automatically (paid by draw, not wages). Owner side: add/edit
  helpers (name, sign-in email, phone, wage), fix or remove punches, **Record pay** → a `wages` expense on
  Schedule C line 26 that stamps the shifts paid, and the ND employer checklist (WSI, EIN, W-4/I-9, withholding,
  new-hire report, Job Service UI, W-2 not 1099).
- **RLS is on for every table** (`migrations/0010_rls.sql`), no policies. The app connects as the `postgres`
  owner role, which RLS never applies to; the Supabase Data API (anon key) is a locked door. Keep it that way —
  a new table gets `enable row level security` in its migration and in `ensureOwnerTables()`.
- LocalBusiness + FAQ structured data
- PGLite when no `DATABASE_URL`; Supabase/Neon when set

## Commands

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run build        # build only — run npm run db:migrate separately
```

Do not add a second package manager. Do not rewrite the stack (TanStack Start + Vite + Tailwind v4).

## Full inventory (everything Claude should be able to open)

```
CLAUDE.md                        this file — start here
README.md                        human overview
DEPLOY.md                        Netlify + env
PRICEBOOK.md                     why the numbers are what they are
.env.example                     DATABASE_URL, auth, Stripe, Resend, ANTHROPIC_API_KEY
netlify.toml                     build = vite only, no migrate on CI
package.json                     scripts, no second package manager

print/DOOR-HANGER.md             4.25×11 print spec
attachments/PickItUpE-DoorHanger.pdf
attachments/Ks1nw.jpg            mahogany flyer reference
attachments/logo-source.png      cream truck + maple mark (owner art)

public/hero-truck.jpg            source art + OG only — NOT displayed on the page
public/haul-truck.webp           used on /login only; NOT the home haul scene anymore
public/haul-chair.webp           unused — kept in case the illustrated scene ever comes back
public/haul-junk.mp4             the home haul scene — leaves + junk pile, IntersectionObserver-gated
public/haul-junk-poster.jpg      video poster; also the whole image under reduced-motion
public/haul-crew.mp4             superseded (leaves only) — unused, kept
public/haul-crew-poster.jpg      superseded — unused, kept
public/grain.png
public/og.jpg
public/logo.png                  rounded tile: cream pickup on maple
public/favicon.svg               same mark, simplified for 16px
public/favicon-32.png
public/apple-touch-icon.png
public/icon-192.png

src/routes/__root.tsx            html shell — FallingLeaves is NOT mounted here anymore
src/routes/index.tsx             home, SEO, FAQ, block deal — NO booking form (it lives on /book)
src/routes/book.tsx              booking page — the ONLY place QuoteForm renders; validates ?service/?size/?addons
src/routes/jobs.tsx              owner board (summary strip + follow-up + job cards)
src/routes/jobs_.$id.tsx         one job: status, money, costs, miles, contact log
src/routes/jobs_.books.tsx       Schedule C, expenses, mileage, income, setup & checklist, CSV export
src/routes/jobs_.customers.tsx   customers by phone + derived follow-up queue
src/routes/jobs_.crew.tsx        owner: helpers, wages, punches, record pay, ND employer checklist
src/routes/crew.tsx              crew portal: clock, hours & pay, today's jobs, directions, texts — no money
src/routes/api/receipt.$id.ts    owner-only receipt bytes (image/PDF) for the books page
src/routes/login.tsx
src/routes/api/auth/$.ts         better-auth catch-all

src/components/door-hanger.tsx   mahogany print replica — not mounted on the page currently
src/components/hero-quote-teaser.tsx  live 2-tap estimate, hero right column
src/components/falling-leaves.tsx  edge leaves — unused, not mounted, kept in case they come back
src/components/haul-on-scroll.tsx  the crew video — not a scroll-driven illustration anymore
src/components/quote-form.tsx    booking + instant estimate
src/components/address-field.tsx autocomplete + "do you come out here?"
src/components/site-header.tsx   header + footer (phone lives here)
src/components/owner-shell.tsx   owner pages' chrome, gate, tabs, shared money/date helpers
src/components/receipt-drop.tsx  snap/upload receipts → scanReceipt; result cards
src/components/source-capture.tsx remembers ?s= on landing (door hanger QR = ?s=dh)
src/components/ui/button.tsx

src/lib/bookings.ts              server fns
src/lib/books.ts                 owner books server fns (summary, job detail, payments, expenses, trips, settings, customers)
src/lib/tax.ts                   IRS mileage rates, Schedule C categories, SE tax, trip suggestion, cost phases — pure, tested
src/lib/receipts.ts              receipt scan (Claude vision/PDF) → booked expense; updateExpense; readReceipt
src/lib/receipt-client.ts        client-side downscale (1600px JPEG) / PDF cap before upload
src/lib/crew.ts                  crew server fns (CREW_BOOKING_SELECT = what a helper may see), owner crew admin, recordPay
src/lib/crew-math.ts             hoursBetween / payCents / totals / weekOf — pure, tested (scripts/crew.test.mjs)
src/lib/owner-schema.ts          ensureOwnerTables() (mirrors 0007–0010) + logEvent()
src/lib/owner.ts                 isOwnerEmail() gate — pickitupe@gmail.com + OWNER_EMAILS
src/lib/source.ts                ?s= tag remember/read
src/lib/pricebook.ts             the only place money numbers live
src/lib/service-area.ts          distance bands + keyless geocoding
src/lib/messages.ts              one-tap customer texts
src/lib/seo.ts                   LocalBusiness + FAQ (keep in sync with the page)
src/lib/db.ts                    PGLite / Postgres
src/lib/auth/*                   leave unless the task is auth
src/styles.css                   tokens + motion (Sioux green, cream, mahogany, paper)

migrations/0001_auth.sql
migrations/0002_bookings.sql
migrations/0003_booking_intel.sql  size, estimate, urgency, lat/lon, neighbor
migrations/0007_owner_books.sql    source, final_cents, owner_notes; booking_events, payments, expenses, mileage_trips, owner_settings
migrations/0008_receipts.sql       receipts (bytea, sha256) + expenses.receipt_id/phase/tax_cents/review/line_items
migrations/0009_crew.sql           crew_members (wage_cents, active) + time_entries (paid_expense_id)
migrations/0010_rls.sql            enable row level security on every public table — no policies, app is the owner role

scripts/migrate.mjs
vite.config.ts
```

Auth lives in `src/lib/auth/*`. Leave it unless the task is auth. Local demo: `VITE_AUTH_ENABLED=false`.

Scaffold leftovers — **do not expand**: `src/lib/multiplayer/*`, `public/__grok/*`, `scripts/grok-pwa-*`, `scripts/browser-smoke*`. They exist for the Grok preview host.

Not in git (on purpose): `.env`, `node_modules`, Grok sandbox `AGENTS.md`, VIN photos (`attachments/Screenshot*`), `artifacts/`.

## Design bar

- Tokens in `src/styles.css` `@theme` — do not introduce a second palette
- Sioux green background, cream lettering, mahogany print card
- Motion: honor `prefers-reduced-motion`. Leaves freeze; haul scene parks mid-load.
- No emoji-as-icon, no Inter/Roboto, no purple gradients, no generic “AI startup” look
- Copy: short, local, Grand Forks-specific. Don't restack the phone / 20% / $50 deposit on every block.

## When changing marketing

- Update the live door hanger **and** `print/DOOR-HANGER.md`
- Site phone stays `701-213-3969` / `tel:7012133969`; print (door hanger) phone stays `218-779-2553` / `tel:2187792553`
- Keep the illustrated cream truck unless the owner says otherwise

## Do not

- Commit `.env`, `node_modules`, `.grok/`, sandbox `AGENTS.md`, VIN photos, or `attachments/Screenshot*`
- Put GM / GMC logos in the header as if this is a dealer
- Soften the mailbox warning
- Add features the owner did not ask for (chat widgets, extra dashboards, fake testimonials)
- Revert the Sept 20 / 20%-off-up-to-$75 promo back to a "first 25 jobs" cap
- Flip the haul truck with `-scale-x-100` — the asset already faces right
