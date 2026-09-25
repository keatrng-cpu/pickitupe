
/**
 * Who may open the owner board: `OWNER_EMAILS` (comma-separated) in Netlify,
 * plus `OWNER_NOTIFY_EMAIL` — whoever gets the booking alerts is the owner by
 * definition.
 *
 * There is deliberately NO hard-coded address. This used to include
 * pickitupe@gmail.com, which was never a mailbox the owner controlled — in a
 * public repo that is an owner login for whoever registers the Gmail first.
 * Unset env = nobody is owner (fail closed), except the local demo below.
 *
 * Server-side only — `process.env` does not exist in the browser. The client
 * hint is `looksLikeOwner()` below.
 */
export function ownerEmails() {
  const set = new Set<string>();
  const add = (raw: string | undefined) =>
    (raw || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .forEach((e) => set.add(e));
  add(process.env.OWNER_EMAILS);
  add(process.env.OWNER_NOTIFY_EMAIL);
  return set;
}

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) {
    // Local demo (VITE_AUTH_ENABLED=false, no DATABASE_URL): the shared dev
    // user has no email. Mirrors requireUserId()'s fail-closed rule — never
    // true when a real database is configured.
    return (
      process.env.VITE_AUTH_ENABLED === "false" && !(process.env.DATABASE_URL || "").trim()
    );
  }
  return ownerEmails().has(email.trim().toLowerCase());
}

/** Client-side hint only. The server still gates /jobs. */
export function looksLikeOwner(email: string | null | undefined) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return false;
  const extra = (import.meta.env.VITE_OWNER_EMAILS || "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase());
  return extra.includes(e);
}

/**
 * Where owner alerts (bookings, tickets, unhappy reviews, missed calls) and
 * customer replies go: OWNER_NOTIFY_EMAIL, else the first OWNER_EMAILS entry.
 * Null when neither is set — callers skip the email rather than guess.
 */
export function ownerInbox(): string | null {
  const direct = process.env.OWNER_NOTIFY_EMAIL?.trim();
  if (direct) return direct;
  const first = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((x) => x.trim())
    .find((x) => x.includes("@"));
  return first || null;
}
