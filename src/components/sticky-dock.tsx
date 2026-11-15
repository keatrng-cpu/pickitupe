import { Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SITE_TEL } from "@/lib/site-phone";

export function StickyDock() {
  return (
    <nav className="dock" aria-label="Book or call">
      <Link
        to="/call"
        className="btn-press inline-flex h-12 flex-1 items-center justify-center rounded-full bg-fg text-sm font-medium text-ink"
      >
        Book
      </Link>
      <a
        href={SITE_TEL}
        className="btn-press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-fg"
      >
        <Phone className="size-4" />
        Call
      </a>
    </nav>
  );
}