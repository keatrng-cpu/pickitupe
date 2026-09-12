import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/voice/voicemail?lead=ID — Twilio's transcription callback, a
 * minute or so after the recording. The words go onto the lead's notes and the
 * owner gets them by text + email with a tap-to-call-back. A failed transcript
 * still alerts, with the recording link instead of words.
 *
 * Always 200: Twilio does not retry transcription callbacks, and a non-2xx
 * just loses the lead.
 */
export const Route = createFileRoute("/api/voice/voicemail")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const m = await import("@/lib/phone-line.server");
        if (!m.twilioConfigured()) return new Response("phone line not configured", { status: 503 });
        const p = await m.readTwilioPost(request, "/api/voice/voicemail");
        if (!p) return new Response("forbidden", { status: 403 });

        const leadId = Number(new URL(request.url).searchParams.get("lead")) || null;
        const { formatPhone } = await import("@/lib/phone");
        const phone = formatPhone(p.From || "");
        const ok = p.TranscriptionStatus === "completed" && (p.TranscriptionText || "").trim();
        const transcript = ok ? p.TranscriptionText.trim() : null;
        // The .mp3 form plays in any browser; the URL is behind Twilio auth in
        // the console but the media itself is fetchable — fine for a voicemail.
        const recordingUrl = p.RecordingUrl ? `${p.RecordingUrl}.mp3` : null;

        if (leadId) {
          const { logEvent } = await import("@/lib/owner-schema");
          const { getSql } = await import("@/lib/db");
          const sql = await getSql();
          await m.appendLeadNote(leadId, transcript ? `Voicemail: "${transcript}"` : `Voicemail left — transcript unavailable${recordingUrl ? ` (${recordingUrl})` : ""}`);
          await logEvent(sql, leadId, "call", transcript ? `Voicemail: ${transcript}` : "Voicemail (no transcript)");
        }

        await m.alertOwner({ channel: "Voicemail", phone, transcript, recordingUrl, bookingId: leadId });
        return new Response("ok", { status: 200 });
      },
    },
  },
});
