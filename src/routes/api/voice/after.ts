import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/voice/after?lead=ID — `<Record action>`: the caller finished (or
 * hung up). RecordingUrl present → a voicemail exists and the transcript will
 * follow at /api/voice/voicemail, so the owner alert waits for the words.
 * No recording → alert the owner right now: "missed call, no message, they
 * got the text."
 */
export const Route = createFileRoute("/api/voice/after")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const m = await import("@/lib/phone-line.server");
        if (!m.twilioConfigured()) return new Response("phone line not configured", { status: 503 });
        const p = await m.readTwilioPost(request, "/api/voice/after");
        if (!p) return new Response("forbidden", { status: 403 });

        const leadId = Number(new URL(request.url).searchParams.get("lead")) || null;
        const secs = Number(p.RecordingDuration || 0);
        const { formatPhone } = await import("@/lib/phone");
        const phone = formatPhone(p.From || "");

        if (p.RecordingUrl && secs >= 2) {
          if (leadId) {
            const { logEvent } = await import("@/lib/owner-schema");
            const { getSql } = await import("@/lib/db");
            await logEvent(await getSql(), leadId, "call", `Voicemail left (${secs}s) — transcript coming`);
          }
          return m.twiml(m.say(m.afterMessage()) + "<Hangup/>");
        }

        await m.alertOwner({ channel: "Missed call", phone, bookingId: leadId });
        return m.twiml("<Hangup/>");
      },
    },
  },
});
