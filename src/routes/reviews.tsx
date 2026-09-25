import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, X } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Reveal } from "@/components/reveal";
import { listReviews, type PublicReview } from "@/lib/care";
import { REVIEW_URL } from "@/lib/messages";
import { breadcrumbJsonLd, pageHead } from "@/lib/seo";

/**
 * /reviews — first-party reviews, photos included.
 *
 * Rules this page keeps:
 *  - Only verified customers can post (the form lives behind each job's
 *    private link, after the job is marked done).
 *  - Every rating is published; hiding is for content reasons only
 *    (see HIDE_REASONS in care.ts) — FTC 16 CFR 465.
 *  - NO Review / AggregateRating structured data. Google treats reviews a
 *    business hosts about itself as ineligible for star snippets, and marking
 *    them up anyway is a manual-action risk. The page is for people.
 *  - Zero reviews renders an honest empty state, never placeholders.
 */
export const Route = createFileRoute("/reviews")({
  head: () =>
    pageHead({
      path: "/reviews",
      title: "Reviews — Leaf Cleanup & Junk Hauling in Grand Forks | Pick It Up E",
      description:
        "Reviews from Pick It Up E customers in Grand Forks and East Grand Forks, with their photos. Every rating is posted; only customers with a finished job can review.",
      jsonLd: [breadcrumbJsonLd("/reviews", "Reviews")],
    }),
  loader: () => listReviews(),
  component: ReviewsPage,
});

function Stars({ n, size = "size-4" }: { n: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${size} ${i <= n ? "fill-gold text-gold" : "text-fg/25"}`} aria-hidden />
      ))}
    </span>
  );
}

function ReviewsPage() {
  const { reviews, count, average } = Route.useLoaderData();
  const [open, setOpen] = useState<{ ids: number[]; i: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((o) => (o ? { ...o, i: (o.i + 1) % o.ids.length } : o));
      if (e.key === "ArrowLeft") setOpen((o) => (o ? { ...o, i: (o.i - 1 + o.ids.length) % o.ids.length } : o));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <p className="kicker">Reviews</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl leading-[0.98] sm:text-6xl">
          From the people whose yards we cleared.
        </h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-fg/90">
          {count ? (
            <>
              <span className="inline-flex items-center gap-2">
                <Stars n={Math.round(average ?? 0)} />
                <b>{average?.toFixed(1)}</b> from {count} customer{count === 1 ? "" : "s"}
              </span>
              <span className="text-muted">Every rating is posted. Only customers with a finished job can review.</span>
            </>
          ) : (
            <span className="text-muted">
              We're new this fall — the first reviews land here as jobs finish. Every rating gets posted, not just the
              good ones.
            </span>
          )}
        </div>

        {count ? (
          <ul className="mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {reviews.map((r, idx) => (
              <li key={r.id} className="mb-4 break-inside-avoid">
                <Reveal delay={(idx % 3) * 80}>
                  <ReviewCard r={r} onPhoto={(i) => setOpen({ ids: r.photos, i })} />
                </Reveal>
              </li>
            ))}
          </ul>
        ) : null}

        <section className="card-green mt-12 rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-3xl leading-none">Had a job with us?</h2>
          <p className="mt-3 max-w-2xl text-sm text-fg/90">
            The review form — photos included — is on your job page, the link in your booking text and email. Lost
            it? <Link to="/status" className="text-gold underline underline-offset-4">We'll send it again</Link>. And a
            Google review helps the next neighbor find us more than anything:
          </p>
          <a
            href={REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-press mt-5 inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
          >
            Review us on Google
          </a>
        </section>
      </main>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          className="fixed inset-0 z-50 grid place-items-center bg-bg-deep/95 p-4"
          onClick={() => setOpen(null)}
        >
          <img
            src={`/api/review-photo/${open.ids[open.i]}`}
            alt={`Customer photo ${open.i + 1} of ${open.ids.length}`}
            className="stagger-in max-h-[85dvh] max-w-full rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 grid size-11 place-items-center rounded-full border border-border text-fg"
            onClick={() => setOpen(null)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>
      ) : null}
      <SiteFooter />
    </div>
  );
}

function ReviewCard({ r, onPhoto }: { r: PublicReview; onPhoto: (i: number) => void }) {
  const when = new Date(r.publishedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return (
    <article className="card-green card-lift rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <Stars n={r.rating} />
        <span className="text-xs text-muted">{when}</span>
      </div>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-fg/95">{r.body}</p>
      {r.photos.length ? (
        <div className={`mt-4 grid gap-2 ${r.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
          {r.photos.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => onPhoto(i)}
              className="overflow-hidden rounded-xl"
              aria-label={`Open photo ${i + 1} from ${r.displayName}`}
            >
              <img
                src={`/api/review-photo/${id}`}
                alt={`Photo from ${r.displayName}'s ${r.serviceLabel.toLowerCase() || "job"}`}
                loading="lazy"
                className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.03]"
              />
            </button>
          ))}
        </div>
      ) : null}
      <p className="mt-4 text-xs uppercase tracking-[0.14em] text-gold">
        {r.displayName}
        {r.area ? ` · ${r.area}` : ""}
        {r.serviceLabel ? ` · ${r.serviceLabel}` : ""}
      </p>
      {r.ownerReply ? (
        <div className="mt-4 border-l-2 border-gold/50 pl-3 text-sm text-fg/85">
          <p className="text-xs uppercase tracking-[0.14em] text-gold">Keaton replied</p>
          <p className="mt-1">{r.ownerReply}</p>
        </div>
      ) : null}
    </article>
  );
}
