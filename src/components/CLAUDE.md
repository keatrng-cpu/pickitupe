# Visual / motion

Read the root [`CLAUDE.md`](../../CLAUDE.md) first. This folder is the **visual / motion** workstream.

| File | Job |
|---|---|
| `falling-leaves.tsx` | Site-wide edge leaves. Mounted once in `src/routes/__root.tsx`. Left + right gutters only. Scroll boosts fall speed. Honor `prefers-reduced-motion`. |
| `haul-on-scroll.tsx` | Vintage cream truck drives **left → right**. Asset already faces right — never `-scale-x-100`. Chair lifts from the lawn into the bed. |
| `door-hanger.tsx` | On-site mahogany replica. Copy must match `print/DOOR-HANGER.md`. Phone is allowed here (print card). |
| `quote-form.tsx` | **Pricing workstream** — don't restyle the math. Tokens only. |
| `address-field.tsx` | **Pricing workstream** |
| `site-header.tsx` | Phone lives in header + footer only. Don't add a third copy. |
| `ui/button.tsx` | Cream / ghost / print variants. |

Assets: `public/haul-truck.webp`, `public/haul-chair.webp`, `public/hero-truck.jpg`, `public/grain.png`, `public/og.jpg`. Source sketch: `attachments/image.png`.

`hero-truck.jpg` is **not displayed on the page** — its art is baked onto a near-black field and read as a dark hole against the green. Kept as source art / OG only. On-page art must be a transparent cutout.

`falling-leaves.tsx` renders at **`z-0`, behind the content**; page wrappers are transparent and `relative z-10`. Don't raise it — at `z-30` the leaves covered the door hanger on mobile.

`grain.png` has **no alpha channel**. Always pair it with `background-blend-mode` — see [`.claude/rules/visual.md`](../../.claude/rules/visual.md).
