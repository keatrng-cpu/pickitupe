# Visual / motion

Read the root [`CLAUDE.md`](../../CLAUDE.md) first. This folder is the **visual / motion** workstream.

| File | Job |
|---|---|
| `falling-leaves.tsx` | **Not mounted anywhere.** Owner asked for the edge leaves gone; `__root.tsx` no longer imports or renders it. Component itself is untouched — if it comes back, mount it once in `__root.tsx`, never per-page. |
| `haul-on-scroll.tsx` | The home haul section. Renders `public/haul-junk.mp4` — leaves AND a junk pile loaded into one truck, then it drives off (two-person crew, IntersectionObserver-gated autoplay) — **not** a scroll-driven illustration, despite the filename. `prefers-reduced-motion` mounts no `<video>` at all, just the poster as a plain `<img>`. |
| `door-hanger.tsx` | Mahogany print replica. Copy must match `print/DOOR-HANGER.md`. **Not currently rendered anywhere on the page** — the hero used to show it, now shows `hero-quote-teaser.tsx` instead. Phone is allowed inside this component if it's ever remounted (it's the print card). |
| `hero-quote-teaser.tsx` | **Pricing workstream** — the live estimate widget that replaced the door-hanger picture in the hero. Reads `pricebook.ts`; don't restyle the math from here. |
| `quote-form.tsx` | **Pricing workstream** — don't restyle the math. Tokens only. |
| `address-field.tsx` | **Pricing workstream** |
| `site-header.tsx` | Phone lives in header + footer only. Don't add a third copy. |
| `ui/button.tsx` | Cream / ghost / print variants. |

Assets: `public/haul-junk.mp4` + `public/haul-junk-poster.jpg` (the home haul scene — leaves + junk), `public/haul-crew.mp4` + `public/haul-crew-poster.jpg` (superseded, leaves-only cut, unused), `public/haul-truck.webp` (still used on `/login`), `public/haul-chair.webp` (unused, kept), `public/hero-truck.jpg`, `public/grain.png`, `public/og.jpg`. Source sketch: `attachments/image.png`.

`hero-truck.jpg` is **not displayed on the page** — its art is baked onto a near-black field and read as a dark hole against the green. Kept as source art / OG only. On-page art needs a transparent cutout **or** its own background close enough to `--color-bg` to blend on sight — `haul-junk-poster.jpg`/`.mp4` are opaque and that's fine, because the clip's own green reads as part of the page. Check visually, don't apply the rule mechanically.

`falling-leaves.tsx` is unused (see above), but the reason page wrappers stayed `relative z-10` with a transparent background instead of reverting to `bg-bg` is unrelated to this component — it's how `body` paints the page background now. Don't "fix" that back thinking it's dead code from the leaf layer.

`grain.png` has **no alpha channel**. Always pair it with `background-blend-mode` — see [`.claude/rules/visual.md`](../../.claude/rules/visual.md).

**Video, not scroll-scrubbed.** `haul-on-scroll.tsx` used to pin the page (`sticky` + `170vh`) and drive an illustrated truck by scroll position — removed, it froze the viewport for 1.7 screens of scrolling. Do not tie `video.currentTime` to scroll position either; that trades one janky mechanism for another (buffering-dependent seeking, iOS fights programmatic seek). IntersectionObserver play/pause is the whole mechanism — keep it that way.
