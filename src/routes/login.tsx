import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          {/* The page was a lone card floating in flat green. Anchor it with
              the same art the rest of the site is built on. */}
          <div className="hidden lg:block">
            <p className="kicker">Owner access</p>
            <h1 className="mt-3 font-display text-5xl leading-[1.05]">
              The board,
              <span className="mt-1 block italic text-gold">not the yard.</span>
            </h1>
            <p className="mt-5 max-w-sm text-muted">
              Every booking from the site lands here — sized, quoted, and
              grouped by the day you're already on that block.
            </p>
            <img
              src="/haul-truck.webp"
              alt=""
              className="mt-8 w-full max-w-md drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)]"
            />
          </div>

          <div className="card-green mx-auto w-full max-w-sm rounded-3xl p-8">
            <p className="kicker lg:hidden">Owner</p>
            <h2 className="mt-2 font-display text-3xl lg:mt-0">
              Sign in to jobs
            </h2>
            <p className="mt-2 text-sm text-muted">
              Incoming bookings live on the jobs board.
            </p>

            <div className="mt-7 space-y-3">
              {authEnabled ? (
                GROK_PROVIDERS.map((p) => (
                  <Button
                    key={p.providerId}
                    type="button"
                    variant="cream"
                    className="w-full"
                    onClick={() => signIn(p.providerId, { callbackURL: "/jobs" })}
                  >
                    Continue with {p.label}
                  </Button>
                ))
              ) : (
                <p className="rounded-xl border border-border bg-bg-deep/50 p-3 text-sm text-muted">
                  Sign-in is disabled in this environment.
                </p>
              )}
            </div>

            <div className="mt-7 border-t border-border pt-5">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-gold hover:text-fg"
              >
                <ArrowLeft className="size-3.5" />
                Back to the site
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
