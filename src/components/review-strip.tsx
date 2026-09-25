import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Star } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { listReviews, type PublicReview } from "@/lib/care";

/**
 * Home-page strip: the three newest published reviews, photo first.
 *
 * Renders NOTHING until real reviews exist — no placeholders, no "sample"
 * testimonials (CLAUDE.md: no fake testimonials). Newest, not best: picking
 * only the 5-star ones for the home page would be its own kind of gating.
 */
export function ReviewStrip() {
  const [data, setData] = useState<{ reviews: PublicReview[]; count: number; average: number | null } | null>(null);

  useEffect(() => {
    let alive = true;
    listReviews()
      .then((d) => alive && setData(d))
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, []);

  if (!data || !data.count) return null;
  const top = data.reviews.slice(0, 3);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10" aria-labelledby="home-reviews">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="kicker">From the neighbors</p>
            <h2 id="home-reviews" className="mt-2 font-display text-3xl leading-none sm:text-4xl">
              {data.average?.toFixed(1)} from {data.count} customer{data.count === 1 ? "" : "s"}.
            </h2>
          </div>
          <Link to="/reviews" className="inline-flex items-center gap-2 text-sm text-gold hover:underline">
            Every review, photos too <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Reveal>
      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {top.map((r, i) => (
          <li key={r.id}>
            <Reveal delay={i * 90}>
              <article className="card-green card-lift h-full overflow-hidden rounded-2xl">
                {r.photos[0] ? (
                  <img
                    src={`/api/review-photo/${r.photos[0]}`}
                    alt={`Photo from ${r.displayName}'s job`}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : null}
                <div className="p-5">
                  <span className="inline-flex gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`size-4 ${n <= r.rating ? "fill-gold text-gold" : "text-fg/25"}`} aria-hidden />
                    ))}
                  </span>
                  <p className="mt-3 line-clamp-5 text-sm leading-6">{r.body}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">
                    {r.displayName}
                    {r.area ? ` · ${r.area}` : ""}
                  </p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
