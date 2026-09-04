import { AskBox } from "@/components/ask-box";

const FAQS = [
  {
    q: "Do I bag the leaves?",
    a: "No. Loose piles are fine — we rake, blow, and haul.",
  },
  {
    q: "What can't you take?",
    a: "Paint, chemicals, oil, propane, concrete, dirt, roofing, or asbestos.",
  },
  {
    q: "City leaf vacuum?",
    a: "Usually mid-October to mid-November. Leaves loose, within 3 ft of the curb, not in the street. 701-738-8740.",
  },
];

export function FinePrint() {
  return (
    <section id="faq" className="section-y mx-auto max-w-6xl px-4">
      <details className="fine-print">
        <summary>Fine print & FAQ</summary>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
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
      </details>
    </section>
  );
}
