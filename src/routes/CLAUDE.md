# Pages

Read the root [`CLAUDE.md`](../../CLAUDE.md) first.

| File | Job |
|---|---|
| `__root.tsx` | HTML shell. Used to mount `FallingLeaves` here — removed at the owner's request. If it ever comes back it mounts once here, never per-page. |
| `index.tsx` | Home. Promo lines, FAQ (keep in sync with `src/lib/seo.ts`), block deal, quote form. SEO workstream owns copy; visual owns the haul video. |
| `book.tsx` | Booking page. No extra phone button — header/footer already have it. |
| `jobs.tsx` | Owner ops board. Don't rewrite marketing copy from here. |
| `login.tsx` | Auth. |
| `api/auth/$.ts` | better-auth catch-all. |

Phone: header + footer only, plus the door-hanger replica.
