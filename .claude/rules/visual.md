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

Visual / motion workstream. Truck faces RIGHT — never `-scale-x-100`. Leaves only on the left and right edges, scroll-boosted, mounted once in `__root.tsx`. Tokens stay in `src/styles.css` `@theme`. Don't rewrite `pricebook.ts` from here.

**`public/grain.png` is opaque** — RGB colortype 2, no alpha, no `tRNS`. Any rule that sets it as `background-image` over a `background-color` **must** also set `background-blend-mode` (we use `soft-light`), or the grain paints straight over the colour and the element renders flat grey. This is what made the mahogany door hanger grey. Applies to `.card-print`, `.card-paper`, `.card-estimate`, and `body`.

**Leaf layer sits BEHIND content.** `FallingLeaves` is `fixed inset-0 z-0`; every page wrapper is transparent with `relative z-10` and the page background is painted by `body`. At `z-30` the leaves floated over everything — invisible on desktop where they fall in the gutters, but on a phone there is no gutter and they landed across the door hanger like litter. Don't re-add `bg-bg` to a page wrapper or raise the leaf z-index. Leaf inset is capped with `min(Npx, 5vw)` for the same reason.

**Opaque art on the page must actually blend.** Prefer a transparent cutout (`haul-truck.webp`, `haul-chair.webp`). Opaque is acceptable only when its own background sits close enough to `--color-bg` to read as part of the page — verified by eye, not assumed: `haul-junk.mp4`/`haul-junk-poster.jpg` are opaque and fine, `hero-truck.jpg` is opaque and was a dark hole. It was removed from the page at the owner's request; still exists for source art / `og.jpg`.

**The home haul section is a video (`public/haul-junk.mp4`), not the illustrated scroll rig.** Do not scroll-scrub it — no tying `video.currentTime` to scroll position. That section used to `sticky`-pin the page for 170vh, which froze the viewport for 1.7 screens of scroll; the fix was IntersectionObserver play/pause, nothing scroll-position-driven. Keep it that way. `prefers-reduced-motion` must mount no `<video>` element at all (a plain `<img>` of the poster instead) — a paused-but-present video is not the same as no motion.

**Keep a visible focus ring.** `:focus-visible` in `styles.css` is deliberately unlayered so it beats Tailwind's `outline-none` on the form fields. Don't move it into `@layer`.
