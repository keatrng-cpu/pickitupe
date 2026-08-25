import { createFileRoute } from "@tanstack/react-router";
import { runRenewalNotices } from "@/lib/renewal-notice.server";

/**
 * Daily sweep that sends the NDCC ch. 51-37 pre-renewal notices.
 *
 * Lives in the app rather than as a standalone Netlify function so it shares
 * the same database client, the same subscription queries, and the same
 * notice copy as everything else. `netlify/functions/renewal-notices.mts` is
 * a five-line scheduled trigger that just calls this.
 *
 * Guarded by a shared secret in a header, compared in constant time. This
 * endpoint reads customer PII and sends mail on the owner's behalf, so an
 * open URL would be both a data leak and a spam cannon.
 */
export const Route = createFileRoute("/api/cron/renewal-notices")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.CRON_SECRET;
        if (!expected) {
          return json({ error: "CRON_SECRET not configured" }, 503);
        }
        const provided = request.headers.get("x-cron-secret") ?? "";
        if (!timingSafeEqual(provided, expected)) {
          return json({ error: "unauthorized" }, 401);
        }

        try {
          const result = await runRenewalNotices();
          if (result.blocked) {
            // 500 on purpose: this must show up as a FAILING scheduled run in
            // the Netlify dashboard, not a quiet 200 with a sad message in the
            // body that nobody reads. An unsent statutory notice is an
            // incident.
            console.error("[renewal-notices] BLOCKED:", result.blocked);
            return json(result, 500);
          }
          if (result.failed > 0) {
            console.error("[renewal-notices] failures:", result.failures);
            return json(result, 500);
          }
          return json(result, 200);
        } catch (err) {
          console.error("[renewal-notices] run failed:", err);
          return json({ error: "run failed" }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Length-independent comparison so the secret can't be probed by timing. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
