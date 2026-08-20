import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

const PHONE = "218-779-2553";

function Mark() {
  return (
    <span className="grid size-8 place-items-center rounded-full bg-sioux text-fg">
      <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
        <path d="M12 2c.4 1.8 1.4 3.2 3 4.2-.2 1.3.3 2.4 1.4 3.1 1.2.2 2.1-.2 2.8-1.1.8 1.6 1.9 2.8 3.3 3.4-1.1 1.2-1.5 2.6-1.2 4.1.9.9 2 .9 3.2.3-.3 2-1.4 3.5-3.2 4.5.2 1.3-.3 2.4-1.5 3.1-1.3.1-2.2-.4-2.8-1.4-.8 1.2-2 2-3.5 2.3L12 22l-.5-2.5c-1.5-.3-2.7-1.1-3.5-2.3-.6 1-1.5 1.5-2.8 1.4-1.2-.7-1.7-1.8-1.5-3.1C1.6 16.4.5 14.9.2 12.9c1.2.6 2.3.6 3.2-.3.3-1.5-.1-2.9-1.2-4.1C3.6 7.9 4.7 6.7 5.5 5.1c.7.9 1.6 1.3 2.8 1.1 1.1-.7 1.6-1.8 1.4-3.1C11.3 2.2 11.6 2 12 2z" />
      </svg>
    </span>
  );
}

export function SiteHeader() {
  const { user, isPending } = useCurrentUserState();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 text-fg">
          <Mark />
          <span className="font-display text-lg tracking-wide">Pick It Up E</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          <a href="/#services" className="hover:text-fg">
            Services
          </a>
          <a href="/#rules" className="hover:text-fg">
            Leaf rules
          </a>
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
            <div className="size-8 animate-pulse rounded-full bg-fg/10" />
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
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-deep">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-xl">Pick It Up E</p>
          <p className="mt-1 text-sm text-muted">Grand Forks, ND</p>
        </div>
        <a className="text-fg hover:text-gold" href="tel:2187792553">
          218-779-2553
        </a>
      </div>
    </footer>
  );
}
