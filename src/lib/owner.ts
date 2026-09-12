const DEFAULT_OWNER = "pickitupe@gmail.com";

/**
 * Who may open the owner board. The business inbox is always in; add more with
 * `OWNER_EMAILS` (comma-separated) in Netlify. `OWNER_NOTIFY_EMAIL` counts too
 * because whoever gets the booking alerts is the owner by definition.
 *
 * Server-side only — `process.env` does not exist in the browser. The client
 * hint is `looksLikeOwner()` below.
 */
export function ownerEmails() {
  const set = new Set<string>([DEFAULT_OWNER]);
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
  if (e === DEFAULT_OWNER) return true;
  const extra = (import.meta.env.VITE_OWNER_EMAILS || "")
    .split(",")
    .map((s: string) => s.trim().toLowerCase());
  return extra.includes(e);
}
