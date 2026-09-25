import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/cron/reminders — called at 5 pm Central by the Netlify scheduled
 * function (netlify/functions/day-before.mts). Requires the CRON_SECRET
 * header; without CRON_SECRET configured it refuses everything (fail closed).
 */
export const Route = createFileRoute("/api/cron/reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { cronAuthorized, sendDayBeforeReminders } = await import("@/lib/reminders.server");
        if (!cronAuthorized(request.headers.get("x-cron-secret"))) {
          return new Response("not found", { status: 404 });
        }
        const result = await sendDayBeforeReminders();
        return Response.json(result);
      },
    },
  },
});
