import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { GROK_PROVIDERS, authClient, authEnabled, signIn } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [mode, setMode] = useState<"create" | "in">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const go = "/status";
    try {
      if (mode === "create") {
        const { error: err } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: name.trim() || email.split("@")[0] || "Customer",
          callbackURL: go,
        });
        if (err) throw new Error(err.message || "Couldn't make the account.");
      } else {
        const { error: err } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: go,
        });
        if (err) throw new Error(err.message || "Email or password didn't match.");
      }
      window.location.href = go;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-md flex-1 px-4 py-12">
        <p className="kicker">Optional</p>
        <h1 className="mt-2 font-display text-4xl leading-none">
          {mode === "create" ? "Save your hauls." : "Welcome back."}
        </h1>
        <p className="mt-3 text-base text-muted">
          You can always look up a job with the phone you booked. An account just keeps the list
          for you.
        </p>

        {authEnabled ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={`h-12 rounded-full text-sm ${mode === "create" ? "bg-gold text-ink" : "border border-border"}`}
                onClick={() => setMode("create")}
              >
                Make an account
              </button>
              <button
                type="button"
                className={`h-12 rounded-full text-sm ${mode === "in" ? "bg-gold text-ink" : "border border-border"}`}
                onClick={() => setMode("in")}
              >
                I have one
              </button>
            </div>

            <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
              {mode === "create" ? (
                <label className="block text-sm font-medium text-muted">
                  Your name
                  <input
                    className="field mt-1 h-14 text-lg"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              ) : null}
              <label className="block text-sm font-medium text-muted">
                Email
                <input
                  className="field mt-1 h-14 text-lg"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-muted">
                Password
                <input
                  className="field mt-1 h-14 text-lg"
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "create" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                {mode === "create" ? (
                  <span className="mt-1 block text-xs text-muted">At least 8 characters.</span>
                ) : null}
              </label>
              {error ? <p className="text-sm text-gold">{error}</p> : null}
              <button
                type="submit"
                disabled={busy}
                className="btn-press h-14 rounded-full bg-fg text-base font-medium text-ink hover:bg-gold disabled:opacity-60"
              >
                {busy ? "One moment…" : mode === "create" ? "Create account" : "Sign in"}
              </button>
            </form>

            <p className="mt-8 text-center text-xs uppercase tracking-wider text-muted">or</p>
            <div className="mt-4 grid gap-2">
              {GROK_PROVIDERS.map((p) => (
                <Button
                  key={p.providerId}
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => signIn(p.providerId, { callbackURL: "/status" })}
                >
                  Continue with {p.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-8 text-sm text-muted">
            Sign-in is off right now. Book with your phone — we'll keep the date.
          </p>
        )}

        <p className="mt-8 text-sm text-muted">
          No account?{" "}
          <Link to="/status" className="text-gold hover:underline">
            Look up with your phone
          </Link>{" "}
          or{" "}
          <Link to="/call" className="text-gold hover:underline">
            shop line
          </Link>
          .
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
