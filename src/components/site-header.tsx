import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { HaulTicker } from "@/components/haul-ticker";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

const PHONE = "701-213-3969";

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

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg">
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
          <a href="/#haul" className="hover:text-fg">
            Haul
          </a>
          <a href="/#rates" className="hover:text-fg">
            Rates
          </a>
          <Link to="/about" className="hover:text-fg">
            About
          </Link>
          <Link to="/landlords" className="hover:text-fg">
            Landlords
          </Link>
          <Link to="/plan" className="hover:text-fg">
            Plan
          </Link>
          <a href="/#faq" className="hover:text-fg">
            FAQ
          </a>
          <Link to="/book" className="hover:text-fg">
            Book
          </Link>
          {user ? (
            <Link to="/jobs" className="hover:text-fg">
              Jobs
            </Link>
          ) : null}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${PHONE.replaceAll("-", "")}`}
            className="hidden h-11 items-center gap-2 rounded-full border border-border px-3 text-sm text-fg hover:bg-fg/8 sm:inline-flex"
          >
            <Phone className="size-4" />
            {PHONE}
          </a>
          <Button asChild size="md" variant="cream">
            <Link to="/book">Book</Link>
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
                  className="hidden text-sm text-muted hover:text-fg md:inline"
                >
                  Owner
                </Link>
              </SignedOut>
            </>
          )}
        </div>
      </div>
      <HaulTicker />
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
          <Link to="/plan" className="text-muted hover:text-gold">
            Plan
          </Link>
          <a href="/#faq" className="text-muted hover:text-gold">
            FAQ
          </a>
          <a className="text-fg hover:text-gold" href="tel:7012133969">
            701-213-3969
          </a>
        </nav>
      </div>
    </footer>
  );
}
