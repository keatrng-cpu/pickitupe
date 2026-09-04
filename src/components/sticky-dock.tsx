import { Phone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PHONE } from "@/lib/messages";

export function StickyDock() {
  const tel = PHONE.replaceAll("-", "");
  return (
    <div className="dock">
      <a
        href={`tel:${tel}`}
        className="btn-press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-fg"
      >
        <Phone className="size-4" />
        Call
      </a>
      <Link
        to="/book"
        className="btn-press inline-flex h-12 flex-1 items-center justify-center rounded-full bg-fg text-sm font-medium text-ink"
      >
        Book
      </Link>
    </div>
  );
}