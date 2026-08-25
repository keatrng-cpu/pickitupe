import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BUSINESS } from "@/lib/seo";
import {
  knowledge,
  MAX_QUESTION,
  MAX_TURNS,
  MODEL,
  SYSTEM,
} from "@/lib/chat-knowledge";

/**
 * Crude per-instance rate limit. Netlify functions are short-lived and this map
 * dies with the instance, so it is a speed bump against a single abusive tab,
 * not real protection. The real bounds are the token caps and MAX_TURNS below.
 * If this ever gets hammered, move to a database-backed counter.
 */
const hits = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function rateLimited(key: string): boolean {
  const now = Date.now();
  const cur = hits.get(key);
  if (!cur || now > cur.resetAt) {
    hits.set(key, { n: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.n++;
  return cur.n > MAX_PER_WINDOW;
}

export const askQuestion = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        question: z.string().trim().min(1).max(MAX_QUESTION),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(2000),
            }),
          )
          .max(MAX_TURNS)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    // .trim() is load-bearing, not defensive noise: an API key pasted into a
    // dashboard field routinely carries a trailing newline or space, which the
    // provider rejects as an invalid key. It presents identically to a wrong
    // key, so it is worth eliminating before anyone goes hunting.
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      return {
        ok: false as const,
        error: `Questions aren't answered here yet — call or text ${BUSINESS.phone} and you'll get a real answer the same day.`,
      };
    }
    if (rateLimited("global")) {
      return {
        ok: false as const,
        error: `That's a lot of questions at once. Give it a minute, or just text ${BUSINESS.phone}.`,
      };
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 350,
          system: SYSTEM.replace("{KNOWLEDGE}", knowledge()),
          messages: [
            ...(data.history ?? []),
            { role: "user", content: data.question },
          ],
        }),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error(`[ask] anthropic ${res.status}: ${detail}`);

        // Distinguish the failure CLASS. These are three different problems
        // with three different owners, and collapsing them into one message
        // means nobody can tell a bad key from an out-of-credit account from
        // a busy minute. `code` is the bare HTTP status — not sensitive, and
        // never rendered to the visitor; it exists so the owner can diagnose
        // without shell access to the function logs.
        const owner =
          res.status === 401 || res.status === 403
            ? "auth"
            : res.status === 402 || res.status === 429
              ? "quota"
              : "unknown";
        return {
          ok: false as const,
          code: res.status,
          reason: owner,
          error: `Something went wrong on our end. Text ${BUSINESS.phone} and the owner will answer directly.`,
        };
      }

      const body = (await res.json()) as {
        content?: { type: string; text?: string }[];
      };
      const text = (body.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();

      if (!text) {
        return {
          ok: false as const,
          error: `No answer came back. Text ${BUSINESS.phone}.`,
        };
      }
      return { ok: true as const, answer: text };
    } catch (err) {
      console.error("[ask] failed:", err);
      return {
        ok: false as const,
        error: `Couldn't reach the answer service. Text ${BUSINESS.phone}.`,
      };
    }
  });
