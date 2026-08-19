import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import {
  listBookings,
  updateBookingStatus,
  type BookingRow,
} from "@/lib/bookings";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs")({ component: JobsPage });

const STATUSES = ["new", "quoted", "scheduled", "done", "cancelled"] as const;

function JobsPage() {
  const { user, isPending } = useCurrentUserState();
  const [rows, setRows] = useState<BookingRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    listBookings()
      .then(setRows)
      .catch(() => setRows([]));
  }, [user]);

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

        <div className="mt-8 space-y-4">
          {rows === null ? (
            <p className="text-muted">Loading jobs…</p>
          ) : rows.length === 0 ? (
            <p className="card-green rounded-3xl p-8 text-muted">
              No bookings yet. Share the site and hang the door cards on knobs —
              never in mailboxes.
            </p>
          ) : (
            rows.map((job) => (
              <article key={job.id} className="card-green rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-2xl">{job.name}</h2>
                    <p className="text-sm text-muted">
                      {job.service.replaceAll("-", " ")} · {job.address}
                    </p>
                    <a className="text-gold" href={`tel:${job.phone}`}>
                      {job.phone}
                    </a>
                    {job.preferred_date ? (
                      <p className="text-sm">Wanted: {job.preferred_date}</p>
                    ) : null}
                    {job.notes ? (
                      <p className="mt-2 text-sm text-muted">{job.notes}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {job.early_bird ? (
                      <span className="rounded-full bg-sioux px-3 py-1 text-xs">
                        $50 off
                      </span>
                    ) : null}
                    <select
                      className={cn(
                        "h-11 rounded-full border border-border bg-bg-deep px-3 text-sm",
                      )}
                      value={job.status}
                      onChange={async (e) => {
                        const status = e.target.value as (typeof STATUSES)[number];
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
              </article>
            ))
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
