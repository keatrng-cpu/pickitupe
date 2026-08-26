import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BUSINESS } from "@/lib/seo";
import {
  addOnsFor,
  refusedItemsIn,
  sizeOptionsFor,
  formatRange,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";
import { COMPETITOR_BENCHMARKS, MODEL } from "@/lib/chat-knowledge";

/**
 * Job assessor for the notes and photo fields.
 *
 * THE MODEL DOES NOT PRICE ANYTHING. It reads a description (and optionally a
 * photo) and recommends WHICH PRICEBOOK INPUTS fit — a size tier and some
 * add-ons. `estimate()` then produces the number deterministically, exactly as
 * it does when a customer picks the tier by hand.
 *
 * That split is the entire design. A model that outputs a dollar figure is
 * guessing at the one thing this site refuses to guess at; a model that outputs
 * "this looks like a standard lot with wet leaves" is doing something it is
 * genuinely good at and that a homeowner is genuinely bad at. The customer
 * still sees, and can override, every input.
 *
 * Everything coming back is validated against the pricebook before it is
 * returned — a hallucinated size value or add-on key is dropped rather than
 * handed to the estimator.
 */

const MAX_NOTES = 1200;
/** ~7MB of base64. Bigger than a phone photo needs, small enough to post. */
const MAX_PHOTO_CHARS = 7_000_000;

function systemFor(service: ServiceKey): string {
  const sizes = sizeOptionsFor(service)
    .map((s) => `  ${s.value} = ${s.label} (${s.hint}) — ${formatRange(s.range)}`)
    .join("\n");
  const addons = addOnsFor(service)
    .map((a) => `  ${a.key} = ${a.label} (${a.hint}) — ${formatRange(a.range)}`)
    .join("\n");
  const comps = COMPETITOR_BENCHMARKS.map(
    (b) => `  ${b.who}, ${b.what}: ${b.price}`,
  ).join("\n");

  return `You size up yard and haul jobs for a small owner-operated business in Grand Forks, North Dakota. A customer has described their job, and may have attached a photo. Your job is to pick the right SIZE TIER and any ADD-ONS that apply.

YOU DO NOT SET PRICES. You never state a dollar total, never invent a number, never discount. You choose inputs; the company's own pricebook computes the price from them. The ranges below are shown to you only so your choice is informed — repeating one back is fine, inventing one is not.

SIZE TIERS (choose exactly one \`size\`):
${sizes}

ADD-ONS (choose zero or more \`addOns\`, only where the description or photo genuinely supports it):
${addons}

WHAT LOCAL COMPETITORS CHARGE, for context on whether a tier is reasonable:
${comps}

HOW TO JUDGE, for this specific market:
- Grand Forks lots are mostly city lots and standard residential. Do not reach for the largest tier because someone says "a lot of leaves" — everyone says that. Reach for it when they describe a corner lot, mature trees, or acreage.
- Wet, matted, or snow-packed leaves are common here after mid-October and genuinely slow the work. If they mention rain, snow, or leaves sitting a while, that is the \`wet-heavy\` add-on.
- If leaves are still spread across the yard rather than piled or bagged at the curb, that is \`bagging\`.
- Basements, second floors, and long driveways are real: \`stairs\` and \`long-carry\`.
- Fridges, freezers and AC units carry a refrigerant disposal fee: \`appliance-freon\`.
- Sorting a garage or basement is different work from lifting something already at the curb: \`cleanout\`.

BE HONEST, INCLUDING WHEN IT COSTS THE JOB:
- If the description is too vague to size, say so and pick the middle tier rather than the biggest.
- If you can see or read something on the refused list (paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos), name it in \`refused\`. Never wave it through.
- If the job looks bigger than the largest tier, say so in \`reasoning\` and recommend they text a photo to ${BUSINESS.phone} for a walk-through.

Reply with ONLY a JSON object, no prose around it, no code fence:
{"size":"<one size value>","addOns":["<add-on keys>"],"refused":["<refused items you spotted>"],"reasoning":"<two sentences, plain, addressed to the customer>","confidence":"high"|"medium"|"low"}`;
}

export const assessJob = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        service: z.enum([
          "leaf-cleanup",
          "junk-removal",
          "furniture-appliances",
          "other",
        ]),
        notes: z.string().trim().max(MAX_NOTES).optional(),
        photoDataUrl: z.string().max(MAX_PHOTO_CHARS).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      return {
        ok: false as const,
        error: `Not available yet — text a photo to ${BUSINESS.phone} and you'll get a number the same day.`,
      };
    }
    if (data.service === "other") {
      return {
        ok: false as const,
        error: `Pick a service above first, or just describe it and we'll price it by hand.`,
      };
    }
    if (!data.notes?.trim() && !data.photoDataUrl) {
      return {
        ok: false as const,
        error: "Add a note or a photo first and we'll size it up.",
      };
    }

    // Build the content blocks. A data URL is "data:<mime>;base64,<payload>";
    // the API wants those two halves separately, so a malformed URL must be
    // dropped rather than posted as garbage.
    const content: unknown[] = [];
    if (data.photoDataUrl) {
      const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(
        data.photoDataUrl,
      );
      if (m) {
        content.push({
          type: "image",
          source: { type: "base64", media_type: m[1], data: m[2] },
        });
      }
    }
    content.push({
      type: "text",
      text: data.notes?.trim()
        ? `The customer picked "${data.service}" and wrote:\n\n${data.notes.trim()}`
        : `The customer picked "${data.service}" and attached this photo with no description.`,
    });

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
          max_tokens: 400,
          system: systemFor(data.service as ServiceKey),
          messages: [{ role: "user", content }],
        }),
      });

      if (!res.ok) {
        console.error(`[assess] anthropic ${res.status}: ${await res.text()}`);
        return {
          ok: false as const,
          error: `Couldn't size it up just now. Text ${BUSINESS.phone} and we'll do it by hand.`,
        };
      }

      const body = (await res.json()) as {
        content?: { type: string; text?: string }[];
      };
      const raw = (body.content ?? [])
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();

      // Tolerate a stray code fence rather than failing the whole call on it.
      const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      let parsed: {
        size?: string;
        addOns?: string[];
        refused?: string[];
        reasoning?: string;
        confidence?: string;
      };
      try {
        parsed = JSON.parse(json);
      } catch {
        console.error(`[assess] unparseable reply: ${raw.slice(0, 200)}`);
        return {
          ok: false as const,
          error: `Couldn't read that one. Text ${BUSINESS.phone} and we'll size it by hand.`,
        };
      }

      // VALIDATE EVERYTHING against the pricebook. A hallucinated size value or
      // add-on key is dropped, never forwarded to estimate().
      const validSizes = sizeOptionsFor(data.service as ServiceKey);
      const size = validSizes.find((s) => s.value === parsed.size)?.value;
      const validAddOns = addOnsFor(data.service as ServiceKey).map((a) => a.key);
      const addOns = (parsed.addOns ?? []).filter((k): k is AddOnKey =>
        validAddOns.includes(k as AddOnKey),
      );

      // Refused items are re-derived from the text by the deterministic scanner
      // as well, so a model that misses one still cannot let it through.
      const refused = Array.from(
        new Set([
          ...refusedItemsIn(data.notes ?? ""),
          ...(parsed.refused ?? []).filter((r) => typeof r === "string"),
        ]),
      );

      return {
        ok: true as const,
        size: size ?? null,
        sizeLabel: size ? validSizes.find((s) => s.value === size)!.label : null,
        addOns,
        refused,
        reasoning: (parsed.reasoning ?? "").slice(0, 400),
        confidence: ["high", "medium", "low"].includes(parsed.confidence ?? "")
          ? (parsed.confidence as "high" | "medium" | "low")
          : "medium",
      };
    } catch (err) {
      console.error("[assess] failed:", err);
      return {
        ok: false as const,
        error: `Couldn't reach us just now. Text ${BUSINESS.phone}.`,
      };
    }
  });
