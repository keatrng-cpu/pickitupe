import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/voice/missed — Twilio's "a call arrived" webhook for the number the
 * owner's cell forwards to when he doesn't pick up. See phone-line.server.ts.
 *
 * Order matters: text first, then talk. If the caller hangs up two seconds into
 * the greeting they still have the booking link in their hand.
 */
export const Route = createFileRoute("/api/voice/missed")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const m = await import("@/lib/phone-line.server");
        if (!m.twilioConfigured()) return new Response("phone line not configured", { status: 503 });
        const p = await m.readTwilioPost(request, "/api/voice/missed");
        if (!p) return new Response("forbidden", { status: 403 });

        const from = p.From || "";
        // ForwardedFrom is set when the carrier forwarded the call from the cell.
        const via = p.ForwardedFrom ? ` (forwarded from ${p.ForwardedFrom})` : "";
        const lead = await m.findOrCreateCallLead(from, `Missed call${via} · ${p.CallSid ?? ""}`.trim());

        if (lead) {
          const sent = await m.sendSms(lead.phone, m.textBack(m.publicUrl("")));
          const { logEvent } = await import("@/lib/owner-schema");
          const { getSql } = await import("@/lib/db");
          await logEvent(await getSql(), lead.id, "text", sent ? "Auto-text: booking link sent" : "Auto-text failed (Twilio)");
        }

        const q = lead ? `?lead=${lead.id}` : "";
        return m.twiml(
          m.say(m.GREETING) +
            `<Record maxLength="120" timeout="4" playBeep="true" trim="trim-silence"` +
            ` action="${m.publicUrl("/api/voice/after", q)}" method="POST"` +
            ` transcribe="true" transcribeCallback="${m.publicUrl("/api/voice/voicemail", q)}"/>` +
            m.say("I didn't catch a message — no problem, the text has the link. Bye for now."),
        );
      },
    },
  },
});
