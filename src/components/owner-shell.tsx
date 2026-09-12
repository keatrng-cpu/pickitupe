import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

/**
 * Chrome for every owner page: sign-in gate, the four tabs, and a consistent
 * header. Owner-ness is decided on the server (isOwnerEmail) — the page calls
 * its loader, and a "Forbidden" turns into the NotOwner panel instead of a
 * bounce to /status.
 */

const TABS = [
  { to: "/jobs", label: "Board" },
  { to: "/jobs/customers", label: "Customers" },
  { to: "/jobs/books", label: "Books & taxes" },
] as const;

export function OwnerShell({
  kicker,
  title,
  aside,
  children,
  forbidden,
  wide,
}: {
  kicker: string;
  title: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  forbidden?: boolean;
  wide?: boolean;
}) {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPending) {
    return (
      <div className="relative z-10 min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-5xl px-4 py-16 text-muted">Loading…</div>
      </div>
    );
  }
  if (!user) return <RedirectToSignIn />;

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main id="main" className={cn("mx-auto px-4 py-10", wide ? "max-w-6xl" : "max-w-5xl")}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.28em] text-gold">{kicker}</p>
            <h1 className="mt-2 font-display text-4xl">{title}</h1>
          </div>
          {aside}
        </div>

        <nav aria-label="Owner sections" className="mt-6 flex flex-wrap gap-2 border-b border-border pb-3">
          {TABS.map((t) => {
            const active = t.to === "/jobs" ? pathname === "/jobs" || /^\/jobs\/\d+$/.test(pathname) : pathname.startsWith(t.to);
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition",
                  active ? "bg-fg text-ink" : "border border-border text-muted hover:border-gold hover:text-gold",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {forbidden ? <NotOwner email={user.primaryEmail} /> : children}
      </main>
      <SiteFooter />
    </div>
  );
}

function NotOwner({ email }: { email: string | null }) {
  return (
    <div className="card-green mt-8 rounded-3xl p-8">
      <h2 className="font-display text-2xl">This isn't the owner account</h2>
      <p className="mt-3 max-w-prose text-muted">
        You're signed in as <span className="text-fg">{email ?? "an account with no email"}</span>. The board opens
        for <code className="text-gold">pickitupe@gmail.com</code> and any address listed in the{" "}
        <code className="text-gold">OWNER_EMAILS</code> environment variable on Netlify. Sign out, then create the
        owner account at <Link to="/login" className="text-gold">/login</Link> with one of those addresses — or add
        this one to <code>OWNER_EMAILS</code> and redeploy.
      </p>
    </div>
  );
}

/**
 * Load owner data with the Forbidden case separated from real errors. Pages
 * pass a stable loader (wrap in useCallback).
 */
export function useOwnerLoader<T>(loader: () => Promise<T>, enabled = true) {
  const [data, setData] = useState<T | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    loader()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (/forbidden/i.test(msg)) setForbidden(true);
        else setError(msg);
      });
    return () => {
      alive = false;
    };
  }, [loader, enabled, tick]);

  return { data, forbidden, error, reload, setData };
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

export function money(cents: number | null | undefined, opts: { sign?: boolean } = {}) {
  const n = (cents ?? 0) / 100;
  const s = n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n % 1 === 0 ? 0 : 2 });
  return opts.sign && n > 0 ? `+${s}` : s;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "gold" | "warn" | "ok" }) {
  return (
    <div className="card-green rounded-2xl p-4">
      <p className="text-[11px] tracking-[0.2em] text-muted uppercase">{label}</p>
      <p className={cn("mt-1 font-display text-2xl tabular-nums", tone === "gold" && "text-gold", tone === "warn" && "text-gold", tone === "ok" && "text-sioux")}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export const inputCls =
  "h-11 w-full rounded-xl border border-border bg-bg-deep px-3 text-sm text-fg placeholder:text-muted/60 focus-visible:outline-2 focus-visible:outline-gold";
export const btnCls =
  "btn-press inline-flex h-11 items-center justify-center rounded-full bg-fg px-4 text-sm font-medium text-ink transition hover:bg-gold disabled:opacity-50";
export const ghostBtnCls =
  "btn-press inline-flex h-11 items-center justify-center rounded-full border border-border px-4 text-sm text-fg transition hover:border-gold hover:text-gold disabled:opacity-50";

export function todayLocalISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  const thisYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: thisYear ? undefined : "numeric" });
}

export function fmtWhen(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
