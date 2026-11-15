import { Plus } from "lucide-react";
import { AskBox } from "@/components/ask-box";
import { FAQ } from "@/lib/seo";

// The on-page FAQ and the FAQPage JSON-LD read the same list (src/lib/seo.ts) —
// CLAUDE.md: FAQ on page must match JSON-LD. Native <details>: keyboard and
// screen readers for free, every answer still in the HTML for search, and a
// phone scrolls past six questions instead of six cards.
const FAQS = FAQ;

export function FinePrint() {
  return (
    <section id="faq" className="section-y mx-auto max-w-6xl px-4">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <p className="kicker">FAQ</p>
          <h2 className="mt-3 font-display text-3xl leading-[0.98] sm:text-4xl lg:text-5xl">
            Fine print, in plain words.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Tap a question. Anything not here, ask below — a real person reads what the assistant flags.
          </p>
        </div>
        <div className="faq-list lg:col-span-8">
          {FAQS.map((f) => (
            <details key={f.q} className="faq-item group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5">
                <span className="font-display text-xl leading-snug sm:text-2xl">{f.q}</span>
                <span
                  className="mt-1 grid size-8 shrink-0 place-items-center rounded-full border border-border text-gold transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                >
                  <Plus className="size-4" />
                </span>
              </summary>
              <p className="max-w-[62ch] pb-6 pr-12 text-base leading-7 text-fg/88">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
      <div className="mt-12">
        <AskBox />
      </div>
    </section>
  );
}
