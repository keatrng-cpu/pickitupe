import { timingSafeEqual } from "node:crypto";
import { careSql, ensureManageToken, manageUrl } from "@/lib/care.server";
import { notifyCustomer } from "@/lib/customer-notify.server";
import { reminderEmail } from "@/lib/email-theme";
import { logEvent } from "@/lib/owner-schema";
import { formatDayLong, todayISO } from "@/lib/schedule";

if (typeof window !== "undefined") {
  throw new Error("reminders.server.ts is server-only");
}

/** Constant-time compare so the secret can't be learned a byte at a time. */
export function cronAuthorized(given: string | null): boolean {
  const want = process.env.CRON_SECRET?.trim();
  if (!want || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
}

function tomorrowISO() {
  const [y, m, d] = todayISO().split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/**
 * The day-before reminder. Every scheduled job on tomorrow's date that hasn't
 * been reminded gets a text (when the line can send) and the themed email,
 * then `reminded_at` is stamped. The stamp is claimed BEFORE sending, so two
 * overlapping runs can't double-send; a failed send is logged on the job.
 */
export async function sendDayBeforeReminders() {
  const sql = await careSql();
  const day = tomorrowISO();
  const due = await sql.query<{ id: number; name: string; phone: string; email: string | null; service: string; address: string }>(
    `update bookings set reminded_at = now()
      where status = 'scheduled' and left(preferred_date, 10) = $1 and reminded_at is null
      returning id, name, phone, email, service, address`,
    [day],
  );
  let delivered = 0;
  for (const b of due) {
    const token = await ensureManageToken(sql, b.id);
    const link = token ? manageUrl(token) : null;
    const first = (b.name || "there").trim().split(/\s+/)[0];
    const sms = `Hey ${first} — Pick It Up E is coming tomorrow, ${formatDayLong(day)}. Keaton texts a window in the morning.${link ? ` Something changed? ${link}` : ""}`;
    const res = await notifyCustomer(b.phone, b.email, sms, reminderEmail({ id: b.id, name: b.name, service: b.service, day, address: b.address, manageUrl: link }));
    if (res.sent) delivered += 1;
    await logEvent(sql, b.id, res.sent ? "email" : "system", res.sent ? `Day-before reminder sent (${res.via})` : "Day-before reminder: no channel could send (no email on file, texting off)");
  }
  return { day, due: due.length, delivered };
}
