import { useCallback, useState, type FormEvent, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, MessageSquare, Navigation, Phone } from "lucide-react";
import { addBookingEvent, addExpense, addPayment, addTrip, deleteExpense, deletePayment, deleteTrip, getBookingDetail, updateBookingDetails, type BookingDetail, type DropSite } from "@/lib/books";
import { smsLink, TEMPLATES } from "@/lib/messages";
import { startBalanceInvoice } from "@/lib/pay-actions";
import { formatAddOns, PROMO_CAP, PROMO_PERCENT } from "@/lib/pricebook";
import { EXPENSE_CATEGORIES, mileageRateFor, routeMiles, type Point } from "@/lib/tax";
import { ReceiptDrop } from "@/components/receipt-drop";
import { cn } from "@/lib/utils";
import {
  btnCls,
  fmtDate,
  fmtWhen,
  ghostBtnCls,
  inputCls,
  money,
  OwnerShell,
  todayLocalISO,
  useOwnerLoader,
} from "@/components/owner-shell";

export const Route = createFileRoute("/jobs_/$id")({ component: JobPage });

const STATUSES = ["hold", "new", "quoted", "scheduled", "done", "cancelled"] as const;
const STATUS_HELP: Record<string, string> = {
  hold: "Card not run yet",
  new: "Needs a first reply",
  quoted: "Number sent, waiting on YES",
  scheduled: "On the calendar",
  done: "Work finished — bill it",
  cancelled: "Closed, no work",
};
const SOURCE_LABEL: Record<string, string> = { dh: "Door hanger", gbp: "Google profile", chat: "Phone line" };
const EVENT_ICON: Record<string, string> = {
  note: "✎", call: "☎", text: "💬", email: "✉", status: "→", payment: "$", system: "·",
};

function JobPage() {
  const { id } = Route.useParams();
  const bookingId = Number(id);
  const loader = useCallback(() => getBookingDetail({ data: { id: bookingId } }), [bookingId]);
  const { data, forbidden, error, reload } = useOwnerLoader(loader, Number.isFinite(bookingId));

  if (!Number.isFinite(bookingId)) {
    return (
      <OwnerShell kicker="JOB" title="Not a job">
        <p className="mt-6 text-muted">That link isn't a job number.</p>
      </OwnerShell>
    );
  }

  const b = data?.booking;
  return (
    <OwnerShell
      kicker={`JOB #${bookingId}`}
      title={b ? b.name : "Loading…"}
      forbidden={forbidden}
      aside={
        <Link to="/jobs" className={ghostBtnCls}>
          ← Board
        </Link>
      }
    >
      {error ? <p className="mt-6 text-sm text-gold">{error}</p> : null}
      {data === null && !error && !forbidden ? <p className="mt-6 text-muted">Loading job…</p> : null}
      {data && !data.booking ? <p className="mt-6 text-muted">No job #{bookingId}.</p> : null}
      {data && data.booking ? <JobDetail data={data} reload={reload} /> : null}
    </OwnerShell>
  );
}

function JobDetail({ data, reload }: { data: BookingDetail; reload: () => void }) {
  const { booking: b, events, payments, expenses, trips, suggestedMiles } = data;
  const est = b.estimate_low != null && b.estimate_high != null ? `$${b.estimate_low}–$${b.estimate_high}` : null;
  const billCents = b.final_cents ?? (b.estimate_high != null ? b.estimate_high * 100 : null);
  const owedCents = billCents != null ? Math.max(0, billCents - b.paid_cents) : null;
  const jobCostCents = expenses.reduce((s, e) => s + e.amount_cents, 0);
  const jobMileageCents = Math.round(trips.reduce((s, t) => s + t.miles * t.rate_cents, 0));
  const netCents = b.paid_cents - jobCostCents - jobMileageCents;
  const ctx = {
    name: b.name,
    service: b.service.replaceAll("-", " "),
    estimate: est ?? undefined,
    date: b.preferred_date ?? undefined,
    earlyBird: b.early_bird,
  };

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {/* ---------------------------------------------------------------- */}
      <div className="space-y-6">
        <section className="card-green rounded-3xl p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">
                {b.service.replaceAll("-", " ")}
                {b.job_size ? ` · ${b.job_size}` : ""}
                {b.add_ons ? ` · ${formatAddOns(b.add_ons)}` : ""}
                {b.source ? ` · via ${SOURCE_LABEL[b.source] ?? b.source}` : ""}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <a className="inline-flex items-center gap-1 text-gold" href={`tel:${b.phone}`} onClick={() => void addBookingEvent({ data: { id: b.id, kind: "call", body: `Called ${b.phone}` } }).then(reload).catch(() => {})}>
                  <Phone className="size-3.5" /> {b.phone}
                </a>
                {b.email ? (
                  <a className="text-muted hover:text-fg" href={`mailto:${b.email}`}>
                    {b.email}
                  </a>
                ) : null}
                <a
                  className="inline-flex items-center gap-1 text-muted hover:text-fg"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.address)}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <Navigation className="size-3.5" /> Directions
                </a>
              </p>
              <p className="mt-1 flex items-start gap-1 text-sm text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" /> {b.address}
                {b.area_tier && b.area_tier !== "core" ? <span className="ml-2 text-gold">({b.area_tier})</span> : null}
              </p>
              {b.extra_addresses
                ? b.extra_addresses.split("\n").map((l) => (
                    <p key={l} className="ml-5 text-sm text-muted">
                      {l}
                    </p>
                  ))
                : null}
              <p className="mt-2 text-xs text-muted">
                Booked {fmtWhen(b.created_at)}
                {b.urgency ? ` · ${b.urgency.replaceAll("-", " ")}` : ""}
                {b.households && b.households > 1 ? ` · block of ${b.households}` : ""}
                {b.neighbor_of ? ` · neighbor of ${b.neighbor_of}` : ""}
              </p>
            </div>
            <div className="text-right">
              {est ? <p className="font-display text-3xl">{est}</p> : <p className="text-muted">No estimate</p>}
              <div className="mt-2 flex flex-wrap justify-end gap-1.5">
                {b.applied_discount === "promo" ? (
                  <span className="rounded-full bg-sioux px-3 py-1 text-xs">
                    {Math.round(PROMO_PERCENT * 100)}% off (≤${PROMO_CAP}) −${b.discount_amount ?? 0}
                  </span>
                ) : b.applied_discount === "block" ? (
                  <span className="rounded-full bg-sioux px-3 py-1 text-xs">Block credit −${b.discount_amount ?? 0}</span>
                ) : null}
                {b.deposit_paid ? (
                  <span className="rounded-full bg-sioux px-3 py-1 text-xs">${Math.round((b.deposit_cents ?? 5000) / 100)} deposit paid</span>
                ) : null}
                {b.balance_paid ? <span className="rounded-full bg-gold px-3 py-1 text-xs text-ink">Balance paid</span> : null}
              </div>
            </div>
          </div>

          {b.notes ? (
            <div className="mt-4 rounded-2xl bg-bg-deep/50 p-3 text-sm">
              <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Customer wrote</p>
              <p className="mt-1 whitespace-pre-wrap">{b.notes}</p>
            </div>
          ) : null}

          <StatusRow b={b} reload={reload} />
        </section>

        <MoneyPanel
          key={`${billCents ?? "x"}-${b.paid_cents}`}
          b={b}
          payments={payments}
          billCents={billCents}
          owedCents={owedCents}
          reload={reload}
        />

        <section className="card-green rounded-3xl p-5">
          <h2 className="font-display text-xl">Job costs & miles</h2>
          <p className="mt-1 text-xs text-muted">
            Pinned to this job so its real margin shows. Paid {money(b.paid_cents)} − costs {money(jobCostCents)} − mileage {money(jobMileageCents)} ={" "}
            <b className={cn(netCents >= 0 ? "text-sioux" : "text-gold")}>{money(netCents)}</b>
          </p>
          <div className="mt-3">
            <ReceiptDrop bookingId={b.id} onBooked={reload} compact />
          </div>
          <ExpenseQuickAdd bookingId={b.id} reload={reload} />
          {expenses.length ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {fmtDate(e.spent_on)} · {EXPENSE_CATEGORIES.find((c) => c.key === e.category)?.label ?? e.category}
                    {e.vendor ? ` · ${e.vendor}` : ""}
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    {money(e.amount_cents)}
                    <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deleteExpense({ data: { id: e.id } }).then(reload)}>
                      remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <TripQuickAdd
            key={`${suggestedMiles ?? "x"}-${trips.length}`}
            bookingId={b.id}
            suggested={suggestedMiles}
            address={b.address}
            service={b.service}
            job={b.lat != null && b.lon != null ? { lat: b.lat, lon: b.lon } : null}
            home={{ lat: data.settings.homeLat, lon: data.settings.homeLon }}
            drops={data.settings.drops}
            reload={reload}
          />
          {trips.length ? (
            <ul className="mt-3 divide-y divide-border text-sm">
              {trips.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {fmtDate(t.driven_on)} · {t.miles} mi @ {t.rate_cents}¢ · {t.purpose}
                  </span>
                  <span className="flex items-center gap-3 tabular-nums">
                    {money(Math.round(t.miles * t.rate_cents))}
                    <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deleteTrip({ data: { id: t.id } }).then(reload)}>
                      remove
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      {/* ---------------------------------------------------------------- */}
      <div className="space-y-6">
        <section className="card-green rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-xl">
            <MessageSquare className="size-4" /> Text the customer
          </h2>
          <p className="mt-1 text-xs text-muted">Opens your Messages app with the text filled in. Each tap is logged below.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {TEMPLATES.map((t) => (
              <a
                key={t.kind}
                href={smsLink(b.phone, t.build(ctx))}
                onClick={() => void addBookingEvent({ data: { id: b.id, kind: "text", body: `${t.label}: ${t.build(ctx)}` } }).then(reload).catch(() => {})}
                className={cn(
                  "btn-press rounded-full border px-3.5 py-1.5 text-xs transition hover:border-gold hover:text-gold",
                  t.stage === (b.status === "quoted" ? "quoted" : b.status === "scheduled" ? "scheduled" : b.status === "done" ? "done" : "new")
                    ? "border-gold text-gold"
                    : "border-border",
                )}
              >
                {t.label}
              </a>
            ))}
          </div>
        </section>

        <section className="card-green rounded-3xl p-5">
          <h2 className="font-display text-xl">Owner notes</h2>
          <OwnerNotes id={b.id} value={b.owner_notes ?? ""} reload={reload} />
        </section>

        <section className="card-green rounded-3xl p-5">
          <h2 className="font-display text-xl">Contact log</h2>
          <LogForm id={b.id} reload={reload} />
          <ol className="mt-4 space-y-2 text-sm">
            {events.length === 0 ? <li className="text-muted">Nothing logged yet.</li> : null}
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="w-5 shrink-0 text-center text-muted">{EVENT_ICON[e.kind] ?? "·"}</span>
                <div className="min-w-0">
                  <p className="whitespace-pre-wrap break-words">{e.body}</p>
                  <p className="text-xs text-muted">
                    {e.kind} · {fmtWhen(e.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StatusRow({ b, reload }: { b: BookingDetail["booking"]; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [date, setDate] = useState(b.preferred_date ?? "");
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Status</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            title={STATUS_HELP[s]}
            onClick={async () => {
              if (s === b.status) return;
              setBusy(true);
              try {
                await updateBookingDetails({ data: { id: b.id, status: s } });
                reload();
              } finally {
                setBusy(false);
              }
            }}
            className={cn(
              "btn-press rounded-full px-3.5 py-1.5 text-xs transition",
              s === b.status ? "bg-fg text-ink" : "border border-border hover:border-gold hover:text-gold",
            )}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-1 text-xs text-muted">{STATUS_HELP[b.status]}</p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs text-muted">
          Service date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(inputCls, "mt-1 w-auto")} />
        </label>
        <button
          type="button"
          className={ghostBtnCls}
          disabled={busy || date === (b.preferred_date ?? "")}
          onClick={async () => {
            setBusy(true);
            try {
              await updateBookingDetails({ data: { id: b.id, preferredDate: date || null } });
              reload();
            } finally {
              setBusy(false);
            }
          }}
        >
          Save date
        </button>
      </div>
    </div>
  );
}

function MoneyPanel({
  b,
  payments,
  billCents,
  owedCents,
  reload,
}: {
  b: BookingDetail["booking"];
  payments: BookingDetail["payments"];
  billCents: number | null;
  owedCents: number | null;
  reload: () => void;
}) {
  const [bill, setBill] = useState(billCents != null ? String(billCents / 100) : "");
  const [amt, setAmt] = useState(owedCents ? String(owedCents / 100) : "");
  const [method, setMethod] = useState<"cash" | "check" | "venmo" | "zelle" | "stripe" | "other">("cash");
  const [paidOn, setPaidOn] = useState(todayLocalISO());
  const [busy, setBusy] = useState(false);

  async function saveBill() {
    const n = Math.round(Number(bill) * 100);
    if (!Number.isFinite(n) || n < 0) return;
    setBusy(true);
    try {
      await updateBookingDetails({ data: { id: b.id, finalCents: n } });
      reload();
    } finally {
      setBusy(false);
    }
  }
  async function record(e: FormEvent) {
    e.preventDefault();
    const n = Math.round(Number(amt) * 100);
    if (!Number.isFinite(n) || n === 0) return;
    setBusy(true);
    try {
      await addPayment({ data: { bookingId: b.id, paidOn, amountCents: n, method } });
      setAmt("");
      reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card-green rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-display text-xl">Money</h2>
        <div className="text-right text-sm">
          <p>
            Paid <b className="tabular-nums">{money(b.paid_cents)}</b>
            {billCents != null ? (
              <>
                {" "}of <b className="tabular-nums">{money(billCents)}</b>
              </>
            ) : null}
          </p>
          {owedCents != null ? (
            <p className={cn("font-display text-2xl tabular-nums", owedCents > 0 ? "text-gold" : "text-sioux")}>
              {owedCents > 0 ? `${money(owedCents)} owed` : "Paid in full"}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-xs text-muted">
          Final bill (what you actually charged — defaults to the high end of the quote)
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted">$</span>
            <input inputMode="decimal" value={bill} onChange={(e) => setBill(e.target.value)} className={inputCls} placeholder={b.estimate_high != null ? String(b.estimate_high) : "0"} />
          </div>
        </label>
        <button type="button" className={ghostBtnCls} disabled={busy} onClick={saveBill}>
          Save bill
        </button>
      </div>

      <form onSubmit={record} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
        <label className="text-xs text-muted">
          Amount received
          <div className="mt-1 flex items-center gap-2">
            <span className="text-muted">$</span>
            <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} className={inputCls} placeholder="0" />
          </div>
        </label>
        <label className="text-xs text-muted">
          How
          <select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className={cn(inputCls, "mt-1")}>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="venmo">Venmo</option>
            <option value="zelle">Zelle</option>
            <option value="stripe">Card (Stripe, by hand)</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="text-xs text-muted">
          Date
          <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <button type="submit" className={btnCls} disabled={busy}>
          Record payment
        </button>
      </form>
      <p className="mt-2 text-xs text-muted">Card payments through the site land here on their own. A negative amount records a refund.</p>

      {!b.balance_paid && (b.estimate_high || b.estimate_low) ? (
        <button
          type="button"
          className={cn(ghostBtnCls, "mt-3")}
          onClick={async () => {
            const res = await startBalanceInvoice({ data: { id: b.id } });
            if (res.ok) window.location.href = res.url;
            else window.alert(res.error);
          }}
        >
          Send a card link for the rest (Stripe)
        </button>
      ) : null}

      {payments.length ? (
        <ul className="mt-4 divide-y divide-border text-sm">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                {fmtDate(p.paid_on)} · {p.kind} · {p.method}
                {p.note ? ` · ${p.note}` : ""}
              </span>
              <span className="flex items-center gap-3 tabular-nums">
                {money(p.amount_cents, { sign: true })}
                {p.method !== "stripe" || p.kind === "payment" ? (
                  <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => void deletePayment({ data: { id: p.id } }).then(reload)}>
                    remove
                  </button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ExpenseQuickAdd({ bookingId, reload }: { bookingId: number; reload: () => void }) {
  const [amt, setAmt] = useState("");
  const [cat, setCat] = useState("dump-fees");
  const [vendor, setVendor] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Math.round(Number(amt) * 100);
        if (!Number.isFinite(n) || n <= 0) return;
        setBusy(true);
        try {
          await addExpense({ data: { spentOn: todayLocalISO(), category: cat, amountCents: n, vendor: vendor || undefined, bookingId, paidWith: "card" } });
          setAmt("");
          setVendor("");
          reload();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="text-xs text-muted">
        Cost $
        <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="dump fee" />
      </label>
      <label className="text-xs text-muted">
        Category
        <select value={cat} onChange={(e) => setCat(e.target.value)} className={cn(inputCls, "mt-1")}>
          {EXPENSE_CATEGORIES.filter((c) => ["dump-fees", "supplies", "other", "fuel"].includes(c.key)).map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-muted">
        Vendor
        <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="GF Landfill" />
      </label>
      <button type="submit" className={ghostBtnCls} disabled={busy}>
        Add cost
      </button>
    </form>
  );
}

/**
 * One job's leg of the day. The route is home → job → drop → next job → drop
 * → … → home, so the owner picks where this leg starts (home, or the drop he
 * just left), where this load goes, and whether it ends at home or rolls on to
 * the next job (no return leg — that job logs its own). Miles recompute from
 * the coordinates as he taps; he can still type the odometer.
 */
function TripQuickAdd({
  bookingId,
  suggested,
  address,
  service,
  job,
  home,
  drops,
  reload,
}: {
  bookingId: number;
  suggested: number | null;
  address: string;
  service: string;
  job: Point | null;
  home: Point;
  drops: DropSite[];
  reload: () => void;
}) {
  const placed = drops.filter((d) => d.lat != null && d.lon != null);
  const defaultDrop = placed.find((d) => d.services.includes(service))?.id ?? (service === "gutter-cleaning" ? "" : placed[0]?.id ?? "");
  const [start, setStart] = useState<string>("home"); // "home" | drop id
  const [dropId, setDropId] = useState<string>(defaultDrop); // "" = no drop
  const [end, setEnd] = useState<"home" | "next">("home");
  const [drivenOn, setDrivenOn] = useState(todayLocalISO());
  const [busy, setBusy] = useState(false);

  const pt = (id: string): Point | null => {
    if (id === "home") return home;
    const d = placed.find((x) => x.id === id);
    return d ? { lat: d.lat!, lon: d.lon! } : null;
  };
  const name = (id: string) => (id === "home" ? "Home" : placed.find((x) => x.id === id)?.label ?? id);
  const drop = dropId ? pt(dropId) : null;
  const computed = job ? routeMiles([pt(start), job, drop, end === "home" ? home : null]) : suggested;
  const [miles, setMiles] = useState(computed != null ? String(computed) : "");
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (!touched) setMiles(computed != null ? String(computed) : "");
  }, [computed, touched]);

  const route = [name(start), "job", dropId ? name(dropId) : null, end === "home" ? "Home" : "next job"].filter(Boolean).join(" → ");
  const chip = (on: boolean) => cn("rounded-full border px-2.5 py-1 text-xs", on ? "border-gold bg-gold/15 text-fg" : "border-border text-muted hover:border-gold");

  return (
    <form
      className="mt-4 border-t border-border pt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Number(miles);
        if (!Number.isFinite(n) || n <= 0) return;
        setBusy(true);
        try {
          await addTrip({
            data: {
              drivenOn,
              miles: n,
              purpose: `Job #${bookingId} · ${route}`,
              fromLabel: name(start),
              toLabel: end === "home" ? `${address} → ${dropId ? name(dropId) + " → " : ""}Home` : `${address}${dropId ? ` → ${name(dropId)}` : ""} (on to next job)`,
              bookingId,
            },
          });
          reload();
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-2 sm:grid-cols-3">
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Start from</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button type="button" className={chip(start === "home")} onClick={() => setStart("home")}>Home</button>
            {placed.map((d) => (
              <button key={d.id} type="button" className={chip(start === d.id)} onClick={() => setStart(d.id)}>{d.label}</button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Load goes to</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button type="button" className={chip(dropId === "")} onClick={() => setDropId("")}>No drop</button>
            {placed.map((d) => (
              <button key={d.id} type="button" className={chip(dropId === d.id)} onClick={() => setDropId(d.id)}>{d.label}</button>
            ))}
            {placed.length === 0 ? <span className="text-[11px] text-muted">Set drop sites in Books › Setup</span> : null}
          </div>
        </div>
        <div>
          <p className="text-[11px] tracking-[0.2em] text-muted uppercase">Then</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <button type="button" className={chip(end === "home")} onClick={() => setEnd("home")}>Home</button>
            <button type="button" className={chip(end === "next")} onClick={() => setEnd("next")}>Next job</button>
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="text-xs text-muted">
          Miles · {route}
          <input
            inputMode="decimal"
            value={miles}
            onChange={(e) => {
              setTouched(true);
              setMiles(e.target.value);
            }}
            className={cn(inputCls, "mt-1")}
            placeholder={job ? "" : "job has no map point — type the odometer"}
          />
        </label>
        <label className="text-xs text-muted">
          Date · {mileageRateFor(drivenOn)}¢/mi
          <input type="date" value={drivenOn} onChange={(e) => setDrivenOn(e.target.value)} className={cn(inputCls, "mt-1")} />
        </label>
        <button type="submit" className={ghostBtnCls} disabled={busy}>
          Log trip
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        {computed != null ? `${computed} mi from the map (straight-line × 1.3)` : "No suggestion"} — edit to the odometer if you have it.
        {end === "next" ? " No return leg: the next job's trip starts from this drop." : ""}
      </p>
    </form>
  );
}

function OwnerNotes({ id, value, reload }: { id: number; value: string; reload: () => void }) {
  const [text, setText] = useState(value);
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className={cn(inputCls, "h-auto py-2")}
        placeholder="Gate code, dog, where the pile is. Customer never sees this."
      />
      <button
        type="button"
        className={cn(ghostBtnCls, "mt-2")}
        disabled={busy || text === value}
        onClick={async () => {
          setBusy(true);
          try {
            await updateBookingDetails({ data: { id, ownerNotes: text } });
            reload();
          } finally {
            setBusy(false);
          }
        }}
      >
        Save notes
      </button>
    </div>
  );
}

function LogForm({ id, reload }: { id: number; reload: () => void }) {
  const [kind, setKind] = useState<"note" | "call" | "text" | "email">("call");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="mt-3 grid gap-2 sm:grid-cols-[auto_1fr_auto] sm:items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!body.trim()) return;
        setBusy(true);
        try {
          await addBookingEvent({ data: { id, kind, body: body.trim() } });
          setBody("");
          reload();
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="text-xs text-muted">
        Type
        <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className={cn(inputCls, "mt-1 w-auto")}>
          <option value="call">Call</option>
          <option value="text">Text</option>
          <option value="email">Email</option>
          <option value="note">Note</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        What happened
        <input value={body} onChange={(e) => setBody(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="Left voicemail · wants Saturday · asked about the couch" />
      </label>
      <button type="submit" className={ghostBtnCls} disabled={busy}>
        Log it
      </button>
    </form>
  );
}
