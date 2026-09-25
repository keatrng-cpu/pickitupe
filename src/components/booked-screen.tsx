import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarPlus, Phone } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { JobTicket } from "@/components/job-ticket";
import { confirmDeposit } from "@/lib/care";
import { PHONE } from "@/lib/messages";
import { formatDayLong } from "@/lib/schedule";
import { googleCalendarUrl } from "@/lib/calendar";

type Confirmed = Extract<Awaited<ReturnType<typeof confirmDeposit>>, { ok: true }>;

/**
 * "You're booked." — shown when Stripe sends the customer back.
 *
 * It does NOT trust the day in the URL. It trades the Checkout Session id for
 * the booking as saved (confirmDeposit also finalizes it if the webhook hasn't
 * landed yet), so the day, the price and the job page link are the real ones.
 * If the card is still settling it retries a few times, then falls back to
 * the URL day with an honest "confirming" note instead of a wrong promise.
 */
export function BookedScreen({
  sessionId,
  fallbackDay,
  code,
  phone,
  signedIn,
}: {
  sessionId?: string;
  fallbackDay: string;
  code: string;
  phone: string;
  signedIn: boolean;
}) {
  const [state, setState] = useState<"loading" | "ok" | "pending" | "fallback">(sessionId ? "loading" : "fallback");
  const [data, setData] = useState<Confirmed | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let alive = true;
    let tries = 0;
    const run = async () => {
      tries += 1;
      const res = await confirmDeposit({ data: { sessionId } }).catch(() => null);
      if (!alive) return;
      if (res && res.ok) {
        setData(res);
        setState("ok");
        return;
      }
      if (tries < 6 && (!res || ("pending" in res && res.pending))) {
        setState("pending");
        setTimeout(run, 1500);
        return;
      }
      setState("fallback");
    };
    void run();
    return () => {
      alive = false;
    };
  }, [sessionId]);

  const job = data?.job;
  const day = job?.day ?? (fallbackDay || null);
  const manage = data?.token ? `/my/${data.token}` : null;

  return (
    <div className="relative z-10 min-h-dvh overflow-x-clip bg-bg text-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <p className="kicker text-center">On the truck</p>
        <h1 className="mt-3 text-center font-display text-5xl leading-none">You're booked.</h1>

        <div aria-live="polite" className="mt-8">
          {state === "loading" || state === "pending" ? (
            <div className="rounded-2xl border border-border p-6 text-center text-sm text-muted">
              <div className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-fg/10">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gold" />
              </div>
              <p className="mt-4">{state === "pending" ? "The card is settling — locking your day…" : "Printing your ticket…"}</p>
            </div>
          ) : job ? (
            <>
              {data?.moved ? (
                <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
                  The day you tapped filled while you were checking out, so you're on the next open day. Doesn't
                  work? Move it on your job page — free.
                </p>
              ) : null}
              <JobTicket
                job={job}
                footer={
                  <p className="text-sm text-fg/90">
                    Keaton texts {phone || "you"} a window the morning of. Nothing to prep.
                  </p>
                }
              />
            </>
          ) : (
            <div className="rounded-2xl border border-border p-6 text-center">
              <p className="text-base">
                {day ? `${formatDayLong(day)}. ` : null}Job {code}. The deposit went through — your confirmation
                text and email have the exact day{state === "fallback" && sessionId ? " once the card settles" : ""}.
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {manage ? (
            <Link
              to="/my/$token"
              params={{ token: data!.token! }}
              className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
            >
              Your job page
            </Link>
          ) : (
            <Link
              to="/status"
              className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
            >
              Your hauls
            </Link>
          )}
          {job?.day ? (
            <a
              href={googleCalendarUrl({ day: job.day, jobId: job.id, service: job.serviceLabel, address: job.address })}
              target="_blank"
              rel="noreferrer"
              className="btn-press inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm text-fg hover:border-gold"
            >
              <CalendarPlus className="size-4" aria-hidden />
              Add to calendar
            </a>
          ) : null}
          {!signedIn ? (
            <Link
              to="/login"
              className="btn-press inline-flex h-12 items-center rounded-full border border-border px-6 text-sm text-fg hover:border-gold"
            >
              Save on an account
            </Link>
          ) : null}
          <a
            href={`tel:${PHONE.replaceAll("-", "")}`}
            className="btn-press inline-flex h-12 items-center gap-2 rounded-full border border-border px-6 text-sm text-fg hover:border-gold"
          >
            <Phone className="size-4" aria-hidden />
            {PHONE}
          </a>
        </div>

        {job ? (
          <div aria-hidden className="pointer-events-none mt-12 h-16 overflow-visible">
            <img src="/haul-truck.webp" alt="" width={180} height={90} className="roll-away h-16 w-auto" />
          </div>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
