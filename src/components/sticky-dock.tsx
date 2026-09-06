import { Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function StickyDock() {
  return (
    <nav className="dock" aria-label="Shop line or form">
      <Link
        to="/call"
        className="btn-press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-fg text-sm font-medium text-ink"
      >
        <Phone className="size-4" />
        Shop line
      </Link>
      <Link
        to="/book"
        className="btn-press inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border text-sm font-medium text-fg"
      >
        Form
      </Link>
    </nav>
  );
}
