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
- Phone: **218-779-2553** — show it in the **header and footer only**. Do not repeat it on every section. (`door-hanger.tsx` also has it, but that component is not currently rendered on the page — see below.)
- Services: fall leaf cleanup, junk/debris haul, garage & basement, furniture & appliances
- Real truck: **2020 GMC Sierra 1500 Denali**, silver. Do not brand the company as GMC.
- Marketing art: **vintage cream letterpress pickup** (right-facing, leaves in the bed). Owner replaced the silver photo. `public/haul-truck.webp` is still used on `/login`; source sketch `attachments/image.png`.
- The haul section on the home page is a **video**, not the illustrated scroll rig it used to be — `public/haul-junk.mp4` + poster `public/haul-junk-poster.jpg`, a Grok Imagine clip of a two-person crew (owner: "I may have a helper here and there, so the two-person crew is okay") loading a leaf-filled tarp AND a junk pile (chair, drum, rake) into the same truck, then driving off onto a clear lawn — one clip covers both services. Autoplay is gated on IntersectionObserver (plays only while on screen); `prefers-reduced-motion` drops the `<video>` element entirely and shows the poster as a plain `<img>` — not a paused video, no motion mounted at all. Source was 10.04s; sped 1.5x to 6.67s rather than trimmed, since the drive-off ending is the point.
- **`public/haul-crew.mp4` / `haul-crew-poster.jpg` are the previous cut — leaves only, no junk.** Superseded, kept in the repo, not referenced anywhere. If you're tempted to restore them: don't, `haul-junk.mp4` is a strict superset of what they showed.
- **Do not put `public/hero-truck.jpg` back on the page.** Its art is baked onto a near-black field, so on the Sioux-green background it renders as a dark hole instead of part of the design — the owner asked for it gone. The file is kept as source art and for `og.jpg`; it is not displayed. On-page art needs a transparent cutout (`haul-truck.webp`) **or** its own background close enough to `--color-bg` to blend, which is why `haul-junk-poster.jpg`/`haul-junk.mp4` are fine as an opaque rounded card — check that visually before shipping a new opaque asset, don't assume it from the rule alone.
- Goal: book fall work before city leaf vacuum (typically mid-Oct to mid-Nov)
- Pre-season promo: book by **September 20** for **20% off, up to $75**, any job (`PROMO_PERCENT` / `PROMO_CAP` / `PROMO_DEADLINE` in `src/lib/pricebook.ts`). Calendar deadline, not a job-count cap. Locks the **rate**, not the service date (leaves aren't down by Sept 20).
- **$50 deposit** applied to invoice on every booking, promo or not
- Block deal: two houses on one street the same day, **$25 off each**
- Refuse: paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos

Legal: USPS mailboxes are off-limits (18 U.S.C. § 1725). Marketing = door hangers on knobs, handoffs, this site, texts.

---

## Workstreams — pick one, don't trample the others

Pull before you start. Commit only the files you meant to change.

| Area | Own these | Do not casually rewrite |
|---|---|---|
| **Visual / motion** | `src/components/falling-leaves.tsx`, `haul-on-scroll.tsx`, `door-hanger.tsx`, `src/styles.css`, `src/routes/__root.tsx`, `public/hero-truck.jpg`, `public/haul-*.webp`, `public/haul-junk.mp4`, `public/haul-junk-poster.jpg`, `public/grain.png`, `public/og.jpg` | pricebook, bookings, jobs |
| **Pricing / quoting** | `src/lib/pricebook.ts`, `PRICEBOOK.md`, `src/components/quote-form.tsx`, `hero-quote-teaser.tsx`, `address-field.tsx`, `src/lib/service-area.ts` | haul animation, leaf overlay |
| **Owner ops** | `src/routes/jobs.tsx`, `src/lib/messages.ts`, `src/lib/bookings.ts`, `migrations/` | marketing copy on the home hero |
| **SEO / copy** | `src/lib/seo.ts` (FAQ on page **must match** JSON-LD), `src/routes/index.tsx` promo lines | don't invent prices — they live in pricebook.ts |
| **Print** | `print/DOOR-HANGER.md`, `attachments/PickItUpE-DoorHanger.pdf`, `attachments/Ks1nw.jpg`, `door-hanger.tsx` | keep 4.25×11 knob hole, never mailbox |
| **Deploy** | `DEPLOY.md`, `netlify.toml`, `.env.example` | |

If a task spans two columns, touch the minimum files and say so in the commit message.

---

## What this app already does

- Site-wide **scroll-driven edge leaves** (`falling-leaves.tsx`, mounted once in `__root.tsx`) — left and right gutters only, faster as you scroll
- Hero is a **live instant-estimate widget** (`hero-quote-teaser.tsx`) — service + size, real number from `pricebook.ts`, no name/phone/address collected there. Replaced the on-site door-hanger picture (owner: "get rid of the door hanger picture and replace it with the estimated quote section"). `door-hanger.tsx` still exists for the print replica but is not currently mounted anywhere on the page.
- The haul section is a **video** of a two-person crew loading leaves AND a junk pile into the same truck, then driving off (`haul-on-scroll.tsx` renders `public/haul-junk.mp4`), autoplay gated on IntersectionObserver, no `<video>` mounted under reduced motion
- Quote / book form → `bookings` table
- **Instant estimate** — deterministic flat-rate math, no API key (`pricebook.ts`, calibrate in `PRICEBOOK.md`)
- **Address autocomplete + service-area verdict** — keyless OpenStreetMap, boxed to Greater Grand Forks
- `/jobs` owner board with same-day clusters and one-tap customer texts
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
.env.example                     DATABASE_URL, auth, optional XAI_API_KEY
netlify.toml                     build = vite only, no migrate on CI
package.json                     scripts, no second package manager

print/DOOR-HANGER.md             4.25×11 print spec
attachments/PickItUpE-DoorHanger.pdf
attachments/Ks1nw.jpg            mahogany flyer reference
attachments/image.png            vintage cream truck source sketch

public/hero-truck.jpg            source art + OG only — NOT displayed on the page
public/haul-truck.webp           used on /login only; NOT the home haul scene anymore
public/haul-chair.webp           unused — kept in case the illustrated scene ever comes back
public/haul-junk.mp4             the home haul scene — leaves + junk pile, IntersectionObserver-gated
public/haul-junk-poster.jpg      video poster; also the whole image under reduced-motion
public/haul-crew.mp4             superseded (leaves only) — unused, kept
public/haul-crew-poster.jpg      superseded — unused, kept
public/grain.png
public/og.jpg
public/favicon.svg

src/routes/__root.tsx            html shell + FallingLeaves (once)
src/routes/index.tsx             home, SEO, FAQ, block deal, quote form
src/routes/book.tsx              booking page
src/routes/jobs.tsx              owner board
src/routes/login.tsx
src/routes/api/auth/$.ts         better-auth catch-all

src/components/door-hanger.tsx   mahogany print replica — not mounted on the page currently
src/components/hero-quote-teaser.tsx  live 2-tap estimate, hero right column
src/components/falling-leaves.tsx  edge leaves, scroll-boosted
src/components/haul-on-scroll.tsx  the crew video — not a scroll-driven illustration anymore
src/components/quote-form.tsx    booking + instant estimate
src/components/address-field.tsx autocomplete + "do you come out here?"
src/components/site-header.tsx   header + footer (phone lives here)
src/components/ui/button.tsx

src/lib/bookings.ts              server fns
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
- Phone stays `218-779-2553` / `tel:2187792553`
- Keep the illustrated cream truck unless the owner says otherwise

## Do not

- Commit `.env`, `node_modules`, `.grok/`, sandbox `AGENTS.md`, VIN photos, or `attachments/Screenshot*`
- Put GM / GMC logos in the header as if this is a dealer
- Soften the mailbox warning
- Add features the owner did not ask for (chat widgets, extra dashboards, fake testimonials)
- Revert the Sept 20 / 20%-off-up-to-$75 promo back to a "first 25 jobs" cap
- Flip the haul truck with `-scale-x-100` — the asset already faces right
