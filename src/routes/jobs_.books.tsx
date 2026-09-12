import { useCallback, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  addExpense,
  addPayment,
  addTrip,
  deleteExpense,
  deletePayment,
  deleteTrip,
  getYearBooks,
  saveSettings,
  type YearBooks,
} from "@/lib/books";
import { suggestAddresses } from "@/lib/service-area";
import { resolveRebate, updateExpense } from "@/lib/receipts";
import { ReceiptDrop } from "@/components/receipt-drop";
import {
  DEDUCTION_CHECKLIST,
  ESTIMATED_TAX_DUE_2026,
  EXPENSE_CATEGORIES,
  MILEAGE_RATES,
  PHASE_LABEL,
  mileageRateFor,
  type CostPhase,
} from "@/lib/tax";
import { cn } from "@/lib/utils";
import {
  btnCls,
  fmtDate,
  ghostBtnCls,
  inputCls,
  money,
  OwnerShell,
  Stat,
  todayLocalISO,
  useOwnerLoader,
} from "@/components/owner-shell";

export const Route = createFileRoute("/jobs_/books")({ component: BooksPage });

type Tab = "summary" | "expenses" | "mileage" | "income" | "setup";

function BooksPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [tab, setTab] = useState<Tab>("summary");
  const loader = useCallback(() => getYearBooks({ data: { year } }), [year]);
  const { data, forbidden, error, reload } = useOwnerLoader(loader);

  return (
    <OwnerShell
      kicker="BOOKS & TAXES"
      title={`Schedule C · ${year}`}
      forbidden={forbidden}
      wide
      aside={
        <div className="flex items-center gap-2">
          <button type="button" className={ghostBtnCls} onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
            ‹
          </button>
          <span className="font-display text-xl tabular-nums">{year}</span>
          <button type="button" className={ghostBtnCls} onClick={() => setYear((y) => y + 1)} aria-label="Next year">
            ›
          </button>
          {data ? (
            <button type="button" className={btnCls} onClick={() => exportCsv(data)}>
              Export CSV for the CPA
            </button>
          ) : null}
        </div>
      }
    >
      {error ? <p className="mt-6 text-sm text-gold">{error}</p> : null}
      {!data && !error && !forbidden ? <p className="mt-6 text-muted">Loading the year…</p> : null}
      {data ? (
        <>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat label="Collected" value={money(data.totals.collectedCents)} hint={`${data.payments.length} payments`} tone="ok" />
            <Stat label="Expenses" value={money(data.totals.expensesCents)} hint={`${data.expenses.length} entries`} />
            <Stat label="Mileage" value={money(data.totals.mileageCents)} hint={`${data.totals.miles} mi logged`} />
            <Stat label="Net (est.)" value={money(data.totals.netCents)} hint="collected − expenses − mileage" tone={data.totals.netCents >= 0 ? "gold" : "warn"} />
            <Stat label="SE tax (est.)" value={money(data.totals.seTaxCents)} hint="15.3% × 92.35% of net" />
            <Stat
              label={`Set aside ${data.settings.reservePct}%`}
              value={money(data.totals.reserveTargetCents)}
              hint="move this to the Tax savings"
              tone="warn"
            />
          </div>

          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Books sections">
            {(
              [
                ["summary", "Schedule C"],
                ["expenses", "Expenses"],
                ["mileage", "Mileage"],
                ["income", "Income"],
                ["setup", "Setup & checklist"],
              ] as [Tab, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  tab === k ? "bg-gold text-ink" : "border border-border text-muted hover:border-gold hover:text-gold",
                )}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-6">
            {tab === "summary" ? <Summary data={data} reload={reload} /> : null}
            {tab === "expenses" ? <Expenses data={data} reload={reload} /> : null}
            {tab === "mileage" ? <Mileage data={data} reload={reload} /> : null}
            {tab === "income" ? <Income data={data} reload={reload} /> : null}
            {tab === "setup" ? <Setup data={data} reload={reload} /> : null}
          </div>
        </>
      ) : null}
    </OwnerShell>
  );
}

// ---------------------------------------------------------------------------

function Summary({ data, reload }: { data: YearBooks; reload: () => void }) {
  const t = data.totals;
  const a = t.allTime;
  return (
    <div className="space-y-6">
    <ReceiptDrop onBooked={reload} />
    <section className="card-green rounded-3xl p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-display text-xl">What it cost to start, what it costs to run</h2>
        <p className="text-xs text-muted">Every year on the books · opened {fmtDate(data.settings.businessStart)}</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Invested to start" value={money(a.investedCents)} hint="start-up costs + equipment, all time" tone="gold" />
        <Stat label="Operating spend" value={money(a.operatingCents)} hint="everything after opening day" />
        <Stat label="Collected, all time" value={money(a.collectedCents)} tone="ok" />
        <Stat
          label={a.netCents >= 0 ? "Paid back — ahead by" : "Still to pay back"}
          value={money(Math.abs(a.netCents))}
          hint="collected − all spend − mileage"
          tone={a.netCents >= 0 ? "ok" : "warn"}
        />
      </div>
      {data.settings.rebates.length ? <RebatesOwed data={data} reload={reload} /> : null}
      <p className="mt-3 text-xs text-muted">
        This year: start-up {money(t.phases.startup)} · equipment {money(t.phases.equipment)} · operating {money(t.phases.operating)}.
        {" "}{a.receipts} receipt{a.receipts === 1 ? "" : "s"} on file{a.needsReview ? ` · ${a.needsReview} flagged "check" in Expenses` : ""}.
        Start-up costs (§195) deduct up to $5,000 in year one; equipment goes through the de minimis election; both sit outside "operating" so the run-rate reads true.
      </p>
    </section>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="card-green rounded-3xl p-5">
        <h2 className="font-display text-xl">Schedule C, as it stands</h2>
        <p className="mt-1 text-xs text-muted">Form 1040 Schedule C line numbers. Gross receipts are payments actually collected (cash basis).</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              <tr>
                <td className="py-2 text-muted">1</td>
                <td className="py-2">Gross receipts</td>
                <td className="py-2 text-right tabular-nums">{money(t.collectedCents)}</td>
              </tr>
              {t.byLine.map((l) => (
                <tr key={`${l.line}-${l.label}`}>
                  <td className="py-2 text-muted">{l.line}</td>
                  <td className="py-2">{l.label}</td>
                  <td className="py-2 text-right tabular-nums">−{money(l.cents)}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2 text-muted">31</td>
                <td className="py-2">Net profit (est.)</td>
                <td className="py-2 text-right tabular-nums">{money(t.netCents)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Not on this table yet: home office (Form 8829 or the $5/sq ft simplified method), the half-SE-tax deduction and the 20% QBI deduction — those land on the 1040, not here. The CPA export carries every row above with dates and vendors.
        </p>
      </section>

      <section className="space-y-6">
        <div className="card-green rounded-3xl p-5">
          <h2 className="font-display text-xl">What the profit costs</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Self-employment tax (15.3% × 92.35%)</span>
              <b className="tabular-nums">{money(t.seTaxCents)}</b>
            </li>
            <li className="flex justify-between">
              <span>Reserve target at {data.settings.reservePct}% of collected</span>
              <b className="tabular-nums">{money(t.reserveTargetCents)}</b>
            </li>
          </ul>
          <p className="mt-3 text-xs text-muted">
            Federal 1040-ES due dates for 2026: {ESTIMATED_TAX_DUE_2026.map(fmtDate).join(" · ")}. Quarterly payments are required once you'll owe $1,000+ for the year; below that, the April return settles it.
          </p>
        </div>
        <div className="card-green rounded-3xl p-5">
          <h2 className="font-display text-xl">Mileage rates in use</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {MILEAGE_RATES.map((r) => (
              <li key={r.from} className="flex justify-between">
                <span className="text-muted">from {new Date(`${r.from}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="tabular-nums">
                  {r.cents}¢ <span className="text-muted">· {r.source}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
    </div>
  );
}

function RebatesOwed({ data, reload }: { data: YearBooks; reload: () => void }) {
  const [busy, setBusy] = useState<number | null>(null);
  const total = data.settings.rebates.reduce((s, r) => s + r.cents, 0);
  return (
    <div className="mt-4 rounded-2xl border border-gold/40 bg-bg-deep/40 p-4">
      <p className="text-xs tracking-[0.25em] text-gold">REBATES OWED TO YOU · {money(total)}</p>
      <ul className="mt-2 divide-y divide-border text-sm">
        {data.settings.rebates.map((r) => (
          <li key={r.receiptId} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <b>{r.vendor}</b> {money(r.cents)}
              {r.rebateNumber ? ` · #${r.rebateNumber}` : ""}
              {r.purchaseDate ? ` · bought ${fmtDate(r.purchaseDate)}` : ""}
              {r.mailBy ? <span className="text-muted"> · mail by {fmtDate(r.mailBy)}</span> : null}
              {" · "}
              <a href={`/api/receipt/${r.receiptId}`} target="_blank" rel="noreferrer noopener" className="text-gold hover:underline">
                slip
              </a>
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                className={cn(ghostBtnCls, "h-9")}
                disabled={busy === r.receiptId}
                onClick={async () => {
                  setBusy(r.receiptId);
                  try {
                    await resolveRebate({ data: { receiptId: r.receiptId, action: "received" } });
                    reload();
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                Received — book it
              </button>
              <button
                type="button"
                className="text-xs text-muted hover:text-gold"
                disabled={busy === r.receiptId}
                onClick={async () => {
                  setBusy(r.receiptId);
                  try {
                    await resolveRebate({ data: { receiptId: r.receiptId, action: "dismiss" } });
                    reload();
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                dismiss
              </button>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted">
        Menards pays in merchandise credit. "Received" books it as a credit against Equipment (fix the category on the row if the purchase was something else) — a vendor rebate lowers what the gear cost, it isn't income.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

function JobPicker({ jobs, value, onChange }: { jobs: YearBooks["jobs"]; value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, "mt-1")}>
      <option value="">— not tied to a job —</option>
      {jobs.map((j) => (
        <option key={j.id} value={String(j.id)}>
          #{j.id} {j.name} · {j.service.replaceAll("-", " ")}
          {j.preferred_date ? ` · ${j.preferred_date}` : ""}
        </option>
      ))}
    </select>
  );
}

function Expenses({ data, reload }: { data: YearBooks; reload: () => void }) {
  const [spentOn, setSpentOn] = useState(todayLocalISO());
  const [vendor, setVendor] = useState("");
  const [category, setCategory] = useState("supplies");
  const [amount, setAmount] = useState("");
  const [paidWith, setPaidWith] = useState<"card" | "checking" | "personal" | "cash">("card");
  const [job, setJob] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<YearBooks["expenses"][number] | null>(null);
  const cat = EXPENSE_CATEGORIES.find((c) => c.key === category);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(amount) * 100);
    if (!Number.isFinite(n) || n === 0) return;
    setBusy(true);
    try {
      await addExpense({
        data: { spentOn, vendor: vendor || undefined, category, amountCents: n, paidWith, bookingId: job ? Number(job) : null, note: note || undefined },
      });
      setAmount("");
      setVendor("");
      setNote("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <ReceiptDrop onBooked={reload} />
      {editing ? <FixExpense row={editing} jobs={data.jobs} onDone={() => { setEditing(null); reload(); }} onCancel={() => setEditing(null)} /> : null}
      <p className="text-xs tracking-[0.25em] text-gold">OR TYPE ONE IN</p>
      <form onSubmit={submit} className="card-green grid gap-3 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted">
          Date
          <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <label className="text-xs text-muted">
          Amount $ (negative = refund or rebate received)
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="0.00" />
        </label>
        <label className="text-xs text-muted">
          Vendor
          <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="Menards, GF Landfill, VistaPrint" />
        </label>
        <label className="text-xs text-muted">
          Paid with
          <select value={paidWith} onChange={(e) => setPaidWith(e.target.value as typeof paidWith)} className={cn(inputCls, "mt-1")}>
            <option value="card">Business card</option>
            <option value="checking">Alerus checking</option>
            <option value="cash">Cash</option>
            <option value="personal">Personal card (reimburse yourself)</option>
          </select>
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Category → Schedule C line {cat?.line}
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(inputCls, "mt-1")}>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label} (line {c.line})
              </option>
            ))}
          </select>
          {cat ? <span className="mt-1 block text-[11px] text-muted">{cat.hint}</span> : null}
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Job (optional)
          <JobPicker jobs={data.jobs} value={job} onChange={setJob} />
        </label>
        <label className="text-xs text-muted sm:col-span-3">
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="what it was for" />
        </label>
        <div className="flex items-end">
          <button type="submit" className={cn(btnCls, "w-full")} disabled={busy}>
            Add expense
          </button>
        </div>
      </form>

      <Table
        empty="No expenses logged this year. Snap the Acme receipt above — the door hangers ($228) and the SOS fee ($135) belong here as start-up costs."
        head={["Date", "Category", "Vendor", "Phase", "Job", "Paid with", "Amount", "Receipt", ""]}
        rows={data.expenses.map((e) => [
          fmtDate(e.spent_on),
          <span key="c">
            {EXPENSE_CATEGORIES.find((c) => c.key === e.category)?.label ?? e.category}
            {e.review === "needs-review" ? <span className="ml-2 rounded-full border border-gold px-2 py-0.5 text-[10px] text-gold">check</span> : null}
          </span>,
          <span key="v">
            {e.vendor ?? "—"}
            {e.note ? <span className="block max-w-[28ch] truncate text-xs text-muted" title={e.note}>{e.note}</span> : null}
          </span>,
          e.phase ? PHASE_LABEL[e.phase] : "—",
          e.customer ? `#${e.booking_id} ${e.customer}` : "—",
          e.paid_with ?? "—",
          <span key="a" className="tabular-nums">{money(e.amount_cents)}</span>,
          e.receipt_id ? (
            <a key="r" href={`/api/receipt/${e.receipt_id}`} target="_blank" rel="noreferrer noopener" className="text-xs text-gold hover:underline">
              view
            </a>
          ) : (
            "—"
          ),
          <span key="d" className="flex gap-2">
            <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => setEditing(e)}>
              fix
            </button>
            <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deleteExpense({ data: { id: e.id } }).then(reload)}>
              remove
            </button>
          </span>,
        ])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Mileage({ data, reload }: { data: YearBooks; reload: () => void }) {
  const [drivenOn, setDrivenOn] = useState(todayLocalISO());
  const [miles, setMiles] = useState("");
  const [purpose, setPurpose] = useState("");
  const [from, setFrom] = useState("Home");
  const [to, setTo] = useState("");
  const [job, setJob] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Number(miles);
    if (!Number.isFinite(n) || n <= 0 || purpose.trim().length < 2) return;
    setBusy(true);
    try {
      await addTrip({ data: { drivenOn, miles: n, purpose: purpose.trim(), fromLabel: from || undefined, toLabel: to || undefined, bookingId: job ? Number(job) : null } });
      setMiles("");
      setPurpose("");
      setTo("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold/40 bg-bg-deep/40 p-4 text-sm">
        <p className="text-xs tracking-[0.25em] text-gold">THE RULE</p>
        <p className="mt-1">
          Log it the day you drive it — date, where, why, miles. Reconstructed logs get thrown out. Job trips log themselves from the job page with suggested miles; this form is for everything else: Menards runs, the bank, the landfill without a job, dropping hangers.
        </p>
      </div>
      <form onSubmit={submit} className="card-green grid gap-3 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs text-muted">
          Date · {mileageRateFor(drivenOn)}¢/mi
          <input type="date" value={drivenOn} onChange={(e) => setDrivenOn(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <label className="text-xs text-muted">
          Miles
          <input inputMode="decimal" value={miles} onChange={(e) => setMiles(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="round trip" />
        </label>
        <label className="text-xs text-muted">
          From
          <input value={from} onChange={(e) => setFrom(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <label className="text-xs text-muted">
          To
          <input value={to} onChange={(e) => setTo(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="Menards · Alerus · landfill" />
        </label>
        <label className="text-xs text-muted sm:col-span-2">
          Purpose
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="Tarps and bags for the week" />
        </label>
        <label className="text-xs text-muted">
          Job (optional)
          <JobPicker jobs={data.jobs} value={job} onChange={setJob} />
        </label>
        <div className="flex items-end">
          <button type="submit" className={cn(btnCls, "w-full")} disabled={busy}>
            Log trip
          </button>
        </div>
      </form>

      <Table
        empty="No trips logged this year. Take the odometer photo today — that's mile zero."
        head={["Date", "Miles", "Rate", "Deduction", "Purpose", "Job", ""]}
        rows={data.trips.map((t) => [
          fmtDate(t.driven_on),
          <span key="m" className="tabular-nums">{t.miles}</span>,
          `${t.rate_cents}¢`,
          <span key="d" className="tabular-nums">{money(Math.round(t.miles * t.rate_cents))}</span>,
          t.purpose,
          t.customer ? `#${t.booking_id} ${t.customer}` : "—",
          <button key="x" type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deleteTrip({ data: { id: t.id } }).then(reload)}>
            remove
          </button>,
        ])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Income({ data, reload }: { data: YearBooks; reload: () => void }) {
  const [paidOn, setPaidOn] = useState(todayLocalISO());
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "check" | "venmo" | "zelle" | "stripe" | "other">("cash");
  const [job, setJob] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(amount) * 100);
    if (!Number.isFinite(n) || n === 0) return;
    setBusy(true);
    try {
      await addPayment({ data: { bookingId: job ? Number(job) : null, paidOn, amountCents: n, method, note: note || undefined } });
      setAmount("");
      setNote("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submit} className="card-green grid gap-3 rounded-3xl p-5 sm:grid-cols-2 lg:grid-cols-5">
        <label className="text-xs text-muted">
          Date
          <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <label className="text-xs text-muted">
          Amount $ (negative = refund)
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="0.00" />
        </label>
        <label className="text-xs text-muted">
          How
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={cn(inputCls, "mt-1")}>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="venmo">Venmo</option>
            <option value="zelle">Zelle</option>
            <option value="stripe">Card by hand</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs text-muted lg:col-span-2">
          Job
          <JobPicker jobs={data.jobs} value={job} onChange={setJob} />
        </label>
        <label className="text-xs text-muted sm:col-span-2 lg:col-span-4">
          Note
          <input value={note} onChange={(e) => setNote(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="tip · paid at the door · block credit applied" />
        </label>
        <div className="flex items-end">
          <button type="submit" className={cn(btnCls, "w-full")} disabled={busy}>
            Record
          </button>
        </div>
      </form>
      <p className="text-xs text-muted">Deposits and balance links paid through the site are recorded automatically by Stripe's webhook and can't be removed here.</p>
      <Table
        empty="Nothing collected yet this year."
        head={["Date", "Job", "Kind", "How", "Note", "Amount", ""]}
        rows={data.payments.map((p) => [
          fmtDate(p.paid_on),
          p.customer ? `#${p.booking_id} ${p.customer}` : "—",
          p.kind,
          p.method,
          p.note ?? "—",
          <span key="a" className="tabular-nums">{money(p.amount_cents, { sign: true })}</span>,
          p.method === "stripe" && p.kind !== "payment" ? null : (
            <button key="d" type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deletePayment({ data: { id: p.id } }).then(reload)}>
              remove
            </button>
          ),
        ])}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

function Setup({ data, reload }: { data: YearBooks; reload: () => void }) {
  const s = data.settings;
  const [home, setHome] = useState(s.homeAddress);
  const [landfill, setLandfill] = useState(s.landfillAddress);
  const [pct, setPct] = useState(String(s.reservePct));
  const [start, setStart] = useState(s.businessStart);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function geocodeAndSave(which: "home" | "landfill") {
    const text = which === "home" ? home : landfill;
    setBusy(true);
    setMsg(null);
    try {
      const hits = text.trim() ? await suggestAddresses(text.trim()) : [];
      const hit = hits[0];
      if (which === "home") {
        await saveSettings({ data: { homeAddress: text, ...(hit ? { homeLat: hit.lat, homeLon: hit.lon } : {}) } });
      } else {
        await saveSettings({
          data: { landfillAddress: text, landfillLat: hit ? hit.lat : text.trim() ? undefined : null, landfillLon: hit ? hit.lon : text.trim() ? undefined : null },
        });
      }
      setMsg(hit ? `Saved · ${hit.label}` : text.trim() ? "Saved the text, but couldn't place it on the map — suggested miles will use the old point." : "Cleared.");
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-green rounded-3xl p-5">
        <h2 className="font-display text-xl">Places the truck starts and ends</h2>
        <p className="mt-1 text-xs text-muted">Used to suggest miles on each job: home → job → landfill → home. You always see the number before it's logged.</p>
        <label className="mt-4 block text-xs text-muted">
          Home / shop address
          <div className="mt-1 flex gap-2">
            <input value={home} onChange={(e) => setHome(e.target.value)} className={inputCls} placeholder="2114 S 20th St, Grand Forks" />
            <button type="button" className={ghostBtnCls} disabled={busy} onClick={() => geocodeAndSave("home")}>
              Save
            </button>
          </div>
          <span className="mt-1 block text-[11px]">
            Current point: {s.homeLat.toFixed(4)}, {s.homeLon.toFixed(4)}
          </span>
        </label>
        <label className="mt-4 block text-xs text-muted">
          Landfill / transfer station
          <div className="mt-1 flex gap-2">
            <input value={landfill} onChange={(e) => setLandfill(e.target.value)} className={inputCls} placeholder="Grand Forks Landfill" />
            <button type="button" className={ghostBtnCls} disabled={busy} onClick={() => geocodeAndSave("landfill")}>
              Save
            </button>
          </div>
          <span className="mt-1 block text-[11px]">
            {s.landfillLat != null ? `Current point: ${s.landfillLat.toFixed(4)}, ${s.landfillLon?.toFixed(4)}` : "Not set — haul jobs suggest home → job → home only."}
          </span>
        </label>
        <label className="mt-4 block text-xs text-muted">
          Opened for business on (splits start-up costs from operating costs)
          <div className="mt-1 flex gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={cn(inputCls, "w-auto")} />
            <button
              type="button"
              className={ghostBtnCls}
              disabled={busy || !/^\d{4}-\d{2}-\d{2}$/.test(start)}
              onClick={async () => {
                setBusy(true);
                try {
                  await saveSettings({ data: { businessStart: start } });
                  setMsg(`Business start set to ${start}. Existing expenses keep their phase; re-save one with "fix" to recompute.`);
                  reload();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save
            </button>
          </div>
          <span className="mt-1 block text-[11px]">Default is the day the LLC was filed. Anything dated before this (other than equipment) counts as §195 start-up cost.</span>
        </label>
        <label className="mt-4 block text-xs text-muted">
          Tax set-aside, % of every dollar collected
          <div className="mt-1 flex gap-2">
            <input inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value)} className={cn(inputCls, "w-24")} />
            <button
              type="button"
              className={ghostBtnCls}
              disabled={busy}
              onClick={async () => {
                const n = Math.round(Number(pct));
                if (!Number.isFinite(n)) return;
                setBusy(true);
                try {
                  await saveSettings({ data: { reservePct: n } });
                  setMsg(`Reserve set to ${n}%.`);
                  reload();
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save
            </button>
          </div>
        </label>
        {msg ? <p className="mt-3 text-sm text-gold">{msg}</p> : null}
      </section>

      <section className="card-green rounded-3xl p-5">
        <h2 className="font-display text-xl">One-time set-up checklist</h2>
        <p className="mt-1 text-xs text-muted">The elections and habits that decide whether the deductions above hold up. Tick them as they happen.</p>
        <ul className="mt-4 space-y-3">
          {DEDUCTION_CHECKLIST.map((c) => {
            const on = Boolean(s.checks[c.key]);
            return (
              <li key={c.key} className="flex gap-3">
                <input
                  id={`chk-${c.key}`}
                  type="checkbox"
                  checked={on}
                  className="mt-1 size-4 accent-[var(--color-gold)]"
                  onChange={async (e) => {
                    await saveSettings({ data: { checks: { [c.key]: e.target.checked } } });
                    reload();
                  }}
                />
                <label htmlFor={`chk-${c.key}`} className="text-sm">
                  <span className={cn(on && "text-muted line-through")}>{c.label}</span>
                  <span className="mt-0.5 block text-xs text-muted">{c.why}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------

function FixExpense({
  row,
  jobs,
  onDone,
  onCancel,
}: {
  row: YearBooks["expenses"][number];
  jobs: YearBooks["jobs"];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [spentOn, setSpentOn] = useState(row.spent_on);
  const [vendor, setVendor] = useState(row.vendor ?? "");
  const [category, setCategory] = useState(row.category);
  const [amount, setAmount] = useState((row.amount_cents / 100).toFixed(2));
  const [paidWith, setPaidWith] = useState(row.paid_with ?? "");
  const [job, setJob] = useState(row.booking_id ? String(row.booking_id) : "");
  const [phase, setPhase] = useState<CostPhase | "">(row.phase ?? "");
  const [note, setNote] = useState(row.note ?? "");
  const [busy, setBusy] = useState(false);
  const cat = EXPENSE_CATEGORIES.find((c) => c.key === category);
  return (
    <form
      className="grid gap-3 rounded-3xl border border-gold/50 bg-bg-deep/50 p-5 sm:grid-cols-2 lg:grid-cols-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Math.round(Number(amount) * 100);
        if (!Number.isFinite(n) || n <= 0) return;
        setBusy(true);
        try {
          await updateExpense({
            data: {
              id: row.id,
              spentOn,
              vendor: vendor || null,
              category,
              amountCents: n,
              paidWith: (paidWith || null) as "card" | "checking" | "personal" | "cash" | "check" | null,
              bookingId: job ? Number(job) : null,
              note: note || null,
              ...(phase ? { phase } : {}),
            },
          });
          onDone();
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs tracking-[0.25em] text-gold sm:col-span-2 lg:col-span-4">
        FIX EXPENSE #{row.id}{row.receipt_id ? <> · <a className="underline" href={`/api/receipt/${row.receipt_id}`} target="_blank" rel="noreferrer noopener">receipt</a></> : null}
      </p>
      <label className="text-xs text-muted">
        Date
        <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={cn(inputCls, "mt-1")} />
      </label>
      <label className="text-xs text-muted">
        Amount $
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1")} />
      </label>
      <label className="text-xs text-muted">
        Vendor
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={cn(inputCls, "mt-1")} />
      </label>
      <label className="text-xs text-muted">
        Paid with
        <select value={paidWith} onChange={(e) => setPaidWith(e.target.value)} className={cn(inputCls, "mt-1")}>
          <option value="">—</option>
          <option value="card">Business card</option>
          <option value="checking">Alerus checking</option>
          <option value="cash">Cash</option>
          <option value="check">Check</option>
          <option value="personal">Personal card</option>
        </select>
      </label>
      <label className="text-xs text-muted sm:col-span-2">
        Category → line {cat?.line}
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(inputCls, "mt-1")}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label} (line {c.line})
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Phase
        <select value={phase} onChange={(e) => setPhase(e.target.value as CostPhase | "")} className={cn(inputCls, "mt-1")}>
          <option value="">auto (by date & category)</option>
          <option value="startup">Start-up</option>
          <option value="equipment">Equipment</option>
          <option value="operating">Operating</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Job
        <JobPicker jobs={jobs} value={job} onChange={setJob} />
      </label>
      <label className="text-xs text-muted sm:col-span-2 lg:col-span-3">
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} className={cn(inputCls, "mt-1")} />
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" className={cn(btnCls, "flex-1")} disabled={busy}>
          Save
        </button>
        <button type="button" className={ghostBtnCls} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Table({ head, rows, empty }: { head: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="card-green rounded-3xl p-6 text-sm text-muted">{empty}</p>;
  return (
    <div className="card-green overflow-x-auto rounded-3xl p-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] tracking-[0.15em] text-muted uppercase">
            {head.map((h, i) => (
              <th key={i} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 align-top">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function csvCell(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** Three sheets in one file, the way a CPA wants it: what came in, what went out, what you drove. */
function exportCsv(data: YearBooks) {
  const lines: string[] = [];
  lines.push(`Pick It Up E LLC — books ${data.year} — exported ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");
  lines.push("INCOME");
  lines.push(["date", "job", "customer", "kind", "method", "note", "amount"].join(","));
  for (const p of data.payments) lines.push([p.paid_on, p.booking_id ?? "", p.customer ?? "", p.kind, p.method, p.note ?? "", (p.amount_cents / 100).toFixed(2)].map(csvCell).join(","));
  lines.push(["", "", "", "", "", "TOTAL", (data.totals.collectedCents / 100).toFixed(2)].join(","));
  lines.push("");
  lines.push("EXPENSES");
  lines.push(["date", "schedule_c_line", "category", "phase", "vendor", "paid_with", "job", "customer", "note", "tax", "receipt", "amount"].join(","));
  for (const e of data.expenses) {
    const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
    lines.push([e.spent_on, cat?.line ?? "27a", cat?.label ?? e.category, e.phase ?? "", e.vendor ?? "", e.paid_with ?? "", e.booking_id ?? "", e.customer ?? "", e.note ?? "", e.tax_cents != null ? (e.tax_cents / 100).toFixed(2) : "", e.receipt_id ? `https://pickitupe.com/api/receipt/${e.receipt_id}` : "", (e.amount_cents / 100).toFixed(2)].map(csvCell).join(","));
  }
  lines.push(["", "", "", "", "", "", "", "", "", "", "TOTAL", (data.totals.expensesCents / 100).toFixed(2)].join(","));
  lines.push(`start-up (this year),${(data.totals.phases.startup / 100).toFixed(2)}`);
  lines.push(`equipment (this year),${(data.totals.phases.equipment / 100).toFixed(2)}`);
  lines.push(`operating (this year),${(data.totals.phases.operating / 100).toFixed(2)}`);
  lines.push("");
  lines.push("MILEAGE (standard rate)");
  lines.push(["date", "miles", "rate_cents", "deduction", "from", "to", "purpose", "job"].join(","));
  for (const t of data.trips) lines.push([t.driven_on, t.miles, t.rate_cents, (Math.round(t.miles * t.rate_cents) / 100).toFixed(2), t.from_label ?? "", t.to_label ?? "", t.purpose, t.booking_id ?? ""].map(csvCell).join(","));
  lines.push(["", data.totals.miles, "", (data.totals.mileageCents / 100).toFixed(2), "", "", "TOTAL", ""].join(","));
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`gross receipts,${(data.totals.collectedCents / 100).toFixed(2)}`);
  lines.push(`expenses,${(data.totals.expensesCents / 100).toFixed(2)}`);
  lines.push(`mileage deduction,${(data.totals.mileageCents / 100).toFixed(2)}`);
  lines.push(`net profit (est.),${(data.totals.netCents / 100).toFixed(2)}`);
  lines.push(`self-employment tax (est.),${(data.totals.seTaxCents / 100).toFixed(2)}`);
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pickitupe-books-${data.year}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
