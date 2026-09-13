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
  type DropSite,
  type FixedCost,
  type YearBooks,
} from "@/lib/books";
import { LOT_SQFT, leafRangeForSqFt } from "@/lib/pricebook";
import { suggestAddresses } from "@/lib/service-area";
import { mergeExpenses, resolveRebate, updateExpense } from "@/lib/receipts";
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
      <BudgetBar spent={a.investedCents} budget={data.settings.budgetCents} />
      <NutPanel data={data} />
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

/**
 * Break-even in jobs. Until there are paid jobs, the average ticket is the
 * pricebook's standard-lot leaf cleanup midpoint; after that it's the real
 * average collected per finished job. Net per job = ticket − 25% tax reserve −
 * ~$15 of dump fees / bags / fuel (n = 0 until the job costs come in).
 */
function NutPanel({ data }: { data: YearBooks }) {
  const n = data.totals.nut;
  const std = leafRangeForSqFt(LOT_SQFT.medium ?? 7500);
  const fallbackTicket = Math.round(((std.low + std.high) / 2) * 100);
  const ticket = n.avgTicketCents ?? fallbackTicket;
  const reserve = data.settings.reservePct / 100;
  const jobCost = 1500;
  const netPerJob = Math.max(1, Math.round(ticket * (1 - reserve) - jobCost));
  const jobs = Math.ceil(n.monthlyCents / netPerJob);
  const covered = n.monthlyCents > 0 ? Math.min(100, Math.round((n.thisMonthCollectedCents * (1 - reserve)) / n.monthlyCents * 100)) : 100;
  return (
    <div className="mt-4 rounded-2xl border border-border bg-bg-deep/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-xs tracking-[0.25em] text-gold">MONTHLY NUT · {money(n.monthlyCents)}</span>
        <span className="tabular-nums">
          this month: {money(n.thisMonthCollectedCents)} collected → <b className={cn(covered >= 100 ? "text-sioux" : "text-gold")}>{covered}% covered</b> after the {data.settings.reservePct}% tax set-aside
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-deep">
        <div className={cn("h-full rounded-full", covered >= 100 ? "bg-sioux" : "bg-gold")} style={{ width: `${covered}%` }} />
      </div>
      <p className="mt-2 text-sm">
        Break-even: <b>{jobs} job{jobs === 1 ? "" : "s"} a month</b> at {money(ticket)} a ticket
        {n.avgTicketCents ? ` (your real average over ${n.doneJobs} finished job${n.doneJobs === 1 ? "" : "s"})` : " (pricebook standard-lot leaf midpoint until you have paid jobs)"} — {money(netPerJob)} net each after tax set-aside and ~$15 of dump fees and bags.
      </p>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {data.settings.fixedCosts.map((f) => (
          <li key={f.id}>
            {f.label} <span className="tabular-nums">{money(f.cents)}</span>
            <span className="ml-1 rounded-full border border-border px-1.5 py-0.5 text-[10px]">
              {f.deductible === "full" ? "deductible" : f.deductible === "interest" ? "interest only" : "not deductible"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[11px] text-muted">Truck, warranty and auto insurance are personal costs the business has to earn — the standard mileage rate is the whole vehicle deduction. Edit the list in Setup.</p>
    </div>
  );
}

function BudgetBar({ spent, budget }: { spent: number; budget: number }) {
  if (!budget) return null;
  const pct = Math.min(100, Math.round((spent / budget) * 100));
  const left = budget - spent;
  return (
    <div className="mt-4 rounded-2xl border border-border bg-bg-deep/40 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span className="text-xs tracking-[0.25em] text-gold">START-UP EQUIPMENT BUDGET</span>
        <span className="tabular-nums">
          {money(spent)} of {money(budget)} · <b className={cn(left >= 0 ? "text-sioux" : "text-gold")}>{left >= 0 ? `${money(left)} left` : `${money(-left)} over`}</b>
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-deep">
        <div className={cn("h-full rounded-full", pct >= 90 ? "bg-gold" : "bg-sioux")} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted">Counts start-up and equipment phases, all time. Set the budget in Setup.</p>
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
  const [selected, setSelected] = useState<number[]>([]);
  const cat = EXPENSE_CATEGORIES.find((c) => c.key === category);
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

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
      {selected.length >= 2 ? (
        <MergeBar rows={data.expenses.filter((e) => selected.includes(e.id))} onDone={() => { setSelected([]); reload(); }} onCancel={() => setSelected([])} />
      ) : selected.length === 1 ? (
        <p className="text-xs text-muted">Tick one more row to merge screenshots of the same receipt into one expense.</p>
      ) : null}
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
        head={["", "Date", "Category", "Vendor", "Phase", "Job", "Paid with", "Amount", "Receipt", ""]}
        rows={data.expenses.map((e) => [
          <input key="s" type="checkbox" aria-label={`Select expense ${e.id}`} checked={selected.includes(e.id)} onChange={() => toggle(e.id)} className="size-4 accent-[var(--color-gold)]" />,
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
          e.receipt_ids.length ? (
            <span key="r" className="flex flex-wrap gap-1.5">
              {e.receipt_ids.map((rid, i) => (
                <a key={rid} href={`/api/receipt/${rid}`} target="_blank" rel="noreferrer noopener" className="text-xs text-gold hover:underline">
                  {e.receipt_ids.length === 1 ? "view" : `view ${i + 1}`}
                </a>
              ))}
            </span>
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

const DROP_SERVICES = [
  { key: "leaf-cleanup", label: "Leaves" },
  { key: "junk-removal", label: "Junk" },
  { key: "furniture-appliances", label: "Furniture & appliances" },
  { key: "gutter-cleaning", label: "Gutters" },
  { key: "other", label: "Other" },
];

function Setup({ data, reload }: { data: YearBooks; reload: () => void }) {
  const s = data.settings;
  const [home, setHome] = useState(s.homeAddress);
  const [drops, setDrops] = useState<DropSite[]>(s.drops);
  const [pct, setPct] = useState(String(s.reservePct));
  const [start, setStart] = useState(s.businessStart);
  const [budget, setBudget] = useState(String(s.budgetCents / 100));
  const [fixed, setFixed] = useState<FixedCost[]>(s.fixedCosts);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function geocodeAndSave(which: "home" | number) {
    const text = which === "home" ? home : drops[which].address;
    setBusy(true);
    setMsg(null);
    try {
      const hits = text.trim() ? await suggestAddresses(text.trim()) : [];
      const hit = hits[0];
      if (which === "home") {
        await saveSettings({ data: { homeAddress: text, ...(hit ? { homeLat: hit.lat, homeLon: hit.lon } : {}) } });
      } else {
        // Geocode this row, keep the others as they are, save the whole list.
        const next = drops.map((d, i) =>
          i === which
            ? { ...d, address: text, lat: hit ? hit.lat : text.trim() ? d.lat : null, lon: hit ? hit.lon : text.trim() ? d.lon : null }
            : d,
        );
        setDrops(next);
        await saveSettings({ data: { drops: next } });
      }
      setMsg(hit ? `Saved · ${hit.label}` : text.trim() ? "Saved the text, but couldn't place it on the map — suggested miles will use the old point." : "Cleared.");
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Couldn't save.");
    } finally {
      setBusy(false);
    }
  }

  /** Which job types default to this drop — saved on toggle. */
  async function toggleService(i: number, service: string) {
    const next = drops.map((d, j) => {
      if (j === i) return { ...d, services: d.services.includes(service) ? d.services.filter((x) => x !== service) : [...d.services, service] };
      // one default per service — flipping it on here flips it off elsewhere
      return d.services.includes(service) && !drops[i].services.includes(service) ? { ...d, services: d.services.filter((x) => x !== service) } : d;
    });
    setDrops(next);
    await saveSettings({ data: { drops: next } });
    reload();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card-green rounded-3xl p-5">
        <h2 className="font-display text-xl">Places the truck starts and ends</h2>
        <p className="mt-1 text-xs text-muted">
          Used to suggest miles on each job. The day's real shape is home → job → drop → next job → drop → home; on each job you pick where that leg
          starts (home or the last drop), where the load goes, and whether you head home or on to the next one. You always see the number before it's logged.
        </p>
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
        <p className="mt-5 text-xs tracking-[0.25em] text-gold">WHERE LOADS GO</p>
        {drops.map((d, i) => (
          <div key={d.id} className="mt-3 rounded-2xl border border-border bg-bg-deep/40 p-3">
            <div className="grid gap-2 sm:grid-cols-[200px_1fr_auto]">
              <input
                value={d.label}
                onChange={(e) => setDrops(drops.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                onBlur={() => void saveSettings({ data: { drops } })}
                className={inputCls}
                aria-label="Drop site name"
              />
              <input
                value={d.address}
                onChange={(e) => setDrops(drops.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))}
                className={inputCls}
                placeholder={d.id === "landfill" ? "Grand Forks Landfill" : d.id === "compost" ? "Grand Forks compost site" : "Scrap yard / appliance recycler"}
                aria-label={`${d.label} address`}
              />
              <button type="button" className={ghostBtnCls} disabled={busy} onClick={() => geocodeAndSave(i)}>
                Save
              </button>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
              <span className="mr-1">{d.lat != null ? `${d.lat.toFixed(4)}, ${d.lon?.toFixed(4)} · default for:` : "Not placed yet · default for:"}</span>
              {DROP_SERVICES.map((svc) => (
                <button
                  key={svc.key}
                  type="button"
                  onClick={() => void toggleService(i, svc.key)}
                  className={cn(
                    "rounded-full border px-2 py-0.5",
                    d.services.includes(svc.key) ? "border-gold bg-gold/15 text-fg" : "border-border hover:border-gold",
                  )}
                >
                  {svc.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <p className="mt-2 text-[11px] text-muted">Leaves go to the compost site, junk and gutter muck to the landfill, appliances and metal to scrap — a load that pays instead of costing a tipping fee.</p>
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
          Start-up equipment budget $
          <div className="mt-1 flex gap-2">
            <input inputMode="decimal" value={budget} onChange={(e) => setBudget(e.target.value)} className={cn(inputCls, "w-32")} />
            <button
              type="button"
              className={ghostBtnCls}
              disabled={busy}
              onClick={async () => {
                const n = Math.round(Number(budget) * 100);
                if (!Number.isFinite(n) || n < 0) return;
                setBusy(true);
                try {
                  await saveSettings({ data: { budgetCents: n } });
                  setMsg(`Budget set to ${money(n)}.`);
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

      <section className="card-green rounded-3xl p-5 lg:col-span-2">
        <h2 className="font-display text-xl">Monthly obligations</h2>
        <p className="mt-1 text-xs text-muted">What has to be covered every month before you're paid. Drives the "monthly nut" and break-even on the Schedule C tab.</p>
        <div className="mt-3 space-y-2">
          {fixed.map((f, i) => (
            <div key={f.id} className="grid gap-2 sm:grid-cols-[1fr_140px_180px_auto]">
              <input value={f.label} onChange={(e) => setFixed(fixed.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} className={inputCls} aria-label="Obligation" />
              <div className="flex items-center gap-2">
                <span className="text-muted">$</span>
                <input inputMode="decimal" value={(f.cents / 100).toFixed(2)} onChange={(e) => { const n = Math.round(Number(e.target.value) * 100); setFixed(fixed.map((x, j) => (j === i ? { ...x, cents: Number.isFinite(n) ? Math.max(0, n) : 0 } : x))); }} className={inputCls} aria-label="Monthly amount" />
              </div>
              <select value={f.deductible} onChange={(e) => setFixed(fixed.map((x, j) => (j === i ? { ...x, deductible: e.target.value as FixedCost["deductible"] } : x)))} className={inputCls} aria-label="Deductible">
                <option value="none">Not deductible (personal / in mileage rate)</option>
                <option value="interest">Loan interest × business % only</option>
                <option value="full">Business expense — log it when paid</option>
              </select>
              <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => setFixed(fixed.filter((_, j) => j !== i))}>
                remove
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={ghostBtnCls} onClick={() => setFixed([...fixed, { id: `c${Date.now()}`, label: "", cents: 0, deductible: "none" }])}>
            Add a line
          </button>
          <button
            type="button"
            className={btnCls}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await saveSettings({ data: { fixedCosts: fixed.filter((f) => f.label.trim()) } });
                setMsg(`Monthly nut saved: ${money(fixed.reduce((s2, f) => s2 + f.cents, 0))}.`);
                reload();
              } finally {
                setBusy(false);
              }
            }}
          >
            Save obligations
          </button>
        </div>
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

function MergeBar({ rows, onDone, onCancel }: { rows: YearBooks["expenses"]; onDone: () => void; onCancel: () => void }) {
  const sum = rows.reduce((s, r) => s + r.amount_cents, 0);
  const biggest = rows.reduce((a, b) => (b.amount_cents > a.amount_cents ? b : a));
  const knownVendor = rows.map((r) => r.vendor).find((v) => v && !/^unknown$/i.test(v)) ?? "";
  const [amount, setAmount] = useState(((biggest.tax_cents != null ? biggest.amount_cents : sum) / 100).toFixed(2));
  const [spentOn, setSpentOn] = useState(rows.map((r) => r.spent_on).sort()[0]);
  const [vendor, setVendor] = useState(knownVendor);
  const [category, setCategory] = useState(biggest.category);
  const [busy, setBusy] = useState(false);
  const partsHaveTotal = biggest.tax_cents != null;
  return (
    <form
      className="grid gap-3 rounded-3xl border border-gold/50 bg-bg-deep/50 p-5 sm:grid-cols-2 lg:grid-cols-5"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Math.round(Number(amount) * 100);
        if (!Number.isFinite(n) || n === 0) return;
        setBusy(true);
        try {
          await mergeExpenses({ data: { ids: rows.map((r) => r.id), keepId: biggest.id, amountCents: n, spentOn, vendor: vendor || undefined, category } });
          onDone();
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs tracking-[0.25em] text-gold sm:col-span-2 lg:col-span-5">
        MERGE {rows.length} ROWS INTO ONE · #{rows.map((r) => r.id).join(", #")}
      </p>
      <label className="text-xs text-muted">
        True total $
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={cn(inputCls, "mt-1")} />
        <span className="mt-1 block text-[11px]">
          {partsHaveTotal ? `Prefilled from the part that showed tax (${money(biggest.amount_cents)}). ` : ""}Parts add to {money(sum)} — use the receipt's grand total if you can see it.
        </span>
      </label>
      <label className="text-xs text-muted">
        Date
        <input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} className={cn(inputCls, "mt-1")} />
      </label>
      <label className="text-xs text-muted">
        Vendor
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="Menards" />
      </label>
      <label className="text-xs text-muted">
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={cn(inputCls, "mt-1")}>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label} (line {c.line})
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="submit" className={cn(btnCls, "flex-1")} disabled={busy}>
          Merge
        </button>
        <button type="button" className={ghostBtnCls} onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="text-[11px] text-muted sm:col-span-2 lg:col-span-5">All {rows.length} receipts stay attached to the merged row; line items are combined; the row is marked reviewed.</p>
    </form>
  );
}

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
