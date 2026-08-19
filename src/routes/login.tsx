import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { FallingLeaves } from "@/components/falling-leaves";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="relative min-h-screen bg-bg">
      <FallingLeaves />
      <SiteHeader />
      <main className="mx-auto grid max-w-md place-items-center px-4 py-20">
        <div className="card-green w-full rounded-3xl p-8">
          <p className="text-xs tracking-[0.28em] text-gold">OWNER</p>
          <h1 className="mt-2 font-display text-3xl">Sign in to jobs</h1>
          <p className="mt-2 text-sm text-muted">
            Incoming bookings live on the jobs board.
          </p>
          <div className="mt-6 space-y-3">
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
              <p className="text-sm text-muted">Sign-in is disabled.</p>
            )}
          </div>
          <Link to="/" className="mt-6 inline-block text-sm text-gold">
            Back to the site
          </Link>
        </div>
      </main>
    </div>
  );
}
