---
paths:
  - src/components/falling-leaves.tsx
  - src/components/haul-on-scroll.tsx
  - src/components/door-hanger.tsx
  - src/components/hero-quote-teaser.tsx
  - src/styles.css
  - src/routes/__root.tsx
  - public/**
---

Visual / motion workstream. Truck faces RIGHT — never `-scale-x-100`. Tokens stay in `src/styles.css` `@theme`. Don't rewrite `pricebook.ts` from here.

**`FallingLeaves` is not mounted anywhere** — owner asked for the edge leaves gone (`__root.tsx` no longer imports or renders it). The component file is untouched, just unused. If it's ever remounted: once, in `__root.tsx`, never per-page — that constraint below is about the DOM layering if it comes back, not a live bug today.

**`public/grain.png` is opaque** — RGB colortype 2, no alpha, no `tRNS`. Any rule that sets it as `background-image` over a `background-color` **must** also set `background-blend-mode` (we use `soft-light`), or the grain paints straight over the colour and the element renders flat grey. This is what made the mahogany door hanger grey. Applies to `.card-print`, `.card-paper`, `.card-estimate`, and `body`.

**If `FallingLeaves` is remounted, it sits BEHIND content.** It's `fixed inset-0 z-0`; every page wrapper is transparent with `relative z-10` and the page background is painted by `body` — that layering is unrelated to whether the leaf layer is mounted, it's just how the page background works now, so don't revert it thinking it's dead code. At `z-30` the leaves used to float over everything — invisible on desktop where they fell in the gutters, but on a phone there was no gutter and they landed across the door hanger like litter. If it comes back: don't raise the z-index, and cap the inset with `min(Npx, 5vw)` for the same reason.

**Opaque art on the page must actually blend.** Prefer a transparent cutout (`haul-truck.webp`, `haul-chair.webp`). Opaque is acceptable only when its own background sits close enough to `--color-bg` to read as part of the page — verified by eye, not assumed: `haul-junk.mp4`/`haul-junk-poster.jpg` are opaque and fine, `hero-truck.jpg` is opaque and was a dark hole. It was removed from the page at the owner's request; still exists for source art / `og.jpg`.

**The home haul section is a video (`public/haul-junk.mp4`), not the illustrated scroll rig.** Do not scroll-scrub it — no tying `video.currentTime` to scroll position. That section used to `sticky`-pin the page for 170vh, which froze the viewport for 1.7 screens of scroll; the fix was IntersectionObserver play/pause, nothing scroll-position-driven. Keep it that way. `prefers-reduced-motion` must mount no `<video>` element at all (a plain `<img>` of the poster instead) — a paused-but-present video is not the same as no motion.

**Keep a visible focus ring.** `:focus-visible` in `styles.css` is deliberately unlayered so it beats Tailwind's `outline-none` on the form fields. Don't move it into `@layer`. For a focus ring on a wrapper around a `sr-only` control (the quote-form size/add-on/urgency cards), the utility `has-[:focus-visible]:outline-2` alone does NOT paint anything — Tailwind's `outline-*` utilities read `outline-style` off `--tw-outline-style`, which nothing else sets on that element. Pair it with `has-[:focus-visible]:outline` (bare) to actually get `outline-style: solid`; verified by fetching the compiled CSS in the browser, not by eyeballing it — a script-triggered `.focus()` does not reliably satisfy `:focus-visible` in headless testing, so test the CSS itself, not a simulated tab press.

**Section rhythm is two `@utility` rules, nothing else sets section padding.** `section-y` (the 64→140px clamp ladder) and `section-y-lead` (hero only, under the sticky header) live in `src/styles.css` after `.band`. `.band` is 92% `bg-deep` (not 62% — that read as noise because `body`'s layers are `background-attachment: fixed` and the separation drifted with scroll position). `.band-paper` is the one cream field, used only for `#block`; never put a `.card-green` or a form control inside it — `color-scheme: dark` renders native field chrome dark-on-cream there. Home page field sequence, top to bottom: page / page / band / page / band / band-paper / band / page.

**Mobile background was rendering flat grey, not green.** Root cause: `background-attachment: fixed` on `body` forces the (blended, tiled) background layer onto the main thread instead of the compositor on a phone, and `html` had no explicit `background-color` fallback for any gap. Fixed in `styles.css`: `html { background-color: var(--color-bg); }`, plus `background-attachment: scroll` on `body` below 768px. Don't reintroduce `fixed` on mobile.
