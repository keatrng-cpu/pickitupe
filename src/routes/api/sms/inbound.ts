import { createFileRoute } from "@tanstack/react-router";

/**
 * POST /api/sms/inbound — a text arrives at the Twilio number, almost always a
 * reply to the missed-call text ("yes", "1417 Chestnut, leaves + a couch").
 * It's logged on the caller's lead and forwarded to the owner's cell so the
 * conversation continues in Messages, where he'll actually answer it. The
 * caller is told it landed. STOP/HELP are honoured by Twilio before we see
 * them (Advanced Opt-Out is on by default for toll-free numbers).
 */
export const Route = createFileRoute("/api/sms/inbound")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const m = await import("@/lib/phone-line.server");
        if (!m.twilioConfigured()) return new Response("phone line not configured", { status: 503 });
        const p = await m.readTwilioPost(request, "/api/sms/inbound");
        if (!p) return new Response("forbidden", { status: 403 });

        const from = p.From || "";
        const body = (p.Body || "").trim().slice(0, 1000);
        const media = Number(p.NumMedia || 0);
        if (!body && !media) return m.twiml("");

        const lead = await m.findOrCreateCallLead(from, `Text in: ${body || "(photo)"}`);
        if (lead) await m.appendLeadNote(lead.id, `Text: ${body || "(photo)"}`);

        const { PHONE } = await import("@/lib/messages");
        const ownerCell = (process.env.OWNER_CELL || PHONE).trim();
        const { formatPhone } = await import("@/lib/phone");
        const site = m.publicUrl("");
        if (m.smsEnabled()) await m.sendSms(
          ownerCell,
          `Text from ${formatPhone(from)}: ${body || "(photo)"}${media ? ` [+${media} photo${media > 1 ? "s" : ""} — see Twilio]` : ""} · ${lead ? `${site}/jobs/${lead.id}` : ""}`.trim(),
        );

        // One acknowledgement per lead per day — repeat replies shouldn't get a robot every time.
        const first = lead?.created && m.smsEnabled();
        return m.twiml(
          first
            ? `<Message>Got it — Keaton will text or call you back shortly. To lock a day now: ${site}/book?s=call</Message>`
            : "",
        );
      },
    },
  },
});
