import { useCallback, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, EyeOff, MessageSquare, Phone, RotateCcw, Star } from "lucide-react";
import { getCareBoard, HIDE_REASONS, moderateReview, resolveTicket } from "@/lib/care";
import { fmtWhen, OwnerShell, useOwnerLoader } from "@/components/owner-shell";
import { cn } from "@/lib/utils";

/**
 * /jobs/care — everything a customer asked for, in one list: tickets from the
 * AI concierge, change/cancel requests from job pages, low-star reviews; plus
 * every review waiting to be published.
 *
 * Review moderation is content-only by design (HIDE_REASONS). A 2-star review
 * gets published and answered, not buried — that's the law (16 CFR 465) and
 * it's also what makes the 5-star ones believable.
 */
export const Route = createFileRoute("/jobs_/care")({ component: CarePage });

type Board = Awaited<ReturnType<typeof getCareBoard>>;

const KIND: Record<string, string> = {
  reschedule: "Different day",
  cancel: "Cancel",
  change: "Change the job",
  complaint: "Not happy",
  question: "Question",
  praise: "Kind words",
  other: "Needs you",
};

function CarePage() {
  const loader = useCallback(() => getCareBoard(), []);
  const { data, forbidden, error, reload } = useOwnerLoader<Board>(loader);
  const open = data?.tickets.filter((t) => t.status === "open") ?? [];
  const closed = data?.tickets.filter((t) => t.status !== "open") ?? [];
  const pending = data?.reviews.filter((r) => r.status === "pending") ?? [];
  const rest = data?.reviews.filter((r) => r.status !== "pending") ?? [];

  return (
    <OwnerShell
      kicker="CUSTOMER CARE"
      title={open.length ? `${open.length} waiting on you` : "Nobody's waiting."}
      forbidden={forbidden}
      wide
    >
      {error ? <p className="mt-6 text-sm text-gold">{error}</p> : null}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <h2 className="font-display text-2xl">Tickets</h2>
          <p className="mt-1 text-sm text-muted">
            From the AI assistant, job pages, and low-star reviews. Each one also texted/emailed you when it came in.
          </p>
          <ul className="mt-5 grid gap-3">
            {open.map((t) => (
              <TicketCard key={t.id} t={t} onDone={reload} />
            ))}
            {!open.length ? <li className="text-sm text-muted">Nothing open.</li> : null}
          </ul>
          {closed.length ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted">Resolved in the last 14 days ({closed.length})</summary>
              <ul className="mt-3 grid gap-3">
                {closed.map((t) => (
                  <TicketCard key={t.id} t={t} onDone={reload} />
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section>
          <h2 className="font-display text-2xl">Reviews</h2>
          <p className="mt-1 text-sm text-muted">
            Publish every rating. Hide only for a content reason. Answer the rough ones — a calm reply sells more than a
            5-star.
          </p>
          <ul className="mt-5 grid gap-3">
            {pending.map((r) => (
              <ReviewCard key={r.id} r={r} onDone={reload} />
            ))}
            {!pending.length ? <li className="text-sm text-muted">No reviews waiting.</li> : null}
          </ul>
          {rest.length ? (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted">Published & hidden ({rest.length})</summary>
              <ul className="mt-3 grid gap-3">
                {rest.map((r) => (
                  <ReviewCard key={r.id} r={r} onDone={reload} />
                ))}
              </ul>
            </details>
          ) : null}
          <p className="mt-6 text-sm">
            <Link to="/reviews" className="text-gold underline underline-offset-4">
              See the public reviews page
            </Link>
          </p>
        </section>
      </div>
    </OwnerShell>
  );
}

function TicketCard({ t, onDone }: { t: Board["tickets"][number]; onDone: () => void }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const isOpen = t.status === "open";
  async function act(reopen = false) {
    setBusy(true);
    await resolveTicket({ data: { id: t.id, note: note || undefined, reopen } }).catch(() => null);
    setBusy(false);
    onDone();
  }
  const digits = (t.phone || "").replace(/\D/g, "");
  return (
    <li
      className={cn(
        "card-green rounded-2xl p-4",
        isOpen && t.urgency === "high" && "ring-1 ring-gold/70",
        !isOpen && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.14em]">
        {t.urgency === "high" && isOpen ? <AlertTriangle className="size-4 text-gold" aria-label="Urgent" /> : null}
        <span className="text-gold">{KIND[t.kind] ?? t.kind}</span>
        <span className="text-muted">· #{t.id} · {t.channel} · {fmtWhen(t.created_at)}</span>
        {t.booking_id ? (
          <Link to="/jobs/$id" params={{ id: String(t.booking_id) }} className="text-fg underline underline-offset-4">
            Job #{t.booking_id}
          </Link>
        ) : null}
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6">{t.summary}</p>
      <p className="mt-2 text-xs text-muted">{[t.name, t.phone, t.email].filter(Boolean).join(" · ") || "No contact"}</p>
      {t.owner_note ? <p className="mt-2 text-xs text-fg/80">Your note: {t.owner_note}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {digits.length >= 10 ? (
          <>
            <a href={`sms:${digits}`} className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:border-gold">
              <MessageSquare className="size-3.5" aria-hidden /> Text
            </a>
            <a href={`tel:${digits}`} className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:border-gold">
              <Phone className="size-3.5" aria-hidden /> Call
            </a>
          </>
        ) : null}
        {t.email ? (
          <a href={`mailto:${t.email}`} className="btn-press inline-flex h-9 items-center rounded-full border border-border px-3 text-xs hover:border-gold">
            Email
          </a>
        ) : null}
        {isOpen ? (
          <>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you did (optional)"
              className="field h-9 min-w-40 flex-1 py-1 text-xs"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => act(false)}
              className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-3 text-xs font-medium text-ink hover:bg-gold disabled:opacity-50"
            >
              <Check className="size-3.5" aria-hidden /> Resolved
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => act(true)}
            className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:border-gold"
          >
            <RotateCcw className="size-3.5" aria-hidden /> Reopen
          </button>
        )}
      </div>
    </li>
  );
}

function ReviewCard({ r, onDone }: { r: Board["reviews"][number]; onDone: () => void }) {
  const [reply, setReply] = useState(r.owner_reply ?? "");
  const [reason, setReason] = useState<(typeof HIDE_REASONS)[number] | "">("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function act(action: "publish" | "hide" | "reply") {
    setBusy(true);
    setMsg("");
    const res = await moderateReview({
      data: { id: r.id, action, reason: action === "hide" && reason ? reason : undefined, reply: action === "reply" ? reply : undefined },
    }).catch(() => null);
    setBusy(false);
    if (res && !res.ok) return setMsg(res.error);
    onDone();
  }
  return (
    <li className={cn("card-green rounded-2xl p-4", r.rating <= 3 && r.status === "pending" && "ring-1 ring-gold/70")}>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex gap-0.5" aria-label={`${r.rating} stars`}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`size-3.5 ${i <= r.rating ? "fill-gold text-gold" : "text-fg/25"}`} aria-hidden />
          ))}
        </span>
        <span className="uppercase tracking-[0.14em] text-gold">{r.status}</span>
        <span className="text-muted">
          · {r.display_name}
          {r.area ? ` · ${r.area}` : ""} · {fmtWhen(r.created_at)}
        </span>
        <Link to="/jobs/$id" params={{ id: String(r.booking_id) }} className="text-fg underline underline-offset-4">
          Job #{r.booking_id}
        </Link>
      </div>
      <p className="mt-2 whitespace-pre-line text-sm leading-6">{r.body}</p>
      {r.photo_ids?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.photo_ids.map((id) => (
            <a key={id} href={`/api/review-photo/${id}`} target="_blank" rel="noreferrer">
              <img src={`/api/review-photo/${id}`} alt="Customer photo" className="size-20 rounded-lg object-cover" />
            </a>
          ))}
          {!r.photo_consent ? <p className="w-full text-xs text-muted">No photo consent — photos stay private.</p> : null}
        </div>
      ) : null}
      {r.hidden_reason ? <p className="mt-2 text-xs text-muted">Hidden: {r.hidden_reason}</p> : null}
      <label className="mt-3 block text-xs text-muted">
        Public reply
        <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} maxLength={800} className="field mt-1 text-sm" />
      </label>
      {msg ? <p className="mt-2 text-xs text-gold">{msg}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {r.status !== "published" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => act("publish")}
            className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full bg-fg px-3 text-xs font-medium text-ink hover:bg-gold disabled:opacity-50"
          >
            <Check className="size-3.5" aria-hidden /> Publish
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy || reply === (r.owner_reply ?? "")}
          onClick={() => act("reply")}
          className="btn-press inline-flex h-9 items-center rounded-full border border-border px-3 text-xs hover:border-gold disabled:opacity-40"
        >
          Save reply
        </button>
        {r.status !== "hidden" ? (
          <>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as (typeof HIDE_REASONS)[number] | "")}
              className="field h-9 w-auto py-1 text-xs"
              aria-label="Reason to hide"
            >
              <option value="">Hide for…</option>
              {HIDE_REASONS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !reason}
              onClick={() => act("hide")}
              className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs hover:border-gold disabled:opacity-40"
            >
              <EyeOff className="size-3.5" aria-hidden /> Hide
            </button>
          </>
        ) : null}
      </div>
    </li>
  );
}
