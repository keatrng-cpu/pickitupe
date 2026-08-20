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
