import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import type { ServiceKey } from "@/lib/pricebook";

/**
 * Shared frame for the five ranking pages (/leaf-cleanup-grand-forks,
 * /junk-removal-grand-forks, /gutter-cleaning-grand-forks, /east-grand-forks,
 * /reviews). Each page owns its copy, price table and FAQ; this owns the
 * chrome, the hero, the CTA and the "not a doorway page" rules:
 *   - prices come from pricebook.ts constants, never typed by hand
 *   - three real photos with alt text, from /public/work
 *   - the CTA deep-links /call with the service pre-picked
 *   - phone lives in the header/footer only (CLAUDE.md)
 */

export type Faq = { q: string; a: string };

export function ServicePage(props: {
  kicker: string;
  title: ReactNode;
  intro: ReactNode;
  cta: { service: ServiceKey; label: string; size?: string };
  photos: { src: string; alt: string }[];
  faqs: Faq[];
  children: ReactNode;
}) {
  return (
    <div className="page-service relative z-10 min-h-screen bg-bg text-fg">
      <SiteHeader />
      <main id="main">
        <section className="mx-auto max-w-6xl px-4 pb-6 pt-10 sm:pt-14">
          <p className="kicker">{props.kicker}</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl leading-[0.98] tracking-[-0.02em] sm:text-6xl">
            {props.title}
          </h1>
          <div className="mt-6 max-w-3xl text-base leading-7 text-fg/90">{props.intro}</div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/call"
              search={{ service: props.cta.service, ...(props.cta.size ? { size: props.cta.size } : {}) }}
              className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-7 text-base font-medium text-ink hover:bg-gold"
            >
              {props.cta.label}
              <ArrowRight className="size-4" />
            </Link>
            <Link to="/" hash="faq" className="text-sm text-fg/80 underline-offset-4 hover:text-gold hover:underline">
              Fine print
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-6">
          <ul className="grid gap-3 sm:grid-cols-3">
            {props.photos.map((p) => (
              <li key={p.src} className="overflow-hidden rounded-2xl card-green">
                <img src={p.src} alt={p.alt} loading="lazy" width={800} height={600} className="aspect-[4/3] w-full object-cover" />
              </li>
            ))}
          </ul>
        </section>

        <article className="service-body mx-auto max-w-6xl px-4 py-6">{props.children}</article>

        <section className="mx-auto max-w-6xl px-4 py-8" aria-labelledby="page-faq">
          <p className="kicker">Questions</p>
          <h2 id="page-faq" className="mt-3 font-display text-3xl leading-none sm:text-4xl">
            Straight answers.
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {props.faqs.map((f) => (
              <li key={f.q} className="card-green rounded-2xl p-5">
                <p className="font-display text-xl leading-snug">{f.q}</p>
                <p className="mt-2 text-sm leading-6 text-fg/90">{f.a}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}

/** Two-column prose section with a display heading. */
export function Block(props: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 grid gap-4 md:grid-cols-[1fr_2fr]">
      <h2 className="font-display text-2xl leading-tight sm:text-3xl">{props.title}</h2>
      <div className="space-y-4 text-base leading-7 text-fg/90">{props.children}</div>
    </section>
  );
}

/** Price table. Rows are [label, range-or-text, note]. Ranges must come from pricebook.ts. */
export function PriceTable(props: { caption: string; rows: [string, string, string?][] }) {
  return (
    <div className="mt-6 overflow-x-auto rounded-2xl card-paper p-1">
      <table className="w-full text-left text-sm text-print">
        <caption className="px-4 pb-2 pt-3 text-left font-display text-lg">{props.caption}</caption>
        <tbody>
          {props.rows.map(([label, price, note]) => (
            <tr key={label} className="border-t border-print/10">
              <td className="px-4 py-2.5 font-medium">{label}</td>
              <td className="whitespace-nowrap px-4 py-2.5 tabular-nums">{price}</td>
              <td className="px-4 py-2.5 text-print/70">{note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
