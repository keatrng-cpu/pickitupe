import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";
import { BUSINESS } from "@/lib/seo";
import { knowledge, MAX_QUESTION, MAX_TURNS, SYSTEM } from "@/lib/chat-knowledge";

/**
 * The concierge — the answer box on the home page, /help, and every job page.
 *
 * Two jobs, kept apart on purpose:
 *   1. ANSWER from the pricebook-rendered FACTS (chat-knowledge.ts). The model
 *      never computes a price or promises a date — see the rules in SYSTEM.
 *   2. HAND OFF to the owner. It has exactly one tool, `flag_for_owner`, which
 *      opens a support ticket and texts/emails Keaton. It cannot move, cancel
 *      or refund anything itself: self-serve moves live on the job page, where
 *      the capacity check runs; everything else is a person's call.
 *
 * It says it's an AI up front (the UI labels it too). No statute in ND or MN
 * requires that today; the FTC's deception rule still bars implying a bot is
 * a person, and customers deserve to know who they're talking to.
 */

export const CONCIERGE_MODEL = "claude-opus-5";

const TICKET_KINDS = ["reschedule", "cancel", "change", "complaint", "question", "praise", "other"] as const;

const FLAG_TOOL: Anthropic.Beta.Messages.BetaTool = {
  name: "flag_for_owner",
  description:
    "Open a ticket that texts and emails the owner, Keaton, right now. Use it when the customer wants to reschedule, cancel, or change what's being hauled; reports a problem, damage, or is unhappy; asks for a callback or a person; or asks something the FACTS can't answer and wants a real answer. Do NOT use it for ordinary questions you already answered. If there is no JOB on file, you need a phone number or email to reach them — ask for it before calling this tool. Call it at most once per conversation unless the customer raises a second, different issue.",
  strict: true,
  input_schema: {
    type: "object",
    additionalProperties: false,
    required: ["kind", "urgency", "summary", "name", "contact"],
    properties: {
      kind: { type: "string", enum: [...TICKET_KINDS] },
      urgency: {
        type: "string",
        enum: ["low", "normal", "high"],
        description: "high = unhappy customer, damage, or a job in the next two days. low = nothing time-sensitive.",
      },
      summary: {
        type: "string",
        description: "2–4 plain sentences for Keaton: what they want, any specifics (items, days, what went wrong), in their words where it matters.",
      },
      name: { type: "string", description: "Customer's name if they gave it, else empty string." },
      contact: {
        type: "string",
        description: "Phone number or email the customer gave in this chat. Empty string when a JOB is on file.",
      },
    },
  },
};

const CONCIERGE_RULES = `
YOU ARE AN AI ASSISTANT for ${BUSINESS.name}. If anyone asks whether you're a person, say plainly that you're an AI assistant and that Keaton (the owner) reads every flagged message himself.

HANDING OFF — the flag_for_owner tool:
- Reschedules: if a JOB is on file and the job page says it can be moved, tell them the "Move the day" section right on their job page does it instantly. If it's within a day of the job, or they have no job page, flag it.
- Cancels, changes to what's being hauled, complaints, damage, billing questions, anything about the deposit or a refund: flag it. Never promise a refund, a discount, or a fix — say Keaton will text them back, usually the same day.
- After the tool succeeds, tell them in one sentence that Keaton has it and will text back. Don't repeat the ticket back at length.
- If the customer is upset, acknowledge it first, plainly, before anything else. Don't argue about what happened.
`.trim();

type Turn = { role: "user" | "assistant"; content: string };

async function jobContext(token: string | undefined) {
  if (!token) return { block: "JOB: none on file (a visitor on the public site).", booking: null as null | { id: number; name: string; phone: string; email: string | null } };
  const { careSql } = await import("@/lib/care.server");
  const sql = await careSql();
  const rows = await sql.query<{
    id: number;
    name: string;
    phone: string;
    email: string | null;
    service: string;
    job_size: string | null;
    preferred_date: string | null;
    status: string;
    deposit_paid: boolean | null;
    estimate_low: number | null;
    estimate_high: number | null;
  }>(
    `select id, name, phone, email, service, job_size, preferred_date, status, deposit_paid, estimate_low, estimate_high
       from bookings where manage_token = $1`,
    [token],
  );
  const r = rows[0];
  if (!r) return { block: "JOB: none on file.", booking: null };
  const first = (r.name || "").trim().split(/\s+/)[0];
  const range = r.estimate_low != null && r.estimate_high != null ? `$${r.estimate_low}–$${r.estimate_high}` : "not set";
  return {
    block: [
      `JOB on file (this is the customer's own job — you may state these facts to them):`,
      `  Job #${r.id} for ${first}. Service: ${r.service}${r.job_size ? ` (${r.job_size})` : ""}.`,
      `  Day: ${(r.preferred_date || "not set").slice(0, 10)}. Status: ${r.status}. Deposit paid: ${r.deposit_paid ? "yes" : "no"}. Estimate: ${range}.`,
      `  The customer is on their private job page, which has a "Move the day" section (self-serve until the day before) and a review form once the job is done.`,
    ].join("\n"),
    booking: { id: r.id, name: r.name, phone: r.phone, email: r.email },
  };
}

async function reviewContext() {
  try {
    const { careSql } = await import("@/lib/care.server");
    const sql = await careSql();
    const rows = await sql.query<{ n: number; avg: number | null }>(
      `select count(*)::int as n, round(avg(rating)::numeric, 1)::float as avg from reviews where status = 'published'`,
    );
    const n = rows[0]?.n ?? 0;
    return n
      ? `REVIEWS: ${n} published on the site's reviews page (average ${rows[0]?.avg}). Point people to /reviews; never quote or invent individual reviews.`
      : "REVIEWS: none published yet — say it's a new local operation.";
  } catch {
    return "REVIEWS: none published yet — say it's a new local operation.";
  }
}

function contactOk(s: string) {
  const digits = s.replace(/\D/g, "");
  return /\S+@\S+\.\S+/.test(s) || digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

export const askQuestion = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        question: z.string().trim().min(1).max(MAX_QUESTION),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
          .max(MAX_TURNS)
          .optional(),
        token: z.string().regex(/^[A-Za-z0-9_-]{20,40}$/).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // .trim(): a key pasted into a dashboard routinely carries a trailing
    // newline, which presents exactly like a wrong key.
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      return {
        ok: false as const,
        error: `Questions aren't answered here yet — call or text ${BUSINESS.phone} and you'll get a real answer the same day.`,
      };
    }
    const { limited, openTicket, careSql } = await import("@/lib/care.server");
    if (limited("ask", 10)) {
      return { ok: false as const, error: `That's a lot of questions at once. Give it a minute, or just text ${BUSINESS.phone}.` };
    }

    const [{ block: jobBlock, booking }, reviewsBlock] = await Promise.all([jobContext(data.token), reviewContext()]);
    const history: Turn[] = data.history ?? [];
    const transcript = [...history, { role: "user" as const, content: data.question }];

    const { default: AnthropicClient } = await import("@anthropic-ai/sdk");
    const client = new AnthropicClient({ apiKey: key, maxRetries: 1, timeout: 45_000 });

    const messages: Anthropic.Beta.Messages.BetaMessageParam[] = transcript.map((t) => ({ role: t.role, content: t.content }));
    let flagged: { id: number; kind: string } | null = null;

    try {
      for (let round = 0; round < 3; round += 1) {
        const res = await client.beta.messages.create({
          model: CONCIERGE_MODEL,
          max_tokens: 4000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [
            // Stable prefix first (cacheable), per-request context after it.
            { type: "text", text: SYSTEM.replace("{KNOWLEDGE}", knowledge()), cache_control: { type: "ephemeral" } },
            { type: "text", text: `${CONCIERGE_RULES}\n\n${jobBlock}\n${reviewsBlock}` },
          ],
          tools: [FLAG_TOOL],
          messages,
        });

        if (res.stop_reason === "refusal") {
          return { ok: false as const, error: `I can't help with that one here. Text ${BUSINESS.phone} and Keaton will answer directly.` };
        }

        const toolUses = res.content.filter((b): b is Anthropic.Beta.Messages.BetaToolUseBlock => b.type === "tool_use");
        if (res.stop_reason !== "tool_use" || !toolUses.length) {
          const text = res.content
            .filter((b): b is Anthropic.Beta.Messages.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("")
            .trim();
          if (!text) return { ok: false as const, error: `No answer came back. Text ${BUSINESS.phone}.` };
          return { ok: true as const, answer: text, flagged };
        }

        // Echo the whole assistant turn back (thinking blocks included), then
        // every tool result in ONE user message.
        messages.push({ role: "assistant", content: res.content });
        const results: Anthropic.Beta.Messages.BetaToolResultBlockParam[] = [];
        for (const use of toolUses) {
          const parsed = z
            .object({
              kind: z.enum(TICKET_KINDS),
              urgency: z.enum(["low", "normal", "high"]),
              summary: z.string().min(3).max(1500),
              name: z.string().max(80),
              contact: z.string().max(120),
            })
            .safeParse(use.input);
          if (use.name !== FLAG_TOOL.name || !parsed.success) {
            results.push({ type: "tool_result", tool_use_id: use.id, is_error: true, content: "Invalid input." });
            continue;
          }
          const inp = parsed.data;
          if (!booking && !contactOk(inp.contact)) {
            results.push({
              type: "tool_result",
              tool_use_id: use.id,
              is_error: true,
              content: "No way to reach them yet. Ask for a phone number or email first, then call the tool again.",
            });
            continue;
          }
          if (flagged) {
            results.push({ type: "tool_result", tool_use_id: use.id, content: `Already flagged as ticket #${flagged.id}. Keaton has it.` });
            continue;
          }
          const sql = await careSql();
          const email = booking?.email ?? (inp.contact.includes("@") ? inp.contact : null);
          const phone = booking?.phone ?? (inp.contact.includes("@") ? null : inp.contact);
          const id = await openTicket(sql, {
            bookingId: booking?.id ?? null,
            kind: inp.kind,
            urgency: inp.urgency,
            summary: inp.summary,
            name: booking?.name ?? (inp.name || null),
            phone,
            email,
            channel: "concierge",
            transcript,
          });
          flagged = { id, kind: inp.kind };
          results.push({ type: "tool_result", tool_use_id: use.id, content: `Ticket #${id} opened. Keaton has been texted and emailed.` });
        }
        messages.push({ role: "user", content: results });
      }
      return { ok: true as const, answer: `Keaton has your message and will text you back. Anything else, text ${BUSINESS.phone}.`, flagged };
    } catch (err) {
      const { default: AnthropicClient2 } = await import("@anthropic-ai/sdk");
      if (err instanceof AnthropicClient2.RateLimitError) {
        return { ok: false as const, error: `Busy minute on our end — try again shortly, or text ${BUSINESS.phone}.` };
      }
      if (err instanceof AnthropicClient2.AuthenticationError || err instanceof AnthropicClient2.PermissionDeniedError) {
        console.error("[concierge] auth failed — check ANTHROPIC_API_KEY");
      } else {
        console.error("[concierge] failed:", err);
      }
      return { ok: false as const, error: `Couldn't reach the answer service. Text ${BUSINESS.phone} and Keaton will answer directly.` };
    }
  });
