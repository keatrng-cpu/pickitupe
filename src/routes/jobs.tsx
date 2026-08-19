import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, MessageSquare, Navigation } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  listBookings,
  updateBookingStatus,
  type BookingRow,
} from "@/lib/bookings";
import { smsLink, templatesForStage } from "@/lib/messages";
import { PROMO_CAP, PROMO_PERCENT } from "@/lib/pricebook";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs")({ component: JobsPage });

const STATUSES = ["new", "quoted", "scheduled", "done", "cancelled"] as const;

const URGENCY_LABEL: Record<string, string> = {
  "before-vacuum": "Before city vacuum",
  "this-week": "This week",
  flexible: "Flexible",
};

function estimateText(job: BookingRow): string {
  if (job.estimate_low == null || job.estimate_high == null) return "";
  return `$${job.estimate_low}–$${job.estimate_high}`;
}

function JobsPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listBookings()
      .then(setRows)
      .catch(() => setRows([]));
  }, [user]);

  // Same-day clusters. Two jobs on one date is one drive, not two — this is
  // where a solo truck makes its margin back.
  const clusters = useMemo(() => {
    const byDate = new Map<string, BookingRow[]>();
    for (const r of rows ?? []) {
      if (!r.preferred_date || r.status === "done" || r.status === "cancelled")
        continue;
      const list = byDate.get(r.preferred_date) ?? [];
      list.push(r);
      byDate.set(r.preferred_date, list);
    }
    return [...byDate.entries()]
      .filter(([, list]) => list.length > 1)
      .sort(([a], [b]) => a.localeCompare(b));
  }, [rows]);

  if (isPending) {
    return (
      <div className="min-h-screen bg-bg">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading…</div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="min-h-screen bg-bg">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <p className="text-xs tracking-[0.28em] text-gold">OWNER BOARD</p>
        <h1 className="mt-2 font-display text-4xl">Incoming jobs</h1>
        <p className="mt-2 text-sm text-muted">
          Signed in as {user.displayName}.{" "}
          <Link to="/" className="text-gold">
            Site
          </Link>
        </p>

        {clusters.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-gold/30 bg-bg-deep/40 p-4">
            <p className="text-xs tracking-[0.25em] text-gold">
              SAME-DAY CLUSTERS
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {clusters.map(([date, list]) => (
                <li key={date}>
                  <span className="font-medium">{date}</span>
                  <span className="text-muted">
                    {" "}
                    — {list.length} jobs: {list.map((j) => j.name).join(", ")}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Run these back to back. Offer each of them the $25 neighbor credit
              to pull one more house onto the same block.
            </p>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {rows === null ? (
            <p className="text-muted">Loading jobs…</p>
          ) : rows.length === 0 ? (
            <p className="card-green rounded-3xl p-8 text-muted">
              No bookings yet. Share the site and hang the door cards on knobs —
              never in mailboxes.
            </p>
          ) : (
            rows.map((job) => {
              const est = estimateText(job);
              const templates = templatesForStage(job.status);
              const ctx = {
                name: job.name,
                service: job.service.replaceAll("-", " "),
                estimate: est,
                date: job.preferred_date ?? undefined,
                earlyBird: job.early_bird,
              };
              return (
                <article key={job.id} className="card-green rounded-3xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-display text-2xl">{job.name}</h2>
                      <p className="text-sm text-muted">
                        {job.service.replaceAll("-", " ")}
                        {job.job_size ? ` · ${job.job_size}` : ""}
                        {job.add_ons ? ` · ${job.add_ons.replaceAll(",", ", ")}` : ""}
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
                      {job.preferred_date ? (
                        <p className="text-sm">Wanted: {job.preferred_date}</p>
                      ) : null}
                      {job.notes ? (
                        <p className="mt-2 text-sm text-muted">{job.notes}</p>
                      ) : null}
                      {job.neighbor_of ? (
                        <p className="mt-2 text-sm text-gold">
                          Neighbor of {job.neighbor_of} — $25 credit both ways
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {est ? (
                        <span className="font-display text-2xl">{est}</span>
                      ) : null}
                      {job.early_bird ? (
                        <span className="rounded-full bg-sioux px-3 py-1 text-xs">
                          {Math.round(PROMO_PERCENT * 100)}% off (up to $
                          {PROMO_CAP})
                        </span>
                      ) : null}
                      {job.urgency ? (
                        <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">
                          {URGENCY_LABEL[job.urgency] ?? job.urgency}
                        </span>
                      ) : null}
                      {job.area_tier && job.area_tier !== "core" ? (
                        <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">
                          {job.area_tier} area
                        </span>
                      ) : null}
                      <select
                        className={cn(
                          "h-11 rounded-full border border-border bg-bg-deep px-3 text-sm",
                        )}
                        value={job.status}
                        onChange={async (e) => {
                          const status = e.target
                            .value as (typeof STATUSES)[number];
                          await updateBookingStatus({
                            data: { id: job.id, status },
                          });
                          setRows(
                            (prev) =>
                              prev?.map((r) =>
                                r.id === job.id ? { ...r, status } : r,
                              ) ?? null,
                          );
                        }}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {templates.length > 0 ? (
                    <div className="mt-4 border-t border-border pt-3">
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <MessageSquare className="size-3.5" />
                        One-tap text
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {templates.map((t) => (
                          <a
                            key={t.kind}
                            href={smsLink(job.phone, t.build(ctx))}
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
      </main>
      <SiteFooter />
    </div>
  );
}
