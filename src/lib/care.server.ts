import { createHash, randomBytes } from "node:crypto";
import { getRequestIP } from "@tanstack/react-start/server";
import { getSql, type Sql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { sendEmail, sendSms } from "@/lib/customer-notify.server";
import { digitsPhone, isUsPhone } from "@/lib/phone";
import { ownerInbox } from "@/lib/owner";
import { PHONE } from "@/lib/messages";

/**
 * Customer care, server side: the private manage link, support tickets, owner
 * alerts, photo storage and a per-visitor speed bump.
 *
 * MUST keep the `.server` suffix — it imports `@tanstack/react-start/server`
 * (request IP) and node:crypto. The server functions in care.ts import it
 * dynamically inside their handlers so none of this reaches the browser.
 */

if (typeof window !== "undefined") {
  throw new Error("care.server.ts is server-only");
}

export async function careSql(): Promise<Sql> {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  return sql;
}

export function siteUrl(path = "") {
  const base = (process.env.VITE_SITE_URL || process.env.BETTER_AUTH_URL || "https://pickitupe.com").trim().replace(/\/$/, "");
  return `${base}${path}`;
}

/** 24 url-safe chars, 144 bits. Unguessable; it's the only key /my/<token> takes. */
export function newToken() {
  return randomBytes(18).toString("base64url");
}

export function isToken(t: unknown): t is string {
  return typeof t === "string" && /^[A-Za-z0-9_-]{20,40}$/.test(t);
}

/** The booking's manage token, minted on first ask. Idempotent under a race. */
export async function ensureManageToken(sql: Sql, bookingId: number): Promise<string | null> {
  const rows = await sql.query<{ manage_token: string | null }>(
    `update bookings set manage_token = coalesce(manage_token, $2) where id = $1 returning manage_token`,
    [bookingId, newToken()],
  );
  return rows[0]?.manage_token ?? null;
}

export function manageUrl(token: string) {
  return siteUrl(`/my/${token}`);
}

/**
 * Owner alert for anything customer-care: text to the cell (when the Twilio
 * line can send) and an email to the owner inbox. Never throws — the ticket is
 * already saved, and a missed alert must not turn into an error the customer
 * sees. The ticket list on /jobs/care is the backstop either way.
 */
export async function alertOwnerCare(input: { subject: string; lines: string[]; sms: string }) {
  const to = ownerInbox();
  const text = [...input.lines, "", `Open the care board: ${siteUrl("/jobs/care")}`].join("\n");
  const smsOn = process.env.TWILIO_SMS_ENABLED?.trim() === "true";
  const cell = (process.env.OWNER_CELL || PHONE).trim();
  const [mail, sms] = await Promise.all([
    to ? sendEmail(to, input.subject, text).catch(() => false) : Promise.resolve(false),
    smsOn ? sendSms(cell, `${input.sms} · ${siteUrl("/jobs/care")}`).catch(() => false) : Promise.resolve(false),
  ]);
  if (!mail && !sms) console.warn(`[care] owner alert not delivered: ${input.subject}`);
  return { mail, sms };
}

export type TicketKind = "reschedule" | "cancel" | "change" | "complaint" | "question" | "praise" | "other";
export type Urgency = "low" | "normal" | "high";

const KIND_LABEL: Record<TicketKind, string> = {
  reschedule: "Wants a different day",
  cancel: "Wants to cancel",
  change: "Wants to change the job",
  complaint: "Not happy",
  question: "Question for you",
  praise: "Kind words",
  other: "Needs you",
};

export async function openTicket(
  sql: Sql,
  t: {
    bookingId?: number | null;
    kind: TicketKind;
    urgency: Urgency;
    summary: string;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    channel: "concierge" | "manage" | "review";
    transcript?: unknown;
  },
) {
  const rows = await sql.query<{ id: number }>(
    `insert into support_tickets (booking_id, kind, urgency, summary, name, phone, email, channel, transcript)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    [
      t.bookingId ?? null,
      t.kind,
      t.urgency,
      t.summary.slice(0, 1200),
      t.name ?? null,
      t.phone ?? null,
      t.email ?? null,
      t.channel,
      t.transcript ? JSON.stringify(t.transcript).slice(0, 20_000) : null,
    ],
  );
  const id = rows[0]?.id ?? 0;
  if (t.bookingId) await logEvent(sql, t.bookingId, "system", `Care ticket #${id}: ${KIND_LABEL[t.kind]} — ${t.summary.slice(0, 160)}`);
  const who = [t.name, t.phone, t.email].filter(Boolean).join(" · ") || "no contact given";
  const flag = t.urgency === "high" ? "URGENT · " : "";
  await alertOwnerCare({
    subject: `${flag}${KIND_LABEL[t.kind]}${t.bookingId ? ` — job #${t.bookingId}` : ""}`,
    lines: [
      `${KIND_LABEL[t.kind]} (${t.urgency}) via ${t.channel}`,
      t.bookingId ? `Job: ${siteUrl(`/jobs/${t.bookingId}`)}` : "No job attached.",
      `Customer: ${who}`,
      "",
      t.summary,
    ],
    sms: `${flag}${KIND_LABEL[t.kind]}${t.bookingId ? ` #${t.bookingId}` : ""}: ${t.summary.slice(0, 140)}`,
  });
  return id;
}

/* ---------------------------------------------------------------- photos */

export const MAX_PHOTO_BYTES = 1_600_000;
export const MAX_PHOTOS = 4;

/** data:image/jpeg;base64,... → bytes. Only the formats the client downscaler emits. */
export function decodePhoto(dataUrl: string): { mime: string; buf: Buffer; sha: string } | null {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.byteLength < 200 || buf.byteLength > MAX_PHOTO_BYTES) return null;
  // Magic bytes, not just the claimed type — a renamed file is refused.
  const jpeg = buf[0] === 0xff && buf[1] === 0xd8;
  const png = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const webp = buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  if (!(jpeg || png || webp)) return null;
  return { mime: jpeg ? "image/jpeg" : png ? "image/png" : "image/webp", buf, sha: createHash("sha256").update(buf).digest("hex") };
}

/* ---------------------------------------------------------- speed bump */

/**
 * Per-visitor, per-bucket limiter. In-memory, so it dies with the function
 * instance — a speed bump against one abusive tab, not a wall. The hard caps
 * are the token limits and the one-review-per-booking constraint.
 */
const hits = new Map<string, { n: number; resetAt: number }>();

export function limited(bucket: string, max: number, windowMs = 60_000): boolean {
  let ip = "unknown";
  try {
    ip = getRequestIP({ xForwardedFor: true }) || "unknown";
  } catch {
    /* outside a request (tests) */
  }
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.resetAt) {
    hits.set(key, { n: 1, resetAt: now + windowMs });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  cur.n += 1;
  return cur.n > max;
}

/* ------------------------------------------------------- job links by phone */

const SERVICE_NAME: Record<string, string> = {
  "leaf-cleanup": "Leaf cleanup",
  "junk-removal": "Junk haul",
  "furniture-appliances": "Junk haul",
  "gutter-cleaning": "Gutter cleaning",
};

/**
 * Send a phone number's job links to the contact details ON THE BOOKING.
 * Never returns job data to the caller — whoever typed the number learns
 * nothing about who booked or when unless they hold that phone or inbox.
 * Returns how many jobs matched, for server-side logging only.
 */
export async function sendLinksForPhone(raw: string): Promise<number> {
  const phone = digitsPhone(raw).slice(-10);
  if (!isUsPhone(phone)) return 0;
  const sql = await careSql();
  const rows = await sql.query<{ id: number; phone: string; email: string | null; service: string; preferred_date: string | null }>(
    `select id, phone, email, service, preferred_date from bookings
      where right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = $1 and status <> 'hold'
      order by created_at desc limit 6`,
    [phone],
  );
  if (!rows.length) return 0;
  const lines: string[] = [];
  for (const r of rows) {
    const token = await ensureManageToken(sql, r.id);
    if (token) lines.push(`Job #${r.id} · ${SERVICE_NAME[r.service] ?? r.service}${r.preferred_date ? ` · ${r.preferred_date.slice(0, 10)}` : ""}: ${manageUrl(token)}`);
  }
  const email = rows.find((r) => r.email)?.email;
  const body = `Your Pick It Up E job links:\n\n${lines.join("\n")}\n\nEach link is private to your job — see the day, move it, or ask us anything.`;
  await Promise.all([
    email ? sendEmail(email, "Your Pick It Up E job links", body).catch(() => false) : Promise.resolve(false),
    process.env.TWILIO_SMS_ENABLED?.trim() === "true" ? sendSms(rows[0].phone, body.slice(0, 600)).catch(() => false) : Promise.resolve(false),
  ]);
  return rows.length;
}
