import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { digitsPhone, isUsPhone } from "@/lib/phone";
import { formatAddOns, parseAddOns, type ServiceKey } from "@/lib/pricebook";
import { dayOptions, slotsFor, todayISO, DAILY_SLOTS, type DayFill } from "@/lib/schedule";

/**
 * Customer care — the private job page (/my/<token>), the confirmed-date
 * success screen, change requests, photo reviews, and the owner's care board.
 *
 * Security model: a booking is reachable ONLY through its manage token (144
 * random bits, delivered by text/email to the contact on the booking) or by
 * the owner. Nothing here looks a booking up by phone number and hands it
 * back — that was the hole in the old /status lookup.
 *
 * Server-only helpers live in care.server.ts and are imported inside the
 * handlers so they never reach the browser bundle.
 */

export const SERVICE_LABEL: Record<string, string> = {
  "leaf-cleanup": "Fall leaf & yard cleanup",
  "junk-removal": "Junk & furniture haul",
  "furniture-appliances": "Junk & furniture haul",
  "gutter-cleaning": "Single-story gutter cleaning",
};

/** Moves are self-serve until the day before; inside that, it's a request to the owner. */
export const SELF_SERVE_CUTOFF_DAYS = 1;

const tokenInput = z.object({ token: z.string().min(20).max(40).regex(/^[A-Za-z0-9_-]+$/) });

type Row = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  service: string;
  job_size: string | null;
  add_ons: string | null;
  preferred_date: string | null;
  status: string;
  estimate_low: number | null;
  estimate_high: number | null;
  deposit_cents: number | null;
  deposit_paid: boolean | null;
  final_cents: number | null;
  completed_at: string | null;
};

const ROW_SELECT = `id, name, phone, email, address, service, job_size, add_ons, preferred_date, status,
  estimate_low, estimate_high, deposit_cents, deposit_paid, final_cents, completed_at`;

function isoDay(v: string | null | undefined) {
  const d = (v || "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}

function canSelfMove(r: Row) {
  const day = isoDay(r.preferred_date);
  // "scheduled" is the gate — set by a cleared deposit OR by the owner
  // (phone and landlord jobs are scheduled without a card deposit).
  if (r.status !== "scheduled") return false;
  if (!day) return true;
  return daysBetween(todayISO(), day) > SELF_SERVE_CUTOFF_DAYS;
}

/** What the customer's own page may show. Their own address, yes; nobody else's anything. */
function publicView(r: Row) {
  return {
    id: r.id,
    firstName: (r.name || "").trim().split(/\s+/)[0] || "there",
    address: r.address,
    service: r.service,
    serviceLabel: SERVICE_LABEL[r.service] ?? r.service,
    size: r.job_size,
    addOns: formatAddOns(r.add_ons),
    day: isoDay(r.preferred_date),
    status: r.status,
    range: r.estimate_low != null && r.estimate_high != null ? { low: r.estimate_low, high: r.estimate_high } : null,
    finalCents: r.final_cents,
    deposit: Math.round((r.deposit_cents || 5000) / 100),
    depositPaid: Boolean(r.deposit_paid),
    hasEmail: Boolean(r.email),
  };
}

export type ManageView = ReturnType<typeof publicView> & {
  canMove: boolean;
  days: { day: string; label: string; open: boolean; used: number }[];
  review: { status: string; rating: number } | null;
  canReview: boolean;
  openTickets: number;
};

async function loadByToken(token: string) {
  const { careSql } = await import("@/lib/care.server");
  const sql = await careSql();
  const rows = await sql.query<Row>(`select ${ROW_SELECT} from bookings where manage_token = $1`, [token]);
  return { sql, row: rows[0] ?? null };
}

async function fillExcluding(bookingId: number): Promise<DayFill[]> {
  const { careSql } = await import("@/lib/care.server");
  const sql = await careSql();
  const rows = await sql.query<{ preferred_date: string | null; job_size: string | null; service: string; add_ons: string | null }>(
    `select preferred_date, job_size, service, add_ons from bookings
      where preferred_date is not null and preferred_date >= $1
        and status not in ('cancelled', 'done', 'hold') and id <> $2`,
    [todayISO(), bookingId],
  );
  const used = new Map<string, number>();
  for (const r of rows) {
    const day = isoDay(r.preferred_date);
    if (!day) continue;
    used.set(day, (used.get(day) ?? 0) + slotsFor((r.service as ServiceKey) || "junk-removal", r.job_size || "single", parseAddOns(r.add_ons)));
  }
  return [...used.entries()].map(([day, u]) => ({ day, used: u }));
}

export const getManage = createServerFn({ method: "POST" })
  .validator((input: unknown) => tokenInput.parse(input))
  .handler(async ({ data }): Promise<ManageView | null> => {
    const { limited } = await import("@/lib/care.server");
    if (limited("manage", 40)) return null;
    const { sql, row } = await loadByToken(data.token);
    if (!row) return null;
    const need = slotsFor((row.service as ServiceKey) || "junk-removal", row.job_size || "single", parseAddOns(row.add_ons));
    const canMove = canSelfMove(row);
    const days = canMove
      ? dayOptions(await fillExcluding(row.id), need).filter((d) => daysBetween(todayISO(), d.day) > SELF_SERVE_CUTOFF_DAYS)
      : [];
    const rev = await sql.query<{ status: string; rating: number }>(`select status, rating from reviews where booking_id = $1`, [row.id]);
    const tickets = await sql.query<{ n: number }>(
      `select count(*)::int as n from support_tickets where booking_id = $1 and status = 'open'`,
      [row.id],
    );
    return {
      ...publicView(row),
      canMove,
      days,
      review: rev[0] ?? null,
      canReview: row.status === "done" && !rev[0],
      openTickets: tickets[0]?.n ?? 0,
    };
  });

export const moveMyDay = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    tokenInput.extend({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { limited, openTicket } = await import("@/lib/care.server");
    const { logEvent } = await import("@/lib/owner-schema");
    if (limited("move", 8)) return { ok: false as const, error: "Too many tries — give it a minute." };
    const { sql, row } = await loadByToken(data.token);
    if (!row) return { ok: false as const, error: "That link isn't valid anymore." };
    if (!canSelfMove(row)) {
      return { ok: false as const, error: "It's too close to the day to move it here — ask below and Keaton will sort it." };
    }
    const need = slotsFor((row.service as ServiceKey) || "junk-removal", row.job_size || "single", parseAddOns(row.add_ons));
    const option = dayOptions(await fillExcluding(row.id), need).find((d) => d.day === data.day);
    if (!option || !option.open || daysBetween(todayISO(), data.day) <= SELF_SERVE_CUTOFF_DAYS) {
      return { ok: false as const, error: "That day just filled. Pick another one." };
    }
    const from = isoDay(row.preferred_date);
    const moved = await sql.query<{ id: number }>(
      `update bookings set preferred_date = $2, reminded_at = null where id = $1 and status = 'scheduled' returning id`,
      [row.id, data.day],
    );
    if (!moved.length) return { ok: false as const, error: "That job can't be moved from here — ask below." };
    // Optimistic re-check in truck slots (slotsFor lives in TS, not SQL): if
    // two customers grabbed the last slot at the same moment, the day is now
    // over capacity — put this one back and ask them to pick again.
    const after = await fillExcluding(-1);
    if ((after.find((f) => f.day === data.day)?.used ?? 0) > DAILY_SLOTS) {
      await sql.query(`update bookings set preferred_date = $2 where id = $1`, [row.id, row.preferred_date]);
      return { ok: false as const, error: "That day just filled. Pick another one." };
    }
    await logEvent(sql, row.id, "status", `Customer moved the day ${from ?? "(none)"} → ${data.day}`);
    await openTicket(sql, {
      bookingId: row.id,
      kind: "reschedule",
      urgency: from && daysBetween(todayISO(), from) <= 3 ? "high" : "low",
      summary: `Moved it themselves: ${from ?? "no day"} → ${data.day}. Nothing to do unless the route needs it.`,
      name: row.name,
      phone: row.phone,
      email: row.email,
      channel: "manage",
    });
    const { formatDayLong } = await import("@/lib/schedule");
    const { notifyCustomer } = await import("@/lib/customer-notify.server");
    await notifyCustomer(
      row.phone,
      row.email,
      `Moved, ${(row.name || "").split(/\s+/)[0]}: job #${row.id} is now ${formatDayLong(data.day)}. Same deposit, same price. — Pick It Up E`,
    );
    return { ok: true as const, day: data.day };
  });

export const askForChange = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    tokenInput
      .extend({
        kind: z.enum(["cancel", "change", "complaint", "reschedule", "question"]),
        message: z.string().trim().min(3).max(1000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { limited, openTicket } = await import("@/lib/care.server");
    if (limited("ask", 6)) return { ok: false as const, error: "Too many at once — give it a minute." };
    const { sql, row } = await loadByToken(data.token);
    if (!row) return { ok: false as const, error: "That link isn't valid anymore." };
    const day = isoDay(row.preferred_date);
    const soon = day ? daysBetween(todayISO(), day) <= 2 : false;
    const id = await openTicket(sql, {
      bookingId: row.id,
      kind: data.kind,
      urgency: data.kind === "complaint" || soon ? "high" : "normal",
      summary: data.message,
      name: row.name,
      phone: row.phone,
      email: row.email,
      channel: "manage",
    });
    return { ok: true as const, ticket: id };
  });

/**
 * Success page: the Checkout Session id comes back in the URL. Finalize here
 * as well as in the webhook (whichever is first wins the lock inside
 * finalizePaidDeposit), then show the day the job ACTUALLY landed on.
 */
export const confirmDeposit = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ sessionId: z.string().regex(/^cs_(test|live)_[A-Za-z0-9]+$/) }).parse(input))
  .handler(async ({ data }) => {
    const { getStripe, stripeConfigured } = await import("@/lib/stripe.server");
    if (!stripeConfigured()) return { ok: false as const, error: "not configured" };
    let session;
    try {
      session = await getStripe().checkout.sessions.retrieve(data.sessionId);
    } catch {
      return { ok: false as const, error: "Couldn't find that checkout." };
    }
    const id = Number(session.metadata?.bookingId);
    if (session.metadata?.app !== "pickitupe" || session.metadata?.kind !== "deposit" || !Number.isInteger(id)) {
      return { ok: false as const, error: "Not a deposit checkout." };
    }
    if (session.payment_status !== "paid") {
      return { ok: false as const, pending: true as const, error: "The card is still processing." };
    }
    const { finalizePaidDeposit } = await import("@/lib/pay-finalize.server");
    const done = await finalizePaidDeposit(id, session.id, session.amount_total);
    if (!done) return { ok: false as const, error: "Couldn't find the job." };
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    const rows = await sql.query<Row>(`select ${ROW_SELECT} from bookings where id = $1`, [id]);
    const row = rows[0];
    if (!row) return { ok: false as const, error: "Couldn't find the job." };
    return { ok: true as const, token: done.token, moved: done.moved, job: publicView(row) };
  });

/**
 * "Send me my link" — the replacement for the phone lookup. It never says
 * whether the number is on file (that would leak who booked), it just sends
 * the links to the contact details ON THE BOOKING, which only the customer
 * holds.
 */
export const sendMyLinks = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ phone: z.string().min(7).max(24) }).parse(input))
  .handler(async ({ data }) => {
    const generic = { ok: true as const, message: "If that number is on a booking, your job links are on the way to the email and phone on it." };
    if (!isUsPhone(digitsPhone(data.phone).slice(-10))) return { ok: false as const, message: "Use the 10-digit phone you booked with." };
    const { limited, sendLinksForPhone } = await import("@/lib/care.server");
    if (limited("links", 3, 10 * 60_000)) return generic;
    await sendLinksForPhone(data.phone);
    return generic;
  });

/* --------------------------------------------------------------- reviews */

export const submitReview = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    tokenInput
      .extend({
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(10).max(1500),
        displayName: z.string().trim().min(1).max(40),
        area: z.string().trim().max(60).optional(),
        photos: z.array(z.string().max(2_300_000)).max(4).default([]),
        photoConsent: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { limited, decodePhoto, openTicket, alertOwnerCare } = await import("@/lib/care.server");
    if (limited("review", 4)) return { ok: false as const, error: "Too many tries — give it a minute." };
    const { sql, row } = await loadByToken(data.token);
    if (!row) return { ok: false as const, error: "That link isn't valid anymore." };
    if (row.status !== "done") return { ok: false as const, error: "Reviews open once the job is marked done." };
    const decoded = data.photos.map(decodePhoto);
    if (decoded.some((d) => !d)) return { ok: false as const, error: "One of the photos didn't come through — try JPG or PNG." };
    if (decoded.length && !data.photoConsent) return { ok: false as const, error: "Tick the box so we can show your photos." };
    const inserted = await sql.query<{ id: number }>(
      `insert into reviews (booking_id, rating, body, display_name, area, service, photo_consent)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (booking_id) do nothing
       returning id`,
      [row.id, data.rating, data.body, data.displayName, data.area || null, row.service, data.photoConsent],
    );
    const reviewId = inserted[0]?.id;
    if (!reviewId) return { ok: false as const, error: "You've already left a review for this job — thank you." };
    for (const p of decoded) {
      if (!p) continue;
      await sql.query(
        `insert into review_photos (review_id, mime, bytes, byte_size, sha256) values ($1, $2, $3, $4, $5)`,
        [reviewId, p.mime, p.buf, p.buf.byteLength, p.sha],
      );
    }
    const { logEvent } = await import("@/lib/owner-schema");
    await logEvent(sql, row.id, "system", `Review left: ${data.rating}★${decoded.length ? ` · ${decoded.length} photo(s)` : ""}`);
    if (data.rating <= 3) {
      // An unhappy customer is a ticket, not just a review — the owner hears
      // about it right now, and still publishes the review (see moderateReview).
      await openTicket(sql, {
        bookingId: row.id,
        kind: "complaint",
        urgency: "high",
        summary: `${data.rating}★ review: ${data.body}`,
        name: row.name,
        phone: row.phone,
        email: row.email,
        channel: "review",
      });
    } else {
      await alertOwnerCare({
        subject: `New ${data.rating}★ review — job #${row.id}`,
        lines: [`${data.displayName}: "${data.body}"`, decoded.length ? `${decoded.length} photo(s) attached.` : "", "Publish it from the care board."],
        sms: `New ${data.rating}★ review #${row.id} — publish from the care board`,
      });
    }
    return { ok: true as const };
  });

export type PublicReview = {
  id: number;
  rating: number;
  body: string;
  displayName: string;
  area: string | null;
  service: string | null;
  serviceLabel: string;
  publishedAt: string;
  ownerReply: string | null;
  photos: number[];
};

export const listReviews = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    const rows = await sql.query<{
      id: number;
      rating: number;
      body: string;
      display_name: string;
      area: string | null;
      service: string | null;
      published_at: string;
      owner_reply: string | null;
      photo_ids: number[] | null;
    }>(
      `select r.id, r.rating, r.body, r.display_name, r.area, r.service, r.published_at, r.owner_reply,
              case when r.photo_consent then array(select p.id from review_photos p where p.review_id = r.id order by p.id) else '{}'::int[] end as photo_ids
         from reviews r
        where r.status = 'published'
        order by r.published_at desc
        limit 120`,
    );
    const reviews: PublicReview[] = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      displayName: r.display_name,
      area: r.area,
      service: r.service,
      serviceLabel: r.service ? SERVICE_LABEL[r.service] ?? r.service : "",
      publishedAt: String(r.published_at),
      ownerReply: r.owner_reply,
      photos: r.photo_ids ?? [],
    }));
    const count = reviews.length;
    const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : null;
    return { reviews, count, average };
  } catch {
    return { reviews: [] as PublicReview[], count: 0, average: null as number | null };
  }
});

/* ----------------------------------------------------------- owner board */

export const getCareBoard = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }) => {
    if (!isOwnerEmail(context.email)) throw new Error("Forbidden");
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    const tickets = await sql.query<{
      id: number;
      booking_id: number | null;
      kind: string;
      urgency: string;
      summary: string;
      name: string | null;
      phone: string | null;
      email: string | null;
      channel: string;
      status: string;
      owner_note: string | null;
      created_at: string;
      resolved_at: string | null;
    }>(
      `select id, booking_id, kind, urgency, summary, name, phone, email, channel, status, owner_note, created_at, resolved_at
         from support_tickets
        where status = 'open' or resolved_at > now() - interval '14 days'
        order by (status = 'open') desc, (urgency = 'high') desc, created_at desc
        limit 100`,
    );
    const reviews = await sql.query<{
      id: number;
      booking_id: number;
      rating: number;
      body: string;
      display_name: string;
      area: string | null;
      service: string | null;
      status: string;
      hidden_reason: string | null;
      owner_reply: string | null;
      photo_consent: boolean;
      created_at: string;
      photo_ids: number[] | null;
    }>(
      `select r.id, r.booking_id, r.rating, r.body, r.display_name, r.area, r.service, r.status, r.hidden_reason,
              r.owner_reply, r.photo_consent, r.created_at,
              array(select p.id from review_photos p where p.review_id = r.id order by p.id) as photo_ids
         from reviews r
        order by (r.status = 'pending') desc, r.created_at desc
        limit 100`,
    );
    return { tickets, reviews };
  });

export const resolveTicket = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive(), note: z.string().max(1000).optional(), reopen: z.boolean().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!isOwnerEmail(context.email)) throw new Error("Forbidden");
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    await sql.query(
      data.reopen
        ? `update support_tickets set status = 'open', resolved_at = null where id = $1`
        : `update support_tickets set status = 'resolved', resolved_at = now(), owner_note = coalesce($2, owner_note) where id = $1`,
      data.reopen ? [data.id] : [data.id, data.note?.trim() || null],
    );
    return { ok: true as const };
  });

/**
 * Publish or hide. Hiding takes a content reason from a fixed list — never
 * the star count. Suppressing honest negative reviews is exactly what the
 * FTC's 2024 review rule (16 CFR 465) prohibits, and a page of only 5-star
 * reviews reads as fake anyway. The reply field is the right tool for a
 * review the owner disagrees with.
 */
export const HIDE_REASONS = [
  "Private information (address, phone, full name)",
  "Profanity or abuse",
  "Not about our work",
  "Duplicate",
  "Customer asked to remove it",
] as const;

export const moderateReview = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        action: z.enum(["publish", "hide", "reply"]),
        reason: z.enum(HIDE_REASONS).optional(),
        reply: z.string().max(800).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!isOwnerEmail(context.email)) throw new Error("Forbidden");
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    if (data.action === "publish") {
      await sql.query(
        `update reviews set status = 'published', published_at = coalesce(published_at, now()), hidden_reason = null where id = $1`,
        [data.id],
      );
    } else if (data.action === "hide") {
      if (!data.reason) return { ok: false as const, error: "Pick a reason." };
      await sql.query(`update reviews set status = 'hidden', hidden_reason = $2 where id = $1`, [data.id, data.reason]);
    } else {
      await sql.query(`update reviews set owner_reply = nullif($2, '') where id = $1`, [data.id, data.reply?.trim() ?? ""]);
    }
    return { ok: true as const };
  });

/** Owner: the customer's private job link, to text or email by hand. Mints it if missing. */
export const ownerJobLink = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!isOwnerEmail(context.email)) throw new Error("Forbidden");
    const { careSql, ensureManageToken, manageUrl } = await import("@/lib/care.server");
    const sql = await careSql();
    const token = await ensureManageToken(sql, data.id);
    return token ? { ok: true as const, url: manageUrl(token), path: `/my/${token}` } : { ok: false as const };
  });
