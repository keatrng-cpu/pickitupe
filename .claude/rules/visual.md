---
paths:
  - src/components/falling-leaves.tsx
  - src/components/haul-on-scroll.tsx
  - src/components/door-hanger.tsx
  - src/styles.css
  - src/routes/__root.tsx
  - public/**
---

Visual / motion workstream. Truck faces RIGHT — never `-scale-x-100`. Leaves only on the left and right edges, scroll-boosted, mounted once in `__root.tsx`. Tokens stay in `src/styles.css` `@theme`. Don't rewrite `pricebook.ts` from here.

**`public/grain.png` is opaque** — RGB colortype 2, no alpha, no `tRNS`. Any rule that sets it as `background-image` over a `background-color` **must** also set `background-blend-mode` (we use `soft-light`), or the grain paints straight over the colour and the element renders flat grey. This is what made the mahogany door hanger grey. Applies to `.card-print`, `.card-paper`, `.card-estimate`, and `body`.

**Leaf layer sits BEHIND content.** `FallingLeaves` is `fixed inset-0 z-0`; every page wrapper is transparent with `relative z-10` and the page background is painted by `body`. At `z-30` the leaves floated over everything — invisible on desktop where they fall in the gutters, but on a phone there is no gutter and they landed across the door hanger like litter. Don't re-add `bg-bg` to a page wrapper or raise the leaf z-index. Leaf inset is capped with `min(Npx, 5vw)` for the same reason.

**No opaque-background art on the page.** Art placed on the Sioux-green background must be a transparent cutout (`haul-truck.webp`, `haul-chair.webp`). `hero-truck.jpg` is baked onto a near-black field and reads as a dark hole — it was removed from the page at the owner's request. Source art and OG only.

**Keep a visible focus ring.** `:focus-visible` in `styles.css` is deliberately unlayered so it beats Tailwind's `outline-none` on the form fields. Don't move it into `@layer`.
