import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { editTimeEntry, listCrew, recordPay, upsertCrew, type CrewMember, type TimeEntry } from "@/lib/crew";
import { hoursBetween, totals } from "@/lib/crew-math";
import { cn } from "@/lib/utils";
import { btnCls, fmtDate, fmtWhen, ghostBtnCls, inputCls, money, OwnerShell, Stat, todayLocalISO, useOwnerLoader } from "@/components/owner-shell";

export const Route = createFileRoute("/jobs_/crew")({ component: CrewAdminPage });

type Data = Awaited<ReturnType<typeof listCrew>>;

function CrewAdminPage() {
  const loader = useCallback(() => listCrew(), []);
  const { data, forbidden, error, reload } = useOwnerLoader(loader);
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <OwnerShell
      kicker="OWNER · CREW"
      title="Crew"
      forbidden={forbidden}
      aside={
        <Link to="/crew" className={ghostBtnCls}>
          Open the crew view →
        </Link>
      }
    >
      {error ? <p className="text-sm text-gold">{error}</p> : null}
      {msg ? <p className="mt-3 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-2 text-sm">{msg}</p> : null}
      {!data ? <p className="mt-6 text-muted">Loading…</p> : <Body data={data} reload={reload} setMsg={setMsg} />}
    </OwnerShell>
  );
}

function Body({ data, reload, setMsg }: { data: Data; reload: () => void; setMsg: (m: string | null) => void }) {
  const helpers = data.crew.filter((c) => c.wage_cents > 0);
  const unpaid = useMemo(() => {
    let cents = 0;
    let hours = 0;
    for (const c of data.crew) {
      const t = totals(
        data.entries.filter((e) => e.crew_id === c.id && e.ended_at && !e.paid_expense_id),
        c.wage_cents,
      );
      cents += t.cents;
      hours += t.hours;
    }
    return { cents, hours };
  }, [data]);
  const onClock = data.entries.filter((e) => !e.ended_at);

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Stat label="On the clock" value={onClock.length} hint={onClock.map((e) => e.crew_name).join(", ") || "nobody right now"} tone={onClock.length ? "ok" : undefined} />
        <Stat label="Unpaid hours" value={`${unpaid.hours.toFixed(2)} h`} hint={`${money(unpaid.cents)} owed to helpers`} tone={unpaid.cents ? "warn" : undefined} />
        <Stat label="Helpers" value={helpers.filter((c) => c.active).length} hint={helpers.length ? `${money(Math.round(helpers.reduce((s, c) => s + c.wage_cents, 0) / helpers.length))}/h average` : "add one below"} />
      </div>

      <Compliance />

      <section className="mt-8">
        <h2 className="font-display text-2xl">People</h2>
        <p className="mt-1 text-sm text-muted">
          A helper signs in at <code>/login</code> with the email listed here and lands on <code>/crew</code>: today's jobs, directions, one-tap texts, clock in/out, their own hours and pay. Nothing with a dollar sign from the customer side ever reaches that page.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {data.crew.map((c) => (
            <CrewCard key={c.id} member={c} entries={data.entries.filter((e) => e.crew_id === c.id)} reload={reload} setMsg={setMsg} />
          ))}
          <CrewCard member={null} entries={[]} reload={reload} setMsg={setMsg} />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl">Time entries</h2>
        <p className="mt-1 text-sm text-muted">Newest first. Fix a punch, or remove one that was a mistake. Paid rows are locked to the wage expense they were paid under.</p>
        {data.entries.length === 0 ? (
          <p className="card-green mt-4 rounded-3xl p-6 text-muted">No shifts yet. The first clock-in on /crew shows up here.</p>
        ) : (
          <div className="card-green mt-4 overflow-x-auto rounded-3xl">
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-[0.2em] text-muted uppercase">
                <tr>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">In → out</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3">Job</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.entries.map((e) => (
                  <EntryRow key={e.id} e={e} reload={reload} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

/**
 * The first helper turns a sole proprietor's side job into an employer. These
 * are the North Dakota steps, in order, before the first shift — not tax
 * advice, a checklist for the CPA conversation.
 */
function Compliance() {
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6 rounded-3xl border border-gold/40 bg-gold/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          <b>Before a helper's first shift:</b> WSI workers' comp, EIN, W-4 + I-9, ND withholding + new-hire report. Paying cash "under the table" is the one thing here that can sink the LLC.
        </p>
        <button type="button" className="text-xs text-gold hover:underline" onClick={() => setOpen((o) => !o)}>
          {open ? "hide the list" : "show the list"}
        </button>
      </div>
      {open ? (
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">
          <li>
            <b>ND Workforce Safety & Insurance (WSI)</b> — mandatory the day you have one employee, even part-time. Landscaping/hauling class, expect roughly $1–3 per $100 of payroll; the account application is at wsi.nd.gov. Fines and personal liability for an injured helper without it.
          </li>
          <li>
            <b>Federal EIN</b> for the LLC (free, irs.gov, 10 minutes) — payroll can't run on your SSN.
          </li>
          <li>
            <b>Form W-4 and Form I-9</b> from the helper before day one; keep I-9 on file three years.
          </li>
          <li>
            <b>ND income-tax withholding account</b> (ND Taxpayer Access Point) and the <b>new-hire report</b> to ND Child Support within 20 days of hire.
          </li>
          <li>
            <b>Job Service ND unemployment insurance</b> — register once you pay $1,500 in a quarter or have an employee 20 weeks in a year. Two helpers in a busy fall clears the $1,500 line, so plan on it.
          </li>
          <li>
            <b>Payroll itself</b> — for 1–2 helpers a few weeks a year, Gusto Simple (~$40/mo + $6/person, pause it off-season) or the CPA's payroll add-on files the 941s and W-2s. "Record pay" below only books the <i>gross</i> wage to Schedule C line 26; the employer share of FICA (7.65%) shows up on line 23 from the payroll reports.
          </li>
          <li>
            <b>Not a contractor.</b> A helper you schedule, supervise and hand tools to is a W-2 employee, not a 1099. Don't let the CPA talk you into 1099s to save the FICA — ND WSI and the IRS both test control, not the label.
          </li>
        </ol>
      ) : null}
    </section>
  );
}

function CrewCard({ member, entries, reload, setMsg }: { member: CrewMember | null; entries: TimeEntry[]; reload: () => void; setMsg: (m: string | null) => void }) {
  const [editing, setEditing] = useState(member === null);
  const [name, setName] = useState(member?.name ?? "");
  const [email, setEmail] = useState(member?.email ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [wage, setWage] = useState(member ? (member.wage_cents / 100).toFixed(2) : "18.00");
  const [busy, setBusy] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [paidOn, setPaidOn] = useState(todayLocalISO());
  const [paidWith, setPaidWith] = useState<"checking" | "cash" | "check" | "card" | "personal">("checking");

  const unpaidEntries = entries.filter((e) => e.ended_at && !e.paid_expense_id);
  const unpaid = member ? totals(unpaidEntries, member.wage_cents) : { hours: 0, cents: 0 };
  const allTime = member ? totals(entries.filter((e) => e.ended_at), member.wage_cents) : { hours: 0, cents: 0 };
  const isOwnerRow = member !== null && member.wage_cents === 0;

  async function save() {
    setBusy(true);
    try {
      const cents = Math.round(Number(wage) * 100);
      if (!Number.isFinite(cents) || cents < 0) throw new Error("Wage must be a number");
      await upsertCrew({ data: { id: member?.id, email: email.trim().toLowerCase(), name: name.trim(), phone: phone.trim() || undefined, wageCents: cents, active: member?.active ?? true } });
      setMsg(member ? `${name.trim()} updated.` : `${name.trim()} added — they can sign in at /login with ${email.trim().toLowerCase()} and open /crew.`);
      if (!member) {
        setName("");
        setEmail("");
        setPhone("");
        setWage("18.00");
      } else setEditing(false);
      reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <div className={cn("card-green rounded-3xl p-5", member === null && "border border-dashed border-border bg-transparent")}>
        <h3 className="font-display text-xl">{member ? `Edit ${member.name}` : "Add a helper"}</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-muted">
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
          <label className="text-xs text-muted">
            Sign-in email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={cn(inputCls, "mt-1")} placeholder="the Gmail they'll log in with" />
          </label>
          <label className="text-xs text-muted">
            Phone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
          <label className="text-xs text-muted">
            Wage $/hour
            <input inputMode="decimal" value={wage} onChange={(e) => setWage(e.target.value)} className={cn(inputCls, "mt-1")} />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={btnCls} disabled={busy || !name.trim() || !email.trim()} onClick={save}>
            {member ? "Save" : "Add"}
          </button>
          {member ? (
            <button type="button" className={ghostBtnCls} onClick={() => setEditing(false)}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  const m = member as CrewMember;
  return (
    <div className={cn("card-green rounded-3xl p-5", !m.active && "opacity-60")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">
            {m.name}
            {!m.active ? <span className="ml-2 text-xs text-muted">inactive</span> : null}
          </h3>
          <p className="text-sm text-muted">
            {m.email}
            {m.phone ? ` · ${m.phone}` : ""}
          </p>
        </div>
        <p className="font-display text-2xl tabular-nums">{isOwnerRow ? "owner" : `${money(m.wage_cents)}/h`}</p>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-xs text-muted">All time</dt>
          <dd className="tabular-nums">
            {allTime.hours.toFixed(2)} h{isOwnerRow ? "" : ` · ${money(allTime.cents)}`}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Unpaid</dt>
          <dd className={cn("tabular-nums", unpaid.cents > 0 && "text-gold")}>
            {unpaid.hours.toFixed(2)} h{isOwnerRow ? "" : ` · ${money(unpaid.cents)}`}
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <button type="button" className={ghostBtnCls} onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          type="button"
          className={ghostBtnCls}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await upsertCrew({ data: { id: m.id, email: m.email, name: m.name, phone: m.phone ?? undefined, wageCents: m.wage_cents, active: !m.active } });
              reload();
            } finally {
              setBusy(false);
            }
          }}
        >
          {m.active ? "Deactivate" : "Reactivate"}
        </button>
        {!isOwnerRow && unpaid.cents > 0 ? (
          <button type="button" className={btnCls} onClick={() => setPayOpen((o) => !o)}>
            Record pay · {money(unpaid.cents)}
          </button>
        ) : null}
      </div>
      {payOpen ? (
        <div className="mt-3 rounded-2xl border border-border bg-bg-deep/40 p-3">
          <p className="text-sm">
            Books <b>{money(unpaid.cents)}</b> gross for {unpaid.hours.toFixed(2)} h ({unpaidEntries.length} shift{unpaidEntries.length === 1 ? "" : "s"}) as a <b>Wages</b> expense on Schedule C line 26 and marks those shifts paid. Run the actual paycheck through payroll — this is the bookkeeping side only.
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="text-xs text-muted">
              Paid on
              <input type="date" value={paidOn} onChange={(e) => setPaidOn(e.target.value)} className={cn(inputCls, "mt-1")} />
            </label>
            <label className="text-xs text-muted">
              From
              <select value={paidWith} onChange={(e) => setPaidWith(e.target.value as typeof paidWith)} className={cn(inputCls, "mt-1")}>
                <option value="checking">Business checking</option>
                <option value="check">Check</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="personal">Personal (reimburse later)</option>
              </select>
            </label>
            <button
              type="button"
              className={btnCls}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await recordPay({ data: { crewId: m.id, paidOn, paidWith } });
                  setMsg(`Paid ${m.name} ${money(unpaid.cents)} — booked as wages on ${fmtDate(paidOn)}.`);
                  setPayOpen(false);
                  reload();
                } catch (err) {
                  setMsg(err instanceof Error ? err.message : String(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              Book it
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EntryRow({ e, reload }: { e: TimeEntry; reload: () => void }) {
  const [editing, setEditing] = useState(false);
  const [start, setStart] = useState(toLocalInput(e.started_at));
  const [end, setEnd] = useState(toLocalInput(e.ended_at));
  const [note, setNote] = useState(e.note ?? "");
  const [busy, setBusy] = useState(false);
  const locked = Boolean(e.paid_expense_id);

  if (editing) {
    return (
      <tr>
        <td className="px-4 py-2">{e.crew_name}</td>
        <td className="px-4 py-2" colSpan={2}>
          <div className="flex flex-wrap gap-2">
            <input type="datetime-local" value={start} onChange={(ev) => setStart(ev.target.value)} className={inputCls} aria-label="Start" />
            <input type="datetime-local" value={end} onChange={(ev) => setEnd(ev.target.value)} className={inputCls} aria-label="End" />
          </div>
        </td>
        <td className="px-4 py-2 text-right tabular-nums">{start && end ? hoursBetween(new Date(start).toISOString(), new Date(end).toISOString()).toFixed(2) : "…"}</td>
        <td className="px-4 py-2">{e.customer ?? "—"}</td>
        <td className="px-4 py-2">
          <input value={note} onChange={(ev) => setNote(ev.target.value)} className={inputCls} aria-label="Note" />
        </td>
        <td className="px-4 py-2 text-right whitespace-nowrap">
          <button
            type="button"
            className="text-xs text-gold hover:underline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await editTimeEntry({
                  data: {
                    id: e.id,
                    startedAt: start ? new Date(start).toISOString() : undefined,
                    endedAt: end ? new Date(end).toISOString() : null,
                    note: note || null,
                  },
                });
                setEditing(false);
                reload();
              } finally {
                setBusy(false);
              }
            }}
          >
            save
          </button>
          <button type="button" className="ml-3 text-xs text-muted hover:text-gold" onClick={() => setEditing(false)}>
            cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-2">{e.crew_name}</td>
      <td className="px-4 py-2 whitespace-nowrap">{fmtDate(e.started_at.slice(0, 10))}</td>
      <td className="px-4 py-2 whitespace-nowrap">
        {fmtWhen(e.started_at).split(", ").pop()} → {e.ended_at ? fmtWhen(e.ended_at).split(", ").pop() : <span className="text-sioux">on the clock</span>}
      </td>
      <td className="px-4 py-2 text-right tabular-nums">{hoursBetween(e.started_at, e.ended_at).toFixed(2)}</td>
      <td className="px-4 py-2">{e.booking_id ? <Link to="/jobs/$id" params={{ id: String(e.booking_id) }} className="hover:text-gold">{e.customer ?? `#${e.booking_id}`}</Link> : "—"}</td>
      <td className="px-4 py-2 text-muted">{e.note ?? ""}</td>
      <td className="px-4 py-2 text-right whitespace-nowrap">
        {locked ? (
          <span className="text-xs text-sioux">paid</span>
        ) : (
          <>
            <button type="button" className="text-xs text-muted hover:text-gold" onClick={() => setEditing(true)}>
              fix
            </button>
            <button
              type="button"
              className="ml-3 text-xs text-muted hover:text-gold"
              disabled={busy}
              onClick={async () => {
                if (!confirm(`Remove this ${hoursBetween(e.started_at, e.ended_at).toFixed(2)} h entry for ${e.crew_name}?`)) return;
                setBusy(true);
                try {
                  await editTimeEntry({ data: { id: e.id, remove: true } });
                  reload();
                } finally {
                  setBusy(false);
                }
              }}
            >
              remove
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
