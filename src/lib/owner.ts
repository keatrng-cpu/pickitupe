const DEFAULT_OWNER = "pickitupe@gmail.com";

export function ownerEmails() {
  const extra = process.env.OWNER_NOTIFY_EMAIL?.trim().toLowerCase();
  const set = new Set<string>([DEFAULT_OWNER]);
  if (extra) set.add(extra);
  return set;
}

export function isOwnerEmail(email: string | null | undefined) {
  if (!email) return false;
  return ownerEmails().has(email.trim().toLowerCase());
}

/** Client-side hint only. The server still gates /jobs. */
export function looksLikeOwner(email: string | null | undefined) {
  return (email || "").trim().toLowerCase() === DEFAULT_OWNER;
}
