import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MessageSquare, Phone } from "lucide-react";
import { listBookings, type BookingRow } from "@/lib/bookings";
import { addBookingEvent, listCustomers, type CustomerRow } from "@/lib/books";
import { smsLink, TEMPLATES, type MessageKind } from "@/lib/messages";
import { cn } from "@/lib/utils";
import { fmtDate, fmtWhen, inputCls, money, OwnerShell, useOwnerLoader } from "@/components/owner-shell";

export const Route = createFileRoute("/jobs_/customers")({ component: CustomersPage });

type Data = { customers: CustomerRow[]; bookings: BookingRow[] };

type Followup = {
  booking: BookingRow;
  why: string;
  template: MessageKind;
  urgency: 0 | 1 | 2;
};

const H = 3600_000;
const D = 24 * H;

/**
 * The queue is derived on the client from the same rows the board uses, so it
 * never disagrees with the board. Each rule is one line of the owner's own
 * discipline: reply inside four hours, confirm the day before, ask for the
 * review two days after.
 */
function buildQueue(rows: BookingRow[], now: number): Followup[] {
  const out: Followup[] = [];
  const today = new Date(now).toISOString().slice(0, 10);
  const tomorrow = new Date(now + D).toISOString().slice(0, 10);
  for (const b of rows) {
    const r = b as BookingRow & { last_contact_at?: string | null; completed_at?: string | null };
    const lastContact = r.last_contact_at ? Date.parse(r.last_contact_at) : null;
    if (b.status === "new") {
      const age = now - Date.parse(b.created_at);
      if (!lastContact) out.push({ booking: b, why: age > 4 * H ? `No reply yet — booked ${fmtWhen(b.created_at)}` : `New lead, ${Math.max(1, Math.round(age / 60000))} min ago`, template: "callback", urgency: age > 4 * H ? 2 : 1 });
    } else if (b.status === "quoted") {
      if (!lastContact || now - lastContact > 2 * D) out.push({ booking: b, why: "Quote out, no YES in 2 days — nudge", template: "quote", urgency: 1 });
    } else if (b.status === "scheduled") {
      if (b.preferred_date === tomorrow || b.preferred_date === today) {
        out.push({ booking: b, why: `On the calendar ${b.preferred_date === today ? "today" : "tomorrow"} — confirm`, template: b.preferred_date === today ? "on-my-way" : "confirm", urgency: 2 });
      }
    } else if (b.status === "done") {
      const doneAt = r.completed_at ? Date.parse(r.completed_at) : null;
      const reviewAsked = lastContact && doneAt ? lastContact > doneAt : false;
      if (doneAt && now - doneAt > 2 * D && !reviewAsked) out.push({ booking: b, why: `Finished ${fmtDate(r.completed_at)} — no review ask logged`, template: "review", urgency: 1 });
    } else if (b.status === "hold") {
      const age = now - Date.parse(b.created_at);
      if (age > D) out.push({ booking: b, why: "Started checkout, never paid the deposit", template: "callback", urgency: 0 });
    }
  }
  return out.sort((a, b) => b.urgency - a.urgency);
}

function CustomersPage() {
  const loader = useCallback(async (): Promise<Data> => {
    const [customers, bookings] = await Promise.all([listCustomers(), listBookings()]);
    return { customers, bookings };
  }, []);
  const { data, forbidden, error, reload } = useOwnerLoader(loader);
  const [q, setQ] = useState("");
  const queue = useMemo(() => (data ? buildQueue(data.bookings, Date.now()) : []), [data]);
  const customers = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = data?.customers ?? [];
    if (!needle) return list;
    return list.filter((c) => [c.name, c.phone, c.address, c.email ?? ""].some((s) => s.toLowerCase().includes(needle)));
  }, [data, q]);

  return (
    <OwnerShell kicker="CUSTOMERS" title="Who to call, who's paid" forbidden={forbidden} wide>
      {error ? <p className="mt-6 text-sm text-gold">{error}</p> : null}
      {!data && !error && !forbidden ? <p className="mt-6 text-muted">Loading…</p> : null}

      {data ? (
        <>
          <section className="mt-6">
            <h2 className="font-display text-2xl">Follow up now</h2>
            <p className="mt-1 text-sm text-muted">Derived from the board: reply within four hours, confirm the day before, ask for the review two days after. Tapping a text logs it and clears the item.</p>
            {queue.length === 0 ? (
              <p className="card-green mt-3 rounded-3xl p-6 text-sm text-muted">Nothing waiting. Go hang cards.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {queue.map((f) => {
                  const t = TEMPLATES.find((x) => x.kind === f.template)!;
                  const b = f.booking;
                  const est = b.estimate_low != null && b.estimate_high != null ? `$${b.estimate_low}–$${b.estimate_high}` : undefined;
                  const body = t.build({ name: b.name, service: b.service.replaceAll("-", " "), estimate: est, date: b.preferred_date ?? undefined, earlyBird: b.early_bird });
                  return (
                    <li key={b.id} className={cn("card-green flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4", f.urgency === 2 && "border border-gold/50")}>
                      <div className="min-w-0">
                        <p className="font-medium">
                          <Link to="/jobs/$id" params={{ id: String(b.id) }} className="hover:text-gold">
                            {b.name}
                          </Link>{" "}
                          <span className="text-sm text-muted">#{b.id} · {b.service.replaceAll("-", " ")}</span>
                        </p>
                        <p className="text-sm text-muted">{f.why}</p>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${b.phone}`}
                          className="btn-press inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-sm hover:border-gold hover:text-gold"
                          onClick={() => void addBookingEvent({ data: { id: b.id, kind: "call", body: `Called ${b.phone}` } }).then(reload).catch(() => {})}
                        >
                          <Phone className="size-3.5" /> Call
                        </a>
                        <a
                          href={smsLink(b.phone, body)}
                          className="btn-press inline-flex h-10 items-center gap-1.5 rounded-full bg-fg px-3.5 text-sm font-medium text-ink hover:bg-gold"
                          onClick={() => void addBookingEvent({ data: { id: b.id, kind: "text", body: `${t.label}: ${body}` } }).then(reload).catch(() => {})}
                        >
                          <MessageSquare className="size-3.5" /> {t.label}
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl">Everyone ({data.customers.length})</h2>
              <input value={q} onChange={(e) => setQ(e.target.value)} className={cn(inputCls, "w-64")} placeholder="Search name, phone, street" aria-label="Search customers" />
            </div>
            <div className="card-green mt-3 overflow-x-auto rounded-3xl p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] tracking-[0.15em] text-muted uppercase">
                    {["Customer", "Address", "Jobs", "Collected", "Last job", "Last contact", "Came from", ""].map((h) => (
                      <th key={h} className="px-3 py-2 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c) => (
                    <tr key={c.phone}>
                      <td className="px-3 py-2">
                        <Link to="/jobs/$id" params={{ id: String(c.lastJobId) }} className="font-medium hover:text-gold">
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted">
                          <a href={`tel:${c.phone}`} className="hover:text-gold">
                            {c.phone}
                          </a>
                          {c.email ? ` · ${c.email}` : ""}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted">{c.address}</td>
                      <td className="px-3 py-2 tabular-nums">{c.jobs}</td>
                      <td className="px-3 py-2 tabular-nums">{money(c.collectedCents)}</td>
                      <td className="px-3 py-2 text-muted">
                        {c.lastStatus}
                        {c.lastDate ? ` · ${fmtDate(c.lastDate)}` : ""}
                      </td>
                      <td className="px-3 py-2 text-muted">{c.lastContactAt ? fmtWhen(c.lastContactAt) : "never"}</td>
                      <td className="px-3 py-2 text-muted">{c.source ?? "—"}</td>
                      <td className="px-3 py-2">
                        <a href={smsLink(c.phone, `Hi ${c.name.split(" ")[0]} — Pick It Up E here. `)} className="text-xs text-gold hover:underline">
                          text
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </OwnerShell>
  );
}
