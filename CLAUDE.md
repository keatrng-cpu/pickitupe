# CLAUDE.md — Pick It Up E

You are working on the **Pick It Up E** repo: a real local business site, not a template.

## Business (do not invent a new one)

- Name: Pick It Up E (temporary)
- Owner market: Grand Forks, ND / East Grand Forks
- Phone: **218-779-2553**
- Services: fall leaf cleanup, junk/debris haul, garage & basement, furniture & appliances
- Truck: **silver 2020 GMC Sierra 1500** crew cab — depict it, do not brand the company as GMC
- Goal: book fall work before city leaf vacuum (typically mid-Oct to mid-Nov)
- Early bird: **$50 off** first full cleanup, first **25** jobs, **$50 deposit** applied to invoice
- Refuse: paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos

Legal: USPS mailboxes are off-limits. Marketing = door hangers, handoffs, this site, texts.

## What this app already does

- Marketing home with falling leaves, door-hanger card, silver-truck hero, **scroll-linked haul animation** (`src/components/haul-on-scroll.tsx`)
- Quote / book form → `bookings` table (`src/lib/bookings.ts`)
- `/jobs` for the owner to see incoming work (auth-gated)
- PGLite when no `DATABASE_URL`; Neon when set

## Commands

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run build
```

Do not add a second package manager. Do not rewrite the stack.

## Code map

```
src/routes/index.tsx          home
src/routes/book.tsx           booking page
src/routes/jobs.tsx           owner board
src/components/door-hanger.tsx
src/components/haul-on-scroll.tsx
src/components/quote-form.tsx
src/lib/bookings.ts           server fns + offer cap
src/styles.css                tokens + motion
migrations/0002_bookings.sql
public/hero-truck.jpg         silver Sierra hero / OG source
public/haul-truck.png         cutout used in scroll scene
```

Auth lives in `src/lib/auth/*`. Leave it unless the task is auth. Local demo: `VITE_AUTH_ENABLED=false`.

## Design bar

- Tokens in `src/styles.css` `@theme` — do not introduce a second palette
- Motion: honor `prefers-reduced-motion`
- No emoji-as-icon, no Inter/Roboto, no purple gradients, no generic “AI startup” look
- Keep copy short, local, and specific to Grand Forks leaf rules (loose piles, 3 ft from curb, not in the street)

## When changing marketing

- Update both the live door hanger **and** any print notes
- Keep the phone as `218-779-2553` / `tel:2187792553`
- Hero/haul photos should stay a **silver** crew cab unless the owner says otherwise

## Do not

- Commit `.env`, `node_modules`, `.grok/`, or the sandbox `AGENTS.md`
- Put GM / GMC logos in the header as if this is a dealer
- Soften the mailbox warning
- Add features the owner did not ask for (chat widgets, extra dashboards, fake testimonials)
