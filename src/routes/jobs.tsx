import { useCallback, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, MessageSquare, Navigation } from "lucide-react";
import { listBookings, updateBookingStatus, type BookingRow } from "@/lib/bookings";
import { addBookingEvent, getOwnerSummary, type OwnerSummary } from "@/lib/books";
import { smsLink, templatesForStage } from "@/lib/messages";
import { startBalanceInvoice } from "@/lib/pay-actions";
import { formatAddOns, PROMO_CAP, PROMO_PERCENT } from "@/lib/pricebook";
import { cn } from "@/lib/utils";
import { money, OwnerShell, Stat, useOwnerLoader } from "@/components/owner-shell";

export const Route = createFileRoute("/jobs")({ component: JobsPage });

const STATUSES = ["hold", "new", "quoted", "scheduled", "done", "cancelled"] as const;

const URGENCY_LABEL: Record<string, string> = {
  "before-vacuum": "Before city vacuum",
  "this-week": "This week",
  flexible: "Flexible",
};

const SOURCE_LABEL: Record<string, string> = {
  dh: "Door hanger",
  gbp: "Google profile",
  chat: "Phone line",
  call: "Called in",
};

function estimateText(job: BookingRow): string {
  if (job.estimate_low == null || job.estimate_high == null) return "";
  return `$${job.estimate_low}–$${job.estimate_high}`;
}

type BoardData = { rows: BookingRow[]; summary: OwnerSummary };

function JobsPage() {
  const loader = useCallback(async (): Promise<BoardData> => {
    const [rows, summary] = await Promise.all([listBookings(), getOwnerSummary()]);
    return { rows, summary };
  }, []);
  const { data, forbidden, error, setData } = useOwnerLoader(loader);
  const rows = data?.rows ?? null;
  const summary = data?.summary ?? null;

  // Same-day clusters. Two jobs on one date is one drive, not two — this is
  // where a solo truck makes its margin back.
  const clusters = useMemo(() => {
    const byDate = new Map<string, BookingRow[]>();
    for (const r of rows ?? []) {
      if (!r.preferred_date || r.status === "done" || r.status === "cancelled") continue;
      const list = byDate.get(r.preferred_date) ?? [];
      list.push(r);
      byDate.set(r.preferred_date, list);
    }
    return [...byDate.entries()]
      .filter(([, list]) => list.length > 1)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  const setRowStatus = (id: number, status: string) =>
    setData((prev) =>
      prev ? { ...prev, rows: prev.rows.map((r) => (r.id === id ? { ...r, status } : r)) } : prev,
    );

  return (
    <OwnerShell kicker="OWNER BOARD" title="Incoming jobs" forbidden={forbidden}>
      {error ? <p className="mt-6 text-sm text-gold">{error}</p> : null}

      {summary ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Today" value={summary.jobsToday} hint={`${summary.jobsThisWeek} in the next 7 days`} />
          <Stat label="Open leads" value={summary.openLeads} hint={summary.awaitingCard ? `${summary.awaitingCard} awaiting card` : "new + quoted"} tone={summary.needsReply ? "warn" : undefined} />
          <Stat label="Collected YTD" value={money(summary.collectedYtdCents)} hint={`${summary.reservePct}% → tax: ${money(summary.reserveTargetCents)}`} tone="ok" />
          <Stat label="Owed on done jobs" value={money(summary.owedCents)} hint="final bill − payments" tone={summary.owedCents > 0 ? "warn" : undefined} />
          <Stat label="Expenses YTD" value={money(summary.expensesYtdCents)} hint={<Link to="/jobs/books" className="text-gold">Books →</Link>} />
          <Stat label="Miles YTD" value={summary.milesYtd} hint={`${money(summary.mileageDeductionCents)} deduction`} />
        </div>
      ) : null}

      {summary && (summary.needsReply > 0 || summary.needsReview > 0) ? (
        <div className="mt-4 rounded-2xl border border-gold/40 bg-bg-deep/40 p-4 text-sm">
          <p className="text-xs tracking-[0.25em] text-gold">FOLLOW UP</p>
          <ul className="mt-2 space-y-1">
            {summary.needsReply > 0 ? (
              <li>
                <b>{summary.needsReply}</b> new lead{summary.needsReply === 1 ? "" : "s"} with no reply after 4 hours — send the first-reply text.
              </li>
            ) : null}
            {summary.needsReview > 0 ? (
              <li>
                <b>{summary.needsReview}</b> finished job{summary.needsReview === 1 ? "" : "s"} never got the review ask —{" "}
                <Link to="/jobs/customers" className="text-gold">Customers</Link> lists them.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {clusters.length > 0 ? (
        <div className="mt-4 rounded-2xl border border-gold/30 bg-bg-deep/40 p-4">
          <p className="text-xs tracking-[0.25em] text-gold">SAME-DAY CLUSTERS</p>
          <ul className="mt-2 space-y-1 text-sm">
            {clusters.map(([date, list]) => (
              <li key={date}>
                <span className="font-medium">{date}</span>
                <span className="text-muted"> — {list.length} jobs: {list.map((j) => j.name).join(", ")}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted">
            Run these back to back. Offer each of them the neighbor credit to pull one more house onto the same block.
          </p>
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {rows === null && !forbidden && !error ? (
          <p className="text-muted">Loading jobs…</p>
        ) : rows && rows.length === 0 ? (
          <p className="card-green rounded-3xl p-8 text-muted">
            No bookings yet. Share the site and hang the door cards on knobs — never in mailboxes.
          </p>
        ) : (
          (rows ?? []).map((job) => {
            const est = estimateText(job);
            const templates = templatesForStage(job.status);
            const ctx = {
              name: job.name,
              service: job.service.replaceAll("-", " "),
              estimate: est,
              date: job.preferred_date ?? undefined,
              earlyBird: job.early_bird,
            };
            const source = (job as BookingRow & { source?: string | null }).source;
            return (
              <article key={job.id} className="card-green rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl">
                      <Link to="/jobs/$id" params={{ id: String(job.id) }} className="hover:text-gold">
                        {job.name}
                      </Link>
                      <span className="ml-2 text-sm text-muted">#{job.id}</span>
                    </h2>
                    <p className="text-sm text-muted">
                      {job.service.replaceAll("-", " ")}
                      {job.job_size ? ` · ${job.job_size}` : ""}
                      {job.add_ons ? ` · ${formatAddOns(job.add_ons)}` : ""}
                      {source ? ` · via ${SOURCE_LABEL[source] ?? source}` : ""}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <a className="text-gold" href={`tel:${job.phone}`}>
                        {job.phone}
                      </a>
                      <a
                        className="inline-flex items-center gap-1 text-muted hover:text-fg"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <Navigation className="size-3.5" />
                        Directions
                      </a>
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-sm text-muted">
                      <MapPin className="mt-0.5 size-3.5 shrink-0" />
                      {job.address}
                    </p>
                    {job.extra_addresses
                      ? job.extra_addresses.split("\n").map((line) => (
                          <p key={line} className="ml-5 text-sm text-muted">
                            {line}
                          </p>
                        ))
                      : null}
                    {job.preferred_date ? <p className="text-sm">Wanted: {job.preferred_date}</p> : null}
                    {job.notes ? <p className="mt-2 text-sm text-muted">{job.notes}</p> : null}
                    {job.neighbor_of ? (
                      <p className="mt-2 text-sm text-gold">Neighbor of {job.neighbor_of} — block credit both ways</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {est ? <span className="font-display text-2xl">{est}</span> : null}
                    {job.deposit_paid ? (
                      <span className="rounded-full bg-sioux px-3 py-1 text-xs">
                        ${Math.round((job.deposit_cents ?? 5000) / 100)} deposit paid
                      </span>
                    ) : job.status === "hold" ? (
                      <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">Awaiting card</span>
                    ) : null}
                    {job.balance_paid ? (
                      <span className="rounded-full bg-gold px-3 py-1 text-xs text-ink">Balance paid</span>
                    ) : null}
                    {job.early_bird ? (
                      <span className="rounded-full bg-sioux px-3 py-1 text-xs">
                        {Math.round(PROMO_PERCENT * 100)}% off (up to ${PROMO_CAP})
                      </span>
                    ) : null}
                    {job.urgency ? (
                      <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                        {URGENCY_LABEL[job.urgency] ?? job.urgency}
                      </span>
                    ) : null}
                    {job.area_tier && job.area_tier !== "core" ? (
                      <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">{job.area_tier} area</span>
                    ) : null}
                    <select
                      className={cn("h-11 rounded-full border border-border bg-bg-deep px-3 text-sm")}
                      value={job.status}
                      aria-label={`Status for ${job.name}`}
                      onChange={async (e) => {
                        const status = e.target.value as (typeof STATUSES)[number];
                        await updateBookingStatus({ data: { id: job.id, status } });
                        setRowStatus(job.id, status);
                      }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        to="/jobs/$id"
                        params={{ id: String(job.id) }}
                        className="btn-press inline-flex h-11 items-center rounded-full border border-border px-4 text-sm hover:border-gold hover:text-gold"
                      >
                        Open job
                      </Link>
                      {!job.balance_paid && (job.estimate_high || job.estimate_low) ? (
                        <button
                          type="button"
                          className="btn-press h-11 rounded-full bg-fg px-4 text-sm font-medium text-ink hover:bg-gold"
                          onClick={async () => {
                            const res = await startBalanceInvoice({ data: { id: job.id } });
                            if (res.ok) window.location.href = res.url;
                            else window.alert(res.error);
                          }}
                        >
                          Invoice the rest
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>

                {templates.length > 0 ? (
                  <div className="mt-4 border-t border-border pt-3">
                    <p className="flex items-center gap-1.5 text-xs text-muted">
                      <MessageSquare className="size-3.5" />
                      One-tap text — each tap is logged on the job
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {templates.map((t) => (
                        <a
                          key={t.kind}
                          href={smsLink(job.phone, t.build(ctx))}
                          onClick={() => {
                            void addBookingEvent({ data: { id: job.id, kind: "text", body: `${t.label}: ${t.build(ctx)}` } }).catch(() => {});
                          }}
                          className="btn-press rounded-full border border-border px-3.5 py-1.5 text-xs transition hover:border-gold hover:text-gold"
                        >
                          {t.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </OwnerShell>
  );
}
