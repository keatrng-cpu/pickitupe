import { useCallback, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, MessageSquare, Navigation, Phone } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { clockIn, clockOut, crewLogContact, crewMarkDone, getCrewHome, type CrewHome, type CrewJob } from "@/lib/crew";
import { hoursBetween } from "@/lib/crew-math";
import { smsLink } from "@/lib/messages";
import { formatAddOns } from "@/lib/pricebook";
import { formatDayLong } from "@/lib/schedule";
import { cn } from "@/lib/utils";
import { btnCls, fmtDate, fmtWhen, ghostBtnCls, inputCls, money } from "@/components/owner-shell";

export const Route = createFileRoute("/crew")({ component: CrewPage });

const URGENCY_LABEL: Record<string, string> = { "before-vacuum": "Before city vacuum", "this-week": "This week", flexible: "Flexible" };

/**
 * Texts a crew member may send. Same voice as the owner templates, no money in
 * any of them — the number on the job is the owner's to quote.
 */
const CREW_TEXTS: { kind: string; label: string; build: (first: string) => string }[] = [
  { kind: "on-my-way", label: "On my way", build: (f) => `Heading your way now, ${f} — about 20 minutes out. — Pick It Up E` },
  { kind: "late", label: "Running 15 late", build: (f) => `${f}, running about 15 minutes behind — still coming today. — Pick It Up E` },
  { kind: "here", label: "We're here", build: (f) => `We're at the house now, ${f}. No need to come out — we'll text when it's done. — Pick It Up E` },
  { kind: "done", label: "Job done", build: (f) => `All done, ${f} — yard's clear and the load is gone. Keaton will follow up with the invoice. — Pick It Up E` },
];

/**
 * Three states, not two: `undefined` = still loading, `null` = signed in but not
 * on the crew list (getCrewHome returns null), object = home. useOwnerLoader
 * uses null for "loading", so it can't tell those apart — hence a local hook.
 */
function useCrewHome(enabled: boolean) {
  const [data, setData] = useState<CrewHome | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    getCrewHome()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => {
        if (alive) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      alive = false;
    };
  }, [enabled, tick]);
  return { data, error, reload };
}

function CrewPage() {
  const { user, isPending } = useCurrentUserState();
  const { data, error, reload } = useCrewHome(Boolean(user));

  if (isPending) {
    return (
      <div className="relative z-10 min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 text-muted">Loading…</div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10">
        {error ? <p className="text-sm text-gold">{error}</p> : null}
        {data === undefined && !error ? (
          <>
            <p className="text-xs tracking-[0.28em] text-gold">CREW</p>
            <h1 className="mt-2 font-display text-4xl">Loading…</h1>
          </>
        ) : data === null ? (
          <NotCrew email={user.primaryEmail} />
        ) : data ? (
          <Home data={data} reload={reload} />
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

function NotCrew({ email }: { email: string | null }) {
  return (
    <div className="card-green rounded-3xl p-8">
      <p className="text-xs tracking-[0.28em] text-gold">CREW</p>
      <h1 className="mt-2 font-display text-3xl">This login isn't on the crew list</h1>
      <p className="mt-3 text-muted">
        You're signed in as <span className="text-fg">{email}</span>. Ask Keaton to add that email under Crew on the owner board, then reload.
      </p>
    </div>
  );
}

function Home({ data, reload }: { data: CrewHome; reload: () => void }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!data.open) return;
    const t = setInterval(() => setTick((x) => x + 1), 30_000);
    return () => clearInterval(t);
  }, [data.open]);
  void tick;
  const openHours = data.open ? hoursBetween(data.open.started_at, null) : 0;
  const byDay = new Map<string, CrewJob[]>();
  for (const j of data.jobs) {
    const k = j.preferred_date ?? "unscheduled";
    byDay.set(k, [...(byDay.get(k) ?? []), j]);
  }
  const days = [...byDay.entries()].sort(([a], [b]) => (a === "unscheduled" ? 1 : b === "unscheduled" ? -1 : a.localeCompare(b)));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.28em] text-gold">CREW</p>
          <h1 className="mt-2 font-display text-4xl">{data.me.name}</h1>
        </div>
        {data.me.isOwner ? (
          <Link to="/jobs" className={ghostBtnCls}>
            Owner board →
          </Link>
        ) : null}
      </div>

      {/* Clock */}
      <section className="card-green mt-6 rounded-3xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs tracking-[0.25em] text-gold">
              <Clock className="size-3.5" /> {data.open ? "ON THE CLOCK" : "OFF THE CLOCK"}
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums">
              {data.open ? `${openHours.toFixed(2)} h` : `${data.week.hours.toFixed(2)} h this week`}
            </p>
            <p className="text-sm text-muted">
              {data.open
                ? `since ${fmtWhen(data.open.started_at)}${data.open.customer ? ` · ${data.open.customer}` : ""}`
                : data.me.wageCents > 0
                  ? `${money(data.week.cents)} earned Mon–Sun · ${money(data.unpaid.cents)} unpaid so far`
                  : "your hours, tracked for the job record"}
            </p>
          </div>
          <ClockButtons open={Boolean(data.open)} reload={reload} />
        </div>
        {data.week.entries.length ? (
          <ul className="mt-4 divide-y divide-border text-sm">
            {data.week.entries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  {fmtDate(e.started_at.slice(0, 10))} · {fmtWhen(e.started_at).split(", ")[1]} → {e.ended_at ? fmtWhen(e.ended_at).split(", ")[1] : "…"}
                  {e.customer ? ` · ${e.customer}` : ""}
                  {e.note ? <span className="text-muted"> · {e.note}</span> : null}
                </span>
                <span className="tabular-nums">
                  {hoursBetween(e.started_at, e.ended_at).toFixed(2)} h{e.paid_expense_id ? <span className="ml-2 text-xs text-sioux">paid</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Jobs */}
      <h2 className="mt-10 font-display text-2xl">Jobs</h2>
      <p className="mt-1 text-sm text-muted">Everything on the calendar from yesterday forward. Tap the address for directions; texts open in Messages and are logged on the job.</p>
      {days.length === 0 ? <p className="card-green mt-4 rounded-3xl p-6 text-muted">Nothing scheduled yet.</p> : null}
      {days.map(([day, jobs]) => (
        <section key={day} className="mt-5">
          <p className={cn("text-xs tracking-[0.25em]", day === data.today ? "text-sioux" : "text-gold")}>
            {day === "unscheduled" ? "NO DATE YET" : day === data.today ? `TODAY · ${formatDayLong(day)}` : formatDayLong(day).toUpperCase()}
          </p>
          <div className="mt-2 space-y-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} reload={reload} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}

function ClockButtons({ open, reload }: { open: boolean; reload: () => void }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-wrap items-end gap-2">
      {open ? (
        <>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note (optional)" className={cn(inputCls, "w-48")} aria-label="Shift note" />
          <button
            type="button"
            className={btnCls}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await clockOut({ data: { note: note || undefined } });
                setNote("");
                reload();
              } finally {
                setBusy(false);
              }
            }}
          >
            Clock out
          </button>
        </>
      ) : (
        <button
          type="button"
          className={btnCls}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await clockIn({ data: {} });
              reload();
            } finally {
              setBusy(false);
            }
          }}
        >
          Clock in
        </button>
      )}
    </div>
  );
}

function JobCard({ job, reload }: { job: CrewJob; reload: () => void }) {
  const first = (job.name || "there").trim().split(/\s+/)[0];
  const [busy, setBusy] = useState(false);
  const log = (kind: "call" | "text" | "note", body: string) => void crewLogContact({ data: { bookingId: job.id, kind, body } }).then(reload).catch(() => {});
  return (
    <article className="card-green rounded-3xl p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-2xl">{job.name}</h3>
          <p className="text-sm text-muted">
            {job.service.replaceAll("-", " ")}
            {job.job_size ? ` · ${job.job_size}` : ""}
            {job.add_ons ? ` · ${formatAddOns(job.add_ons)}` : ""}
            {job.households && job.households > 1 ? ` · block of ${job.households}` : ""}
          </p>
          <a
            className="mt-2 flex items-start gap-1 text-sm hover:text-gold"
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.address)}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            <MapPin className="mt-0.5 size-3.5 shrink-0" /> {job.address}
            <Navigation className="ml-1 mt-0.5 size-3.5 shrink-0 text-gold" />
          </a>
          {job.extra_addresses
            ? job.extra_addresses.split("\n").map((l) => (
                <p key={l} className="ml-5 text-sm text-muted">
                  {l}
                </p>
              ))
            : null}
          {job.notes ? <p className="mt-2 rounded-xl bg-bg-deep/50 p-2 text-sm">{job.notes}</p> : null}
          {job.neighbor_of ? <p className="mt-1 text-sm text-gold">Neighbor of {job.neighbor_of} — same trip</p> : null}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{job.status}</span>
          {job.urgency ? <span className="rounded-full border border-border px-3 py-1 text-xs text-muted">{URGENCY_LABEL[job.urgency] ?? job.urgency}</span> : null}
          {job.area_tier && job.area_tier !== "core" ? <span className="rounded-full border border-gold/40 px-3 py-1 text-xs text-gold">{job.area_tier} area</span> : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
        <a href={`tel:${job.phone}`} onClick={() => log("call", `Called ${job.phone}`)} className={cn(ghostBtnCls, "h-10 gap-1.5 text-xs")}>
          <Phone className="size-3.5" /> Call
        </a>
        {CREW_TEXTS.map((t) => (
          <a
            key={t.kind}
            href={smsLink(job.phone, t.build(first))}
            onClick={() => log("text", `${t.label}: ${t.build(first)}`)}
            className="btn-press inline-flex h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs transition hover:border-gold hover:text-gold"
          >
            <MessageSquare className="size-3.5" /> {t.label}
          </a>
        ))}
        {job.status !== "done" ? (
          <button
            type="button"
            disabled={busy}
            className="btn-press inline-flex h-10 items-center rounded-full bg-fg px-3.5 text-xs font-medium text-ink hover:bg-gold disabled:opacity-50"
            onClick={async () => {
              setBusy(true);
              try {
                await crewMarkDone({ data: { bookingId: job.id } });
                reload();
              } finally {
                setBusy(false);
              }
            }}
          >
            Mark finished
          </button>
        ) : null}
      </div>
    </article>
  );
}
