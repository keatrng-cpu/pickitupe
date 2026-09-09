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
    a: "Usually mid-October to mid-November. Book before it. Leaves loose, within 3 ft of the curb. 701-738-8740.",
  },
  {
    q: "How do I hold a day?",
    a: "$50 on the card locks it. Landlord stacks run $75–$100. Deposit comes off the invoice.",
  },
  {
    q: "Gutters with the leaves?",
    a: "Rake first, then we climb. Ranch $80–$110 while we're there — trip already paid. Not a second roll, not another percent off.",
  },
];

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
