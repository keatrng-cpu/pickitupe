import { Link } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { HashScroll, scrollToHash } from "@/components/hash-scroll";
import { HaulTicker } from "@/components/haul-ticker";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { looksLikeOwner } from "@/lib/owner";
import { Button } from "@/components/ui/button";

const PHONE = "701-213-3969";

type NavItem =
  | { to: "/"; hash: "haul" | "rates" | "faq"; label: string }
  | { to: "/about" | "/landlords" | "/plan" | "/call" | "/book"; label: string };

const NAV: NavItem[] = [
  { to: "/", hash: "haul", label: "Haul" },
  { to: "/", hash: "rates", label: "Rates" },
  { to: "/about", label: "About" },
  { to: "/landlords", label: "Landlords" },
  { to: "/plan", label: "Plan" },
  { to: "/", hash: "faq", label: "FAQ" },
  { to: "/call", label: "Shop line" },
  { to: "/book", label: "Form" },
];

function Mark() {
  return (
    <img
      src="/logo.png"
      alt=""
      width={40}
      height={40}
      className="size-10 rounded-[0.85rem] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-fg)_18%,transparent)]"
    />
  );
}

function NavLink({
  item,
  className,
  onClick,
}: {
  item: NavItem;
  className: string;
  onClick?: () => void;
}) {
  const hash = "hash" in item ? item.hash : undefined;
  return (
    <Link
      to={item.to}
      hash={hash}
      className={className}
      onClick={() => {
        onClick?.();
        if (hash) window.setTimeout(() => scrollToHash(hash), 40);
      }}
    >
      {item.label}
    </Link>
  );
}

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
      <HashScroll />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:text-ink"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2.5 text-fg">
          <Mark />
          <span className="font-display text-lg tracking-wide">Pick It Up E</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink key={item.label} item={item} className="hover:text-fg" />
          ))}
          {user ? (
            looksLikeOwner(user.primaryEmail) ? (
              <Link to="/jobs" className="hover:text-fg">
                Jobs
              </Link>
            ) : (
              <Link to="/status" className="hover:text-fg">
                Hauls
              </Link>
            )
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${PHONE.replaceAll("-", "")}`}
            className="hidden h-11 items-center gap-2 rounded-full border border-border px-3 text-sm text-fg hover:bg-fg/8 lg:inline-flex"
          >
            <Phone className="size-4" />
            {PHONE}
          </a>
          <Button asChild size="md" variant="cream">
            <Link to="/call">
              <Phone className="size-4" />
              Shop line
            </Link>
          </Button>
          {isPending ? (
            <div className="size-8 animate-pulse rounded-full bg-fg/10" aria-hidden="true" />
          ) : (
            <>
              <SignedIn>
                <UserButton />
              </SignedIn>
              <SignedOut>
                <Link
                  to="/login"
                  className="inline-flex h-11 items-center rounded-full border border-border px-3 text-sm text-fg hover:bg-fg/8"
                >
                  Sign in
                </Link>
              </SignedOut>
            </>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-border text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      <HaulTicker />
      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-bg px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                className="rounded-xl px-3 py-3 text-fg hover:bg-fg/8"
                onClick={() => setOpen(false)}
              />
            ))}
            <Link
              to="/login"
              className="rounded-xl px-3 py-3 text-fg hover:bg-fg/8"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/status"
              className="rounded-xl px-3 py-3 text-fg hover:bg-fg/8"
              onClick={() => setOpen(false)}
            >
              Your hauls
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-deep">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-[1.2fr_1fr]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="size-10 rounded-[0.85rem]"
          />
          <div>
            <p className="font-display text-xl">Pick It Up E</p>
            <p className="mt-1 text-sm text-muted">Grand Forks, ND</p>
          </div>
        </div>
        <nav className="flex flex-wrap content-start items-center gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          <Link to="/about" className="text-muted hover:text-gold">
            About
          </Link>
          <Link to="/landlords" className="text-muted hover:text-gold">
            Landlords
          </Link>
          <Link to="/call" className="text-muted hover:text-gold">
            Shop line
          </Link>
          <Link to="/status" className="text-muted hover:text-gold">
            Your hauls
          </Link>
          <Link to="/login" className="text-muted hover:text-gold">
            Sign in
          </Link>
          <Link to="/plan" className="text-muted hover:text-gold">
            Plan
          </Link>
          <Link to="/" hash="faq" className="text-muted hover:text-gold">
            FAQ
          </Link>
          <a className="text-fg hover:text-gold" href="tel:7012133969">
            701-213-3969
          </a>
        </nav>
      </div>
    </footer>
  );
}
