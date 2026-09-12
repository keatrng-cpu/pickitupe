import { formatDayLong } from "@/lib/schedule";
import { PHONE, REVIEW_URL } from "@/lib/messages";
import type { EmailDoc } from "@/lib/email-theme";

if (typeof window !== "undefined") {
  throw new Error("customer-notify.server.ts is server-only");
}

const TIMEOUT_MS = 4000;

function e164(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  return "";
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  const from = process.env.TWILIO_FROM?.trim();
  if (!sid || !token || !from) return false;
  const dest = e164(to);
  if (!dest) return false;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: dest, From: from, Body: body }),
      signal: ac.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Resend, same verified sender as the owner alerts. `html` is the themed
 * version from email-theme.ts; `text` always goes along as the fallback.
 * Reply-To is the owner's real inbox (RENEWAL_REPLY_TO, else the business
 * Gmail) so "reply to this email" in the copy actually reaches Keaton.
 */
export async function sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RENEWAL_FROM_EMAIL?.trim();
  if (!apiKey || !from || !to.includes("@")) return false;
  const replyTo = process.env.RENEWAL_REPLY_TO?.trim() || process.env.OWNER_NOTIFY_EMAIL?.trim() || "pickitupe@gmail.com";
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text, ...(html ? { html } : {}), reply_to: replyTo }),
      signal: ac.signal,
    });
    if (!res.ok) console.error(`[customer-notify] resend ${res.status}: ${await res.text()}`);
    return res.ok;
  } catch (err) {
    console.error("[customer-notify] email failed:", err);
    return false;
  } finally {
    clearTimeout(t);
  }
}

export function bookedMessage(input: {
  name: string;
  id: number;
  day: string | null;
  range?: string | null;
  deposit: number;
}) {
  const first = (input.name || "there").trim().split(/\s+/)[0];
  const when = input.day ? formatDayLong(input.day) : "first open day";
  const range = input.range ? ` Range ${input.range}.` : "";
  return `You're booked, ${first}. Job #${input.id}. ${when}.${range} $${input.deposit} deposit is on the card and comes off the invoice. I'll text the morning of. — Pick It Up E, ${PHONE}`;
}

export function doneReviewMessage(name: string, estimate?: string | null) {
  const first = (name || "there").trim().split(/\s+/)[0];
  const bill = estimate ? ` Invoice is ${estimate} less your deposit.` : "";
  return `All done, ${first} — load's gone.${bill} If we did right by you, tap this and leave a Google review — takes 30 seconds. ${REVIEW_URL} — Pick It Up E`;
}

/**
 * Text AND email, not one or the other: the text is the thing they see in the
 * driveway, the email is the one they search for in October. Either channel
 * missing (no Twilio yet, no email given) is fine — whatever can go, goes.
 */
export async function notifyCustomer(phone: string, email: string | null | undefined, body: string, rich?: EmailDoc) {
  const sms = await sendSms(phone, body);
  let mail = false;
  if (email) {
    mail = rich ? await sendEmail(email, rich.subject, rich.text, rich.html) : await sendEmail(email, "Pick It Up E — you're booked", body);
  }
  const via = sms && mail ? ("sms+email" as const) : sms ? ("sms" as const) : mail ? ("email" as const) : ("none" as const);
  return { sent: sms || mail, via };
}
