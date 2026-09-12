/**
 * Where a visitor came from, so the owner can see which door-hanger zone,
 * profile listing or channel actually books. The door hanger's QR is
 * `pickitupe.com/?s=dh`; the Business Profile link carries `?s=gbp`.
 *
 * Remembered per browser, not per page — the tag is on the landing URL and the
 * booking happens three pages later.
 */
const KEY = "pickitupe:source";

export function rememberSource() {
  if (typeof window === "undefined") return;
  try {
    const s = new URLSearchParams(window.location.search).get("s");
    if (s && /^[a-z0-9_-]{1,24}$/i.test(s)) window.localStorage.setItem(KEY, s.toLowerCase());
  } catch {
    // storage blocked — fine, the booking just goes untagged
  }
}

export function readSource(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(KEY) || undefined;
  } catch {
    return undefined;
  }
}
