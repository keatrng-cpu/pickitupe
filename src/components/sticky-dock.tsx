import { Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

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
        href="tel:7012133969"
        className="btn-press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-fg"
      >
        <Phone className="size-4" />
        Call
      </a>
    </nav>
  );
}