/**
 * The site's one public phone number. Header, footer, JSON-LD, error toasts,
 * emails, the AI concierge's facts and the share card read it from here, so
 * switching numbers (e.g. to the Twilio line once it answers) is this file.
 *
 * Not the door hanger: `door-hanger.tsx` and `print/DOOR-HANGER.md` show what
 * was actually printed, and stay as printed.
 */
export const SITE_PHONE_DIGITS = "7012133969";

/**
 * The Twilio line (ElevenLabs voice agent) the business is moving to. Owner,
 * Nov 13: 701-213-3969 is not the number going forward. Null until it is
 * bought AND answering — then put its ten digits here and change
 * SITE_PHONE_DIGITS to match. Print (scripts/make-winter-print.mjs) uses only
 * this; with it null, every proof says "NEW NUMBER" and is stamped not
 * print-ready, so a retired number can't get printed by accident.
 */
export const NEW_LINE_DIGITS: string | null = null;

export function formatPhone(digits: string) {
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export const SITE_PHONE = `${SITE_PHONE_DIGITS.slice(0, 3)}-${SITE_PHONE_DIGITS.slice(3, 6)}-${SITE_PHONE_DIGITS.slice(6)}`;
export const SITE_TEL = `tel:${SITE_PHONE_DIGITS}`;
export const SITE_SMS = `sms:${SITE_PHONE_DIGITS}`;
export const SITE_E164 = `+1-${SITE_PHONE}`;
