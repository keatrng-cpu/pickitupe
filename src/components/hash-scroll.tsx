import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

/** Sticky header (4rem) + haul ticker (~2.75rem). */
export const HASH_OFFSET = "7.5rem";

export function scrollToHash(raw: string | undefined) {
  if (typeof document === "undefined") return false;
  const id = (raw || "").replace(/^#/, "");
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;
  if (el instanceof HTMLDetailsElement) el.open = true;
  el.querySelectorAll("details").forEach((d) => {
    d.open = true;
  });
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  return true;
}

/** Lands Haul / Rates / FAQ on the section, even after a client-side hop home. */
export function HashScroll() {
  const hash = useRouterState({ select: (s) => s.location.hash });
  useEffect(() => {
    const id = (hash || window.location.hash || "").replace(/^#/, "");
    if (!id) return;
    if (scrollToHash(id)) return;
    let n = 0;
    const t = window.setInterval(() => {
      n += 1;
      if (scrollToHash(id) || n > 24) window.clearInterval(t);
    }, 50);
    return () => window.clearInterval(t);
  }, [hash]);
  return null;
}
