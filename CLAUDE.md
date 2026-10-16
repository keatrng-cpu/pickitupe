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
- Pre-season promo: book by **October 10** (extended 2026-09-19 from the printed Sept 20 — the hangers land after that date) for **20% off, up to $75**, any job (`PROMO_PERCENT` / `PROMO_CAP` / `PROMO_DEADLINE` in `src/lib/pricebook.ts`). Calendar deadline, not a job-count cap. Locks the **rate**, not the service date (leaves aren't down by Sept 20).
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

> Moved verbatim to [docs/agents/CLAUDE-reference.md#what-this-app-already-does](docs/agents/CLAUDE-reference.md#what-this-app-already-does) — open it when this section is relevant.

## Commands

```bash
npm install
npm run dev          # 0.0.0.0:8080
npm run typecheck
npm run build        # build only — run npm run db:migrate separately
```

Do not add a second package manager. Do not rewrite the stack (TanStack Start + Vite + Tailwind v4).

## Full inventory (everything Claude should be able to open)

> Moved verbatim to [docs/agents/CLAUDE-reference.md#full-inventory-everything-claude-should-be-able-to-open](docs/agents/CLAUDE-reference.md#full-inventory-everything-claude-should-be-able-to-open) — open it when this section is relevant.

## Design bar

- Tokens in `src/styles.css` `@theme` — do not introduce a second palette
- Sioux green background, cream lettering, mahogany print card
- Motion: honor `prefers-reduced-motion`. Leaves freeze; haul scene parks mid-load.
- Motion vocabulary (styles.css, one ease `--ease-out-soft`): PRINT (ticket feeds out), STAMP (HELD/DONE lands),
  REVEAL (`<Reveal>` sections rise once), ROLL (truck drives off the booked screen), plus a 220 ms router
  cross-fade (`defaultViewTransition`) and a one-time hero entrance. All off under reduced motion. Don't add
  scroll-position-driven motion.
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
- Revert the Oct 10 (printed Sept 20) / 20%-off-up-to-$75 promo back to a "first 25 jobs" cap
- Flip the haul truck with `-scale-x-100` — the asset already faces right

<!-- auto-memory:begin v1 -->
## Memory protocol (auto, every task — do not wait to be asked)
**Start:** read `ai/.context.md` (NOW summary + graph slice, refreshed by git hooks; Claude Code gets it via hook; if missing: `python3 ai/memory/mem.py context`). For more: `mem.py slice "<topic>"` (graph query, ~450 tokens). Never load all of `GRAPH_REPORT.md`. Pick the model: `mem.py route "<task>"`.
**End:** overwrite `ai/NOW.md` with current truth (≤150 lines, no history); append one dated entry to `ai/DECISIONS.md` (`## YYYY-MM-DD — title` + why; never edit old entries). Never write `ai/HANDOFF.md` (Dual Desk owns it). Graph + context refresh are automatic (git hooks: `python3 ai/memory/mem.py install-hook` once per clone).
<!-- auto-memory:end -->
