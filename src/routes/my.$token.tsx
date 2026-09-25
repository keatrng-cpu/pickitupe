import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarPlus, Camera, Check, Loader2, Star, X } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { JobTicket } from "@/components/job-ticket";
import { AskBox } from "@/components/ask-box";
import { Reveal } from "@/components/reveal";
import { askForChange, getManage, moveMyDay, submitReview, type ManageView } from "@/lib/care";
import { googleCalendarUrl } from "@/lib/calendar";
import { prepareReviewPhoto } from "@/lib/receipt-client";
import { REVIEW_URL } from "@/lib/messages";
import { NEIGHBORHOODS } from "@/lib/seo";
import { DAILY_SLOTS, formatDayLong } from "@/lib/schedule";

/**
 * /my/<token> — one customer's own job. Reached only by the private link in
 * their confirmation text/email (or the "send me my link" form on /status).
 * noindex: these URLs must never land in a search result.
 */
export const Route = createFileRoute("/my/$token")({
  head: () => ({
    meta: [
      { title: "Your job | Pick It Up E" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "referrer", content: "no-referrer" },
    ],
  }),
  component: MyJobPage,
});

function MyJobPage() {
  const { token } = Route.useParams();
  const [view, setView] = useState<ManageView | null | undefined>(undefined);

  const load = useCallback(async () => {
    const v = await getManage({ data: { token } }).catch(() => null);
    setView(v);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="relative z-10 min-h-dvh overflow-x-clip bg-bg text-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {view === undefined ? (
          <div className="grid gap-4">
            <div className="h-6 w-40 animate-pulse rounded bg-fg/10" />
            <div className="h-64 animate-pulse rounded-2xl bg-fg/8" />
          </div>
        ) : view === null ? (
          <NotFound />
        ) : (
          <JobView view={view} token={token} onChange={load} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="kicker">Your job</p>
      <h1 className="mt-3 font-display text-4xl">That link didn't open a job.</h1>
      <p className="mt-4 text-muted">
        It may have been mistyped. Put in the phone you booked with and we'll send your links again.
      </p>
      <Link
        to="/status"
        className="btn-press mt-8 inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
      >
        Send me my links
      </Link>
    </div>
  );
}

function JobView({ view, token, onChange }: { view: ManageView; token: string; onChange: () => Promise<void> }) {
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const heading =
    view.status === "done"
      ? "All done."
      : view.status === "cancelled"
        ? "This one's cancelled."
        : view.depositPaid || view.status === "scheduled"
          ? "You're on the truck."
          : "We've got your request.";

  return (
    <>
      <p className="kicker">Your job · #{view.id}</p>
      <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
        Hi {view.firstName}. {heading}
      </h1>

      <div className="mt-8">
        <JobTicket
          job={view}
          footer={
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {view.day && view.status !== "done" && view.status !== "cancelled" ? (
                <a
                  className="btn-press inline-flex h-10 items-center gap-2 rounded-full border border-gold/40 px-4 text-fg hover:border-gold"
                  href={googleCalendarUrl({ day: view.day, jobId: view.id, service: view.serviceLabel, address: view.address })}
                  target="_blank"
                  rel="noreferrer"
                >
                  <CalendarPlus className="size-4" aria-hidden /> Add to calendar
                </a>
              ) : null}
              <span className="text-fg/80">
                {view.status === "done"
                  ? "Thanks for having us out."
                  : "Keaton texts a window the morning of. Nothing to prep."}
              </span>
            </div>
          }
        />
      </div>

      {toast ? (
        <p role="status" className="stagger-in mt-5 flex items-center gap-2 rounded-xl border border-sioux/60 bg-sioux/15 px-4 py-3 text-sm">
          <Check className="size-4 text-gold" aria-hidden /> {toast}
        </p>
      ) : null}

      {view.status === "done" ? (
        <Reveal as="section" className="mt-12">
          <div className="card-green rounded-2xl p-6 sm:p-8">
            <p className="kicker">Next time</p>
            <h2 className="mt-2 font-display text-3xl leading-none">Same yard, next season?</h2>
            <p className="mt-3 max-w-2xl text-sm text-fg/90">
              The two-visit plan is a spring and a fall pass, paid once a year. It renews each year until you cancel —
              one click, no call. Or just book this same job again when you need it.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to="/plan"
                className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
              >
                See the yearly plan
              </Link>
              <Link
                to="/call"
                search={{ service: view.service, size: view.size || undefined }}
                className="btn-press inline-flex h-12 items-center rounded-full border border-border px-6 text-sm hover:border-gold"
              >
                Book this job again
              </Link>
            </div>
          </div>
        </Reveal>
      ) : null}

      {view.canReview || view.review ? (
        <Reveal as="section" className="mt-12" >
          <ReviewSection view={view} token={token} onDone={onChange} />
        </Reveal>
      ) : null}

      {view.canMove && view.days.length ? (
        <Reveal as="section" className="mt-12">
          <MoveDay
            view={view}
            token={token}
            onMoved={async (d) => {
              setToast(`Moved to ${formatDayLong(d)}. ${view.depositPaid ? "Same deposit, same price." : "Same price."}`);
              await onChange();
            }}
          />
        </Reveal>
      ) : null}

      {view.status !== "cancelled" ? (
        <Reveal as="section" className="mt-12">
          <ChangeRequests view={view} token={token} onSent={(msg) => setToast(msg)} />
        </Reveal>
      ) : null}

      <Reveal as="section" className="mt-12">
        <AskBox
          token={token}
          title="Ask about this job"
          intro="The assistant knows this job. Ask anything, or say what needs to change — anything it can't do goes straight to Keaton."
          suggestions={["What should I do before you come?", "Can you also take a couch?", "Do I need to be home?"]}
        />
      </Reveal>
    </>
  );
}

/* ------------------------------------------------------------- move day */

function MoveDay({ view, token, onMoved }: { view: ManageView; token: string; onMoved: (day: string) => Promise<void> }) {
  const [pick, setPick] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function move() {
    if (!pick) return;
    setBusy(true);
    setError("");
    const res = await moveMyDay({ data: { token, day: pick } }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      setError(res && !res.ok ? res.error : "Couldn't move it — try again.");
      return;
    }
    setPick("");
    await onMoved(res.day);
  }

  return (
    <div>
      <h2 className="font-display text-3xl leading-none">Move the day</h2>
      <p className="mt-2 text-sm text-muted">
        Free, any time until the day before. The bar under each day is how full the truck already is.
      </p>
      <ul className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {view.days.slice(0, 15).map((d, i) => {
          const current = d.day === view.day;
          const pressed = pick === d.day;
          const pct = Math.min(100, Math.round((d.used / DAILY_SLOTS) * 100));
          return (
            <li key={d.day}>
              <button
                type="button"
                disabled={!d.open || current}
                aria-pressed={pressed}
                onClick={() => setPick(d.day)}
                className={`day-chip w-full rounded-xl border px-2 pb-2 pt-2.5 text-center text-sm disabled:cursor-not-allowed ${
                  current
                    ? "border-gold bg-gold/15 text-fg"
                    : pressed
                      ? "border-fg bg-fg text-ink"
                      : d.open
                        ? "border-border hover:border-gold"
                        : "border-border/50 text-muted/60 line-through"
                }`}
              >
                <span className="block">{d.label}</span>
                <span className="mt-1 block text-[0.65rem] uppercase tracking-[0.14em] opacity-80">
                  {current ? "Yours" : d.open ? (pct >= 50 ? "Filling" : "Open") : "Full"}
                </span>
                <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-fg/10" aria-hidden>
                  <span
                    className="bed-fill block h-full rounded-full bg-gold/80"
                    style={{ width: `${pct}%`, animationDelay: `${i * 30}ms` }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error ? <p className="mt-3 text-sm text-gold">{error}</p> : null}
      <button
        type="button"
        onClick={move}
        disabled={!pick || busy}
        className="btn-press mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {pick ? `Move it to ${formatDayLong(pick)}` : "Pick a day"}
      </button>
    </div>
  );
}

/* -------------------------------------------------------- change / cancel */

const CHANGE_KINDS = [
  { kind: "change", label: "Change what we're taking", hint: "Add a couch, drop the back yard, anything." },
  { kind: "cancel", label: "Cancel the job", hint: "Keaton texts back about the deposit." },
  { kind: "complaint", label: "Something wasn't right", hint: "Tell us — we come back and fix it." },
] as const;

function ChangeRequests({ view, token, onSent }: { view: ManageView; token: string; onSent: (m: string) => void }) {
  const [kind, setKind] = useState<(typeof CHANGE_KINDS)[number]["kind"] | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const kinds = CHANGE_KINDS.filter((k) => (view.status === "done" ? k.kind !== "cancel" : true));

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!kind) return;
    setBusy(true);
    setError("");
    const res = await askForChange({ data: { token, kind, message } }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      setError(res && !res.ok ? res.error : "Couldn't send — text the number at the bottom.");
      return;
    }
    setKind(null);
    setMessage("");
    onSent(`Sent to Keaton as ticket #${res.ticket}. He'll text you back.`);
  }

  return (
    <div>
      <h2 className="font-display text-3xl leading-none">Need something changed?</h2>
      <p className="mt-2 text-sm text-muted">
        These go straight to Keaton's phone — a person, not the assistant.
        {view.openTickets ? ` You have ${view.openTickets} open with him already.` : ""}
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-3">
        {kinds.map((k) => (
          <button
            key={k.kind}
            type="button"
            aria-pressed={kind === k.kind}
            onClick={() => setKind(kind === k.kind ? null : k.kind)}
            className={`card-lift rounded-2xl border p-4 text-left transition ${
              kind === k.kind ? "border-gold bg-gold/10" : "border-border hover:border-gold/60"
            }`}
          >
            <span className="block font-medium">{k.label}</span>
            <span className="mt-1 block text-xs text-muted">{k.hint}</span>
          </button>
        ))}
      </div>
      {kind ? (
        <form onSubmit={send} className="stagger-in mt-4 grid gap-3">
          <label className="text-sm text-muted" htmlFor="change-msg">
            What should Keaton know?
          </label>
          <textarea
            id="change-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
            required
            minLength={3}
            className="field"
            placeholder={kind === "cancel" ? "Anything we should know? (optional detail)" : "In your words…"}
          />
          {error ? <p className="text-sm text-gold">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy || message.trim().length < 3}
              className="btn-press inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold disabled:opacity-50"
            >
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              Send to Keaton
            </button>
            <button
              type="button"
              onClick={() => setKind(null)}
              className="btn-press h-12 rounded-full border border-border px-5 text-sm hover:border-gold"
            >
              Never mind
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- review */

function ReviewSection({ view, token, onDone }: { view: ManageView; token: string; onDone: () => Promise<void> }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(view.firstName);
  const [area, setArea] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  if (view.review && !sent) {
    return (
      <div id="review" className="card-green rounded-2xl p-6">
        <h2 className="font-display text-3xl leading-none">Thanks for the review.</h2>
        <p className="mt-3 text-sm text-fg/90">
          {view.review.status === "published"
            ? "It's up on the reviews page."
            : view.review.status === "hidden"
              ? "Keaton has it."
              : "It goes up on the reviews page once Keaton gives it a look — every rating gets posted."}
        </p>
        <GoogleNudge />
      </div>
    );
  }

  if (sent) {
    return (
      <div id="review" className="card-green stagger-in rounded-2xl p-6">
        <h2 className="font-display text-3xl leading-none">Thank you, {name || view.firstName}.</h2>
        <p className="mt-3 text-sm text-fg/90">
          It goes up on the reviews page shortly — good, bad or in between, every rating gets posted.
          {rating <= 3 ? " Keaton got your note too and will text you about making it right." : ""}
        </p>
        <p className="mt-4 text-sm text-fg/90">
          Would you post the same words on Google? It's how the next neighbor finds us.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(body);
                setCopied(true);
              } catch {
                /* clipboard blocked — the Google link still works */
              }
            }}
            className="btn-press inline-flex h-11 items-center rounded-full border border-border px-5 text-sm hover:border-gold"
          >
            {copied ? "Copied" : "Copy my review"}
          </button>
          <a
            href={REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-press inline-flex h-11 items-center rounded-full bg-fg px-5 text-sm font-medium text-ink hover:bg-gold"
          >
            Post it on Google
          </a>
        </div>
      </div>
    );
  }

  async function addFiles(files: FileList | null) {
    if (!files) return;
    setError("");
    const room = 4 - photos.length;
    const picked = Array.from(files).slice(0, room);
    try {
      const out: string[] = [];
      for (const f of picked) out.push(await prepareReviewPhoto(f));
      setPhotos((cur) => [...cur, ...out].slice(0, 4));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read that photo.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Tap a star rating.");
    if (body.trim().length < 10) return setError("A sentence or two, please — what did we do?");
    if (photos.length && !consent) return setError("Tick the box so we can show your photos.");
    setBusy(true);
    const res = await submitReview({
      data: { token, rating, body: body.trim(), displayName: name.trim() || view.firstName, area: area || undefined, photos, photoConsent: consent },
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) return setError(res && !res.ok ? res.error : "Couldn't send — try again.");
    setSent(true);
    void onDone();
  }

  const shown = hover || rating;
  return (
    <form id="review" onSubmit={submit} className="card-paper rounded-2xl p-6 sm:p-8">
      <p className="kicker">How'd we do?</p>
      <h2 className="mt-2 font-display text-3xl leading-none">Leave a review — photos welcome.</h2>
      <p className="mt-2 text-sm opacity-80">
        Honest is the point. Every rating is posted with your first name only.
      </p>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium">Your rating</legend>
        <div className="mt-2 flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className="star-btn rounded-md p-1"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              aria-pressed={rating === n}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(0)}
              onClick={() => setRating(n)}
            >
              <Star className={`size-8 ${n <= shown ? "fill-mahogany text-mahogany" : "text-print/35"}`} aria-hidden />
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 block text-sm font-medium" htmlFor="rev-body">
        What happened?
        <textarea
          id="rev-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={1500}
          className="ink-field"
          placeholder="What we hauled or raked, how it went, anything we should do better."
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium" htmlFor="rev-name">
          Name shown
          <input id="rev-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="ink-field" />
        </label>
        <label className="block text-sm font-medium" htmlFor="rev-area">
          Neighborhood (optional)
          <select id="rev-area" value={area} onChange={(e) => setArea(e.target.value)} className="ink-field">
            <option value="">—</option>
            {[...NEIGHBORHOODS, "South Grand Forks", "East Grand Forks", "Out of town"].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium">Photos (up to 4)</p>
        <div className="mt-2 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div key={i} className="stagger-in relative size-24 overflow-hidden rounded-xl border border-print/15">
              <img src={p} alt={`Your photo ${i + 1}`} className="size-full object-cover" />
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => setPhotos((cur) => cur.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-print/80 text-paper"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          ))}
          {photos.length < 4 ? (
            <label className="grid size-24 cursor-pointer place-items-center rounded-xl border border-dashed border-print/35 text-center text-xs hover:border-mahogany">
              <span>
                <Camera className="mx-auto size-6" aria-hidden />
                Add photo
              </span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void addFiles(e.target.files)} />
            </label>
          ) : null}
        </div>
        {photos.length ? (
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
            <span>
              These are my photos and Pick It Up E may show them on its site with my review. (Location data is stripped
              from the files.)
            </span>
          </label>
        ) : null}
      </div>

      {error ? <p className="mt-4 text-sm font-medium text-mahogany">{error}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="btn-press mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-mahogany px-7 text-sm font-medium text-paper hover:bg-mahogany-deep disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        Post my review
      </button>
    </form>
  );
}

function GoogleNudge() {
  return (
    <a
      href={REVIEW_URL}
      target="_blank"
      rel="noreferrer"
      className="btn-press mt-4 inline-flex h-11 items-center rounded-full border border-border px-5 text-sm hover:border-gold"
    >
      Post it on Google too
    </a>
  );
}
