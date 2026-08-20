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

`hero-truck.jpg` is 1792×1008 (16:9) — render it at that ratio. Forcing a taller crop cuts the truck off at the wheels.

`grain.png` has **no alpha channel**. Always pair it with `background-blend-mode` — see [`.claude/rules/visual.md`](../../.claude/rules/visual.md).
