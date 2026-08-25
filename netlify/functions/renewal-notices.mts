import type { Config } from "@netlify/functions";

/**
 * Daily trigger for the NDCC ch. 51-37 pre-renewal notices.
 *
 * Deliberately thin: it only pings the app's own endpoint, which owns the
 * database client, the queries, and the notice copy. Duplicating any of that
 * here would mean two implementations of a legal obligation drifting apart.
 *
 * Runs daily rather than monthly because the statute's window is 30-60 days
 * and the job targets the middle of it. A daily sweep means a single failed
 * run costs a day of slack, not compliance.
 */
export default async function handler() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("[renewal-notices] CRON_SECRET not set — cannot run");
    return new Response("CRON_SECRET not set", { status: 503 });
  }

  const res = await fetch("https://pickitupe.com/api/cron/renewal-notices", {
    method: "POST",
    headers: { "x-cron-secret": secret },
  });

  const body = await res.text();
  if (!res.ok) {
    // Surfaces as a failed scheduled run in the Netlify dashboard.
    console.error(`[renewal-notices] endpoint returned ${res.status}: ${body}`);
    return new Response(body, { status: res.status });
  }
  console.log(`[renewal-notices] ok: ${body}`);
  return new Response(body, { status: 200 });
}

export const config: Config = {
  schedule: "@daily",
};
