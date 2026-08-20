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

**Keep a visible focus ring.** `:focus-visible` in `styles.css` is deliberately unlayered so it beats Tailwind's `outline-none` on the form fields. Don't move it into `@layer`.
