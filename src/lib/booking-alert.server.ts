import {
  bookingAlertSubject,
  bookingAlertText,
  type BookingAlertInput,
} from "@/lib/booking-alert";

/**
 * Email the owner when a booking lands. Server-only.
 *
 * Reuses the Resend sender already verified for the statutory renewal
 * notices — same API key, same verified from-domain — so there is nothing new
 * to configure. `OWNER_NOTIFY_EMAIL` overrides the destination; the default is
 * the business inbox. Reply-To is set to the CUSTOMER's email when they gave
 * one, so hitting reply on the alert answers the customer directly.
 *
 * Contract: this NEVER throws and NEVER fails the booking. The row is already
 * saved by the time this runs; a missed email is a smaller failure than a
 * lost lead. It is awaited (not fire-and-forget) because a serverless
 * instance can be frozen the instant the response is sent, which would make a
 * detached promise silently never run — but it is capped by a timeout so a
 * slow provider cannot hang the customer's submit.
 */

const DEFAULT_TO = "pickitupe@gmail.com";
const TIMEOUT_MS = 4000;

export type OwnerAlertResult = { sent: true } | { sent: false; reason: string };

export async function notifyOwnerOfBooking(
  booking: BookingAlertInput,
): Promise<OwnerAlertResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RENEWAL_FROM_EMAIL?.trim();
  const to = process.env.OWNER_NOTIFY_EMAIL?.trim() || DEFAULT_TO;
  if (!apiKey || !from) {
    // Not an error: the site works without email. It is logged so the owner
    // can see why alerts aren't arriving, and nothing else.
    console.warn("[booking-alert] RESEND_API_KEY / RENEWAL_FROM_EMAIL not set — no owner alert sent");
    return { sent: false, reason: "sender not configured" };
  }

  const site = process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "") || "https://pickitupe.com";
  const customerEmail = booking.email?.trim();

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: bookingAlertSubject(booking),
        text: bookingAlertText(booking, `${site}/jobs`),
        ...(customerEmail ? { reply_to: customerEmail } : {}),
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`[booking-alert] resend ${res.status}: ${detail}`);
      return { sent: false, reason: `provider returned ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    console.error("[booking-alert] failed:", err);
    return { sent: false, reason: err instanceof Error ? err.message : "send failed" };
  }
}
