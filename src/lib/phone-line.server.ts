import { createHmac, timingSafeEqual } from "node:crypto";
import { getSql, type Sql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { sendEmail, sendSms } from "@/lib/customer-notify.server";
import { leadEmail } from "@/lib/email-theme";
import { PHONE } from "@/lib/messages";
import { digitsPhone, formatPhone, isUsPhone } from "@/lib/phone";

if (typeof window !== "undefined") {
  throw new Error("phone-line.server.ts is server-only");
}

/**
 * The missed-call line.
 *
 * The owner's cell (701-213-3969, the number on the door hangers) has carrier
 * "forward when unanswered / busy" pointed at a Twilio number. A call Keaton
 * can't take from the truck lands here instead of in carrier voicemail:
 *
 *   1. /api/voice/missed  — Twilio asks what to do. We open a lead on the
 *      board, TEXT the caller the booking link right away, and answer with a
 *      short greeting + record a message.
 *   2. /api/voice/after   — the recording ended (or they hung up). Thank them.
 *      No message → alert the owner now; message → wait for the transcript.
 *   3. /api/voice/voicemail — Twilio's transcript. Goes onto the lead, and the
 *      owner gets it by text and email with a tap-to-call-back link.
 *   4. /api/sms/inbound   — the caller replies to the text. Logged on the lead
 *      and forwarded to the owner's cell, so the thread keeps going in Messages.
 *
 * Every request is checked against Twilio's X-Twilio-Signature first — these
 * URLs are public, and an unsigned POST could otherwise mint leads or spend
 * SMS money. The lead is a `bookings` row (status new, source "call", service
 * "other") so it shows on /jobs and in the customers follow-up queue like any
 * other lead, with the same "answer within the hour" nudge.
 */

export const TWILIO_TIMEOUT_MS = 6000;

export function twilioConfigured() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID?.trim() && process.env.TWILIO_AUTH_TOKEN?.trim() && process.env.TWILIO_FROM?.trim());
}

/** The URL Twilio actually requested, rebuilt from our public origin — the signature covers it. */
export function publicUrl(path: string, search = "") {
  const base = (process.env.BETTER_AUTH_URL || process.env.VITE_SITE_URL || "https://pickitupe.com").trim().replace(/\/$/, "");
  return `${base}${path}${search}`;
}

/**
 * Twilio signs: HMAC-SHA1(authToken, fullUrl + every POST param's key+value in
 * sorted key order), base64. Query string stays in the URL; body params are
 * appended. https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function verifyTwilioSignature(fullUrl: string, params: Record<string, string>, signature: string | null) {
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!token || !signature) return false;
  const data = fullUrl + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", token).update(data, "utf8").digest();
  let given: Buffer;
  try {
    given = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Parse Twilio's form-encoded POST and check the signature in one go. */
export async function readTwilioPost(request: Request, path: string): Promise<Record<string, string> | null> {
  const raw = await request.text();
  const params: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(raw)) params[k] = v;
  const url = new URL(request.url);
  const ok = verifyTwilioSignature(publicUrl(path, url.search), params, request.headers.get("x-twilio-signature"));
  if (!ok) {
    console.warn(`[phone-line] bad signature on ${path}`);
    return null;
  }
  return params;
}

function escXml(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function twiml(inner: string) {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`, {
    status: 200,
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

/** Amazon Polly voice through Twilio — warm, not robotic. */
export const VOICE = "Polly.Matthew-Neural";

export function say(text: string) {
  return `<Say voice="${VOICE}">${escXml(text)}</Say>`;
}

/** The greeting the caller hears when Keaton can't pick up. */
export const GREETING =
  "Hey, you've reached Keaton at Pick It Up E — leaves, junk and gutters in Grand Forks. " +
  "I'm on a job right now, so I just texted you a link to grab a day on the calendar; it takes about two minutes. " +
  "Or leave your address and what you need after the tone and I'll call you back within the hour.";

export const AFTER_MESSAGE = "Got it — thanks. Check your texts for the booking link, and I'll call you back shortly. Talk soon.";

/** What the caller receives by text, from the Twilio number. */
export function textBack(site: string) {
  return (
    `Pick It Up E — sorry I missed you, I'm on a job. ` +
    `Fastest way onto the calendar: ${site}/book?s=call (2 min, $50 holds your day, comes off the bill). ` +
    `Or reply here with your address + what you need and I'll call back within the hour. — Keaton, ${PHONE}`
  );
}

async function ready(): Promise<Sql> {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  return sql;
}

export type CallLead = { id: number; name: string; phone: string; notes: string | null; created: boolean };

/**
 * One lead per caller per week: a second call from the same number in seven
 * days lands on the same row instead of cluttering the board.
 */
export async function findOrCreateCallLead(from: string, note: string): Promise<CallLead | null> {
  const digits = digitsPhone(from);
  if (!isUsPhone(digits)) return null; // blocked / international / anonymous — nothing to text
  const sql = await ready();
  const pretty = formatPhone(digits);
  const existing = await sql.query<{ id: number; name: string; phone: string; notes: string | null }>(
    `select id, name, phone, notes from bookings
      where regexp_replace(phone, '\\D', '', 'g') in ($1, $2)
        and status in ('new', 'quoted', 'hold')
        and created_at > now() - interval '7 days'
      order by created_at desc limit 1`,
    [digits, `1${digits}`],
  );
  if (existing[0]) {
    await logEvent(sql, existing[0].id, "call", note);
    return { ...existing[0], created: false };
  }
  const [row] = await sql.query<{ id: number; name: string; phone: string; notes: string | null }>(
    `insert into bookings (name, phone, address, service, notes, status, source)
     values ($1, $2, $3, 'other', $4, 'new', 'call') returning id, name, phone, notes`,
    [`Caller ${pretty}`, pretty, "Called in — address not taken yet", note],
  );
  await logEvent(sql, row.id, "call", note);
  return { ...row, created: true };
}

export async function appendLeadNote(id: number, line: string) {
  const sql = await ready();
  await sql.query(`update bookings set notes = concat_ws(E'\\n', nullif(notes, ''), $2::text) where id = $1`, [id, line]);
}

/** Owner alert: text to the cell (he's on a job, phone in pocket) + the themed email with a call-back button. */
export async function alertOwner(input: { channel: string; phone: string; transcript?: string | null; recordingUrl?: string | null; bookingId?: number | null }) {
  const when = new Date().toLocaleString("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const site = publicUrl("");
  const jobsUrl = input.bookingId ? `${site}/jobs/${input.bookingId}` : `${site}/jobs`;
  const doc = leadEmail({ ...input, when, jobsUrl });
  const ownerCell = (process.env.OWNER_CELL || PHONE).trim();
  const smsBody =
    `${input.channel} ${input.phone}` +
    (input.transcript ? ` — "${input.transcript.slice(0, 220)}${input.transcript.length > 220 ? "…" : ""}"` : " — no message, they got the booking text") +
    ` · ${jobsUrl}`;
  const [sms, mail] = await Promise.all([
    sendSms(ownerCell, smsBody),
    sendEmail(process.env.OWNER_NOTIFY_EMAIL?.trim() || "pickitupe@gmail.com", doc.subject, doc.text, doc.html),
  ]);
  return { sms, mail };
}

export { sendSms };
