import type { ReactNode } from "react";
import { formatRange } from "@/lib/pricebook";
import { formatDayLong } from "@/lib/schedule";

/**
 * The job ticket — the site's mahogany print card, as a receipt for one job.
 *
 * Motion: it "prints" (clip-path wipes top to bottom, like paper feeding out
 * of a slot), then the green HELD / DONE stamp lands. Both are CSS in
 * styles.css (.ticket-print, .ticket-stamp) and both switch off entirely
 * under prefers-reduced-motion — the ticket is simply there.
 */
export type TicketJob = {
  id: number;
  serviceLabel: string;
  address?: string | null;
  day: string | null;
  range: { low: number; high: number } | null;
  finalCents?: number | null;
  deposit: number;
  depositPaid: boolean;
  status: string;
  addOns?: string;
};

export function JobTicket({ job, footer, animate = true }: { job: TicketJob; footer?: ReactNode; animate?: boolean }) {
  const stamp =
    job.status === "done"
      ? "Done"
      : job.status === "cancelled"
        ? "Cancelled"
        : job.depositPaid
          ? "Held"
          : job.status === "scheduled"
            ? "Booked"
            : "Pending";
  // A job the owner scheduled without a card deposit (phone, landlord) has
  // no deposit line at all — "$50 not paid" would read as a debt.
  const showDeposit = job.depositPaid || job.status === "hold";
  const bill =
    job.finalCents != null
      ? `$${(job.finalCents / 100).toFixed(job.finalCents % 100 ? 2 : 0)}`
      : job.range
        ? formatRange(job.range)
        : null;
  return (
    <div className={animate ? "ticket-print" : undefined}>
      <div className="ticket relative overflow-hidden rounded-2xl bg-mahogany text-left text-fg shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)]">
        <div className="flex items-baseline justify-between gap-4 border-b border-dashed border-gold/35 px-6 pb-4 pt-5">
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Pick It Up E · Job #{job.id}</p>
          <p className="text-xs uppercase tracking-[0.2em] text-gold/80">{job.serviceLabel}</p>
        </div>
        <div className="px-6 pb-6 pt-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gold/80">The day</p>
          <p className="mt-1 font-display text-3xl leading-tight sm:text-4xl">
            {job.day ? formatDayLong(job.day) : "First open day"}
          </p>
          <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {job.address ? <TicketRow label="Where" value={job.address} /> : null}
            {job.addOns ? <TicketRow label="Also" value={job.addOns} /> : null}
            {bill ? <TicketRow label={job.finalCents != null ? "Final bill" : "Estimate"} value={bill} /> : null}
            {showDeposit ? (
              <TicketRow
                label="Deposit"
                value={job.depositPaid ? `$${job.deposit} paid · comes off the bill` : `$${job.deposit} to hold the day`}
              />
            ) : null}
          </dl>
          {footer ? <div className="mt-5 border-t border-dashed border-gold/35 pt-4">{footer}</div> : null}
        </div>
        <span
          aria-hidden
          className={`${animate ? "ticket-stamp" : ""} pointer-events-none absolute right-5 top-14 rotate-[-9deg] rounded-md border-[3px] px-3 py-1 font-display text-2xl uppercase tracking-[0.12em] ${
            stamp === "Cancelled" ? "border-gold/70 text-gold/80" : "border-sioux text-sioux"
          }`}
          style={{ mixBlendMode: "screen" }}
        >
          {stamp}
        </span>
        <span className="sr-only">Status: {stamp}</span>
      </div>
    </div>
  );
}

function TicketRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.7rem] uppercase tracking-[0.2em] text-gold/80">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}
