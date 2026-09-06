import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  claimByPhone,
  completeByPhone,
  completeMyBooking,
  listMyBookings,
  lookupByPhone,
  type BookingRow,
} from "@/lib/bookings";
import { formatPhone, isUsPhone } from "@/lib/phone";
import { formatRange } from "@/lib/pricebook";
import { readLastBooking } from "@/lib/returning";
import { formatDayLong } from "@/lib/schedule";

export const Route = createFileRoute("/status")({ component: StatusPage });

const SERVICE_LABEL: Record<string, string> = {
  "leaf-cleanup": "Fall leaf & yard cleanup",
  "junk-removal": "Junk & furniture",
  "furniture-appliances": "Junk & furniture",
  "gutter-cleaning": "Gutter cleaning",
};

function StatusPage() {
  const { user, isPending } = useCurrentUserState();
  const [phone, setPhone] = useState("");
  const [jobs, setJobs] = useState<BookingRow[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const last = readLastBooking();
    if (last?.phone) setPhone(last.phone);
  }, []);

  useEffect(() => {
    if (isPending) return;
    if (!user) return;
    const last = readLastBooking();
    setBusy(true);
    const run = async () => {
      if (last?.phone) {
        await claimByPhone({ data: { phone: last.phone } }).catch(() => null);
      }
      const rows = await listMyBookings().catch(() => [] as BookingRow[]);
      setJobs(rows);
      setBusy(false);
    };
    void run();
  }, [user, isPending]);

  async function onPhone(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isUsPhone(phone)) {
      setError("Use the 10-digit phone you booked with.");
      return;
    }
    setBusy(true);
    const rows = await lookupByPhone({ data: { phone } }).catch(() => []);
    setBusy(false);
    setJobs(rows);
    if (!rows.length) setError("Nothing on file for that phone. Try the number on the booking.");
  }

  async function hauled(job: BookingRow) {
    setBusy(true);
    const done = user
      ? await completeMyBooking({ data: { id: job.id } }).catch(() => null)
      : await completeByPhone({ data: { id: job.id, phone } }).catch(() => null);
    setBusy(false);
    if (!done) {
      setError("Couldn't mark it hauled. Call the shop line if you need a hand.");
      return;
    }
    setJobs((cur) => (cur ?? []).map((j) => (j.id === done.id ? done : j)));
  }

  return (
    <div className="relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-lg px-4 py-12">
        <p className="kicker">Your hauls</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          {user ? "What's on your list." : "Look up with your phone."}
        </h1>
        <p className="mt-3 text-base text-muted">
          {user
            ? "Jobs you book while signed in land here. Shop line and the form share this list."
            : "Type the phone number you used when you booked. That's all we need."}
        </p>

        {isPending ? (
          <div className="mt-8 h-36 animate-pulse rounded-2xl bg-fg/8" />
        ) : user ? null : (
          <>
            <form className="mt-8 grid gap-3" onSubmit={onPhone}>
              <label className="text-sm font-medium text-muted" htmlFor="lookup-phone">
                Phone number
                <input
                  id="lookup-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(701) 555-0100"
                  className="field mt-1 h-14 text-lg"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="btn-press h-14 rounded-full bg-fg text-base font-medium text-ink hover:bg-gold disabled:opacity-60"
              >
                {busy ? "Looking…" : "Find my hauls"}
              </button>
            </form>
            <p className="mt-4 text-sm text-muted">
              Want them saved next time?{" "}
              <Link to="/login" className="text-gold hover:underline">
                Make an account
              </Link>
              — optional.
            </p>
          </>
        )}

        {error ? <p className="mt-4 text-sm text-gold">{error}</p> : null}

        {jobs && jobs.length > 0 ? (
          <ul className="mt-8 grid gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} busy={busy} onHauled={() => hauled(job)} />
            ))}
          </ul>
        ) : null}

        {jobs && jobs.length === 0 && user ? (
          <p className="mt-8 text-sm text-muted">
            Nothing saved yet.{" "}
            <Link to="/call" className="text-gold hover:underline">
              Book on the shop line
            </Link>{" "}
            and it will show up here.
          </p>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function JobCard({
  job,
  busy,
  onHauled,
}: {
  job: BookingRow;
  busy: boolean;
  onHauled: () => void;
}) {
  const day = (job.preferred_date || "").slice(0, 10);
  const dayLabel = /^\d{4}-\d{2}-\d{2}$/.test(day) ? formatDayLong(day) : job.preferred_date || "Day TBD";
  const range =
    job.estimate_low != null && job.estimate_high != null
      ? formatRange({ low: job.estimate_low, high: job.estimate_high })
      : null;
  return (
    <li className="card-green rounded-2xl p-5">
      <p className="font-display text-2xl text-gold">{dayLabel}</p>
      <p className="mt-1 text-sm">
        {SERVICE_LABEL[job.service] ?? job.service}
        {job.job_size ? ` · ${job.job_size}` : ""}
      </p>
      <p className="mt-1 text-sm text-muted">
        {job.status === "done" ? "Hauled" : "On the truck"}
        {job.phone ? ` · ${formatPhone(job.phone)}` : ""}
        {range ? ` · ${range}` : ""}
        {` · #${job.id}`}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to="/call"
          search={{ service: job.service, size: job.job_size || undefined }}
          className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-5 text-sm font-medium text-ink hover:bg-gold"
        >
          Book again
        </Link>
        {job.status !== "done" && job.status !== "cancelled" ? (
          <button
            type="button"
            disabled={busy}
            onClick={onHauled}
            className="btn-press h-12 rounded-full border border-border px-5 text-sm text-fg hover:bg-fg/8 disabled:opacity-60"
          >
            Mark hauled
          </button>
        ) : null}
      </div>
    </li>
  );
}
