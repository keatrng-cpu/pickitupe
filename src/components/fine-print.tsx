import { AskBox } from "@/components/ask-box";
import { FAQ } from "@/lib/seo";

// The on-page FAQ and the FAQPage JSON-LD read the same list (src/lib/seo.ts) —
// CLAUDE.md: FAQ on page must match JSON-LD.
const FAQS = FAQ;

export function FinePrint() {
  return (
    <section id="faq" className="section-y mx-auto max-w-6xl px-4">
      <p className="kicker">FAQ</p>
      <h2 className="mt-3 font-display text-3xl leading-none sm:text-4xl">
        Fine print, in plain words.
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FAQS.map((f) => (
          <li key={f.q} className="card-green rounded-2xl p-5">
            <p className="font-display text-xl leading-snug">{f.q}</p>
            <p className="mt-2 text-sm leading-6 text-fg/90">{f.a}</p>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <AskBox />
      </div>
    </section>
  );
}
