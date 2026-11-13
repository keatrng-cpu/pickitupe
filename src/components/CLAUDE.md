# Visual / motion

Read the root [`CLAUDE.md`](../../CLAUDE.md) first. This folder is the **visual / motion** workstream.

## Winter (2026-11): `winter/`

Owner, Nov 13: favor junk removal, be as creative as possible with design, animation and a 3D look, keep navigation clean.

| File | Job |
|---|---|
| `winter/truck-scene.ts` | Procedural three.js scene: the cream pickup (couch, fridge, boxes, door lettering) in snow with pines. No model or texture downloads. Renders only while visible, tab shown and motion not paused; one still frame otherwise. Disposes everything. |
| `winter/truck-stage.tsx` | Home hero stage. SVG poster paints first (reserved aspect box, no CLS); the scene chunk loads after `load` + idle, skipped on Save-Data / 2g / low memory / no WebGL. **Swap slot:** `video={{ mp4, webm, poster }}` replaces the 3D with a rendered loop (e.g. Higgsfield) without layout changes. |
| `winter/truck-svg.tsx` | Side-view SVG truck (faces right — never flip). Poster, how-it-works road, estate hero. |
| `winter/snowfall.tsx` | CSS-only snow. Seeded positions (no hydration mismatch). Three falls then stops on phones. |
| `winter/motion.ts`, `motion-toggle.tsx` | `html[data-motion="paused"]` + localStorage. The "Pause snow" button (WCAG 2.2.2). Reduced motion counts as paused. |
| `winter/how-it-works.tsx` | Truck drives the road as the section scrolls (CSS `animation-timeline: view()`); IntersectionObserver fallback parks it. |
| `winter/scroll-road.tsx` | Gold fill under the header ticker on `animation-timeline: scroll()`. Decorative, hidden where unsupported. |
| `winter/count-up.tsx` | Count-up once on view; server renders the final number. Only numbers from code (pricebook, schedule). |
| `winter/before-after.tsx` | Range-input wipe, illustrated garage until real photos exist. **Swap slot:** `before` / `after` image props — real job photos only, never AI renders. |
| `winter/bed-load.tsx` | Quick-quote junk sizes load a cutaway truck bed (one drop per pick, keyed on size; gauge shows only the fractions the pricebook names). Decorative, aria-hidden; off under reduced motion. |
| `src/lib/truck-art.ts` | **The brand truck**, Nov 13 (owner: "a little more classy"): vintage cream pickup, chrome, whitewalls, walnut stake rails, tarp load. Plain SVG markup shared by `TruckSvg` (site) and the print build — change it here and both follow. viewBox 0 0 320 160, faces right. |
| `src/lib/media.ts` | `MEDIA.heroLoop` (Higgsfield loop slot, see `docs/HIGGSFIELD.md` + `scripts/ingest-clip.mjs`) and `MEDIA.hero3D` — the procedural 3D truck is **off** since Nov 13 (it read toy-like next to the classy illustration); flip to `true` to bring it back. |

Scroll-driven motion is allowed **only** as CSS scroll timelines: no JS scroll listeners, no pinning, no `currentTime` scrubbing (the reasons the old rule existed).

The home hero no longer uses `haul-junk.mp4` (leaf tarp + rake). `haul-video.tsx` / `haul-on-scroll.tsx` stay in the repo for spring.

| File | Job |
|---|---|
| `falling-leaves.tsx` | **Not mounted anywhere.** Owner asked for the edge leaves gone; `__root.tsx` no longer imports or renders it. Component itself is untouched — if it comes back, mount it once in `__root.tsx`, never per-page. |
| `haul-on-scroll.tsx` | The home haul section. Renders `public/haul-junk.mp4` — leaves AND a junk pile loaded into one truck, then it drives off (two-person crew, IntersectionObserver-gated autoplay) — **not** a scroll-driven illustration, despite the filename. `prefers-reduced-motion` mounts no `<video>` at all, just the poster as a plain `<img>`. |
| `door-hanger.tsx` | Mahogany print replica. Copy must match `print/DOOR-HANGER.md`. **Not currently rendered anywhere on the page** — the hero used to show it, now shows `hero-quote-teaser.tsx` instead. Phone is allowed inside this component if it's ever remounted (it's the print card). |
| `hero-quote-teaser.tsx` | **Pricing workstream** — the live estimate widget that replaced the door-hanger picture in the hero, and now the page's **only** estimate: service, size, add-ons, price, line breakdown. Links to `/book` carrying the selection. Reads `pricebook.ts`; don't restyle the math from here. |
| `quote-form.tsx` | **Pricing workstream** — don't restyle the math. Tokens only. **Renders on `/book` only** — it is no longer on the home page (it duplicated the hero card). |
| `address-field.tsx` | **Pricing workstream** |
| `site-header.tsx` | Logo is `public/logo.png` (cream pickup on a maple, rounded tile). Phone lives in header + footer only. Don't add a third copy. |
| `ask-box.tsx` | The AI concierge — under the FAQ and on every job page (`token` prop gives it the job). `claude-opus-5`; it **never computes a price** — every number it may state is rendered from `pricebook.ts` into its system prompt server-side (`src/lib/chat-actions.ts`). Labelled as an AI; anything it flags goes to the owner as a ticket. Not a floating bubble, on purpose: a launcher that follows you down the page is the generic-AI-startup tell this site avoids. |
| `job-ticket.tsx`, `booked-screen.tsx` | The printed ticket and the post-checkout screen. The screen shows the day from `confirmDeposit`, never from the URL. |
| `reveal.tsx` | Rise-into-view. Only hides content that starts below the fold, after hydration — never SSR content. |
| `ui/button.tsx` | Cream / ghost / print variants. |

Assets: `public/logo.png`, `public/favicon.svg`, `public/haul-junk.mp4` + `public/haul-junk-poster.jpg` (the home haul scene — leaves + junk), `public/haul-crew.mp4` + `public/haul-crew-poster.jpg` (superseded, leaves-only cut, unused), `public/haul-truck.webp` (still used on `/login`), `public/haul-chair.webp` (unused, kept), `public/hero-truck.jpg`, `public/grain.png`, `public/og.jpg`. Logo source: `attachments/logo-source.png`. Source sketch: `attachments/image.png`.

`hero-truck.jpg` is **not displayed on the page** — its art is baked onto a near-black field and read as a dark hole against the green. Kept as source art / OG only. On-page art needs a transparent cutout **or** its own background close enough to `--color-bg` to blend on sight — `haul-junk-poster.jpg`/`.mp4` are opaque and that's fine, because the clip's own green reads as part of the page. Check visually, don't apply the rule mechanically.

`falling-leaves.tsx` is unused (see above), but the reason page wrappers stayed `relative z-10` with a transparent background instead of reverting to `bg-bg` is unrelated to this component — it's how `body` paints the page background now. Don't "fix" that back thinking it's dead code from the leaf layer.

`grain.png` has **no alpha channel**. Always pair it with `background-blend-mode` — see [`.claude/rules/visual.md`](../../.claude/rules/visual.md).

**Video, not scroll-scrubbed.** `haul-on-scroll.tsx` used to pin the page (`sticky` + `170vh`) and drive an illustrated truck by scroll position — removed, it froze the viewport for 1.7 screens of scrolling. Do not tie `video.currentTime` to scroll position either; that trades one janky mechanism for another (buffering-dependent seeking, iOS fights programmatic seek). IntersectionObserver play/pause is the whole mechanism — keep it that way.
