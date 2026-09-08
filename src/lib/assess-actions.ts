import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { BUSINESS } from "@/lib/seo";
import {
  addOnsFor,
  refusedItemsIn,
  sizeOptionsFor,
  sizesForPack,
  formatRange,
  type AddOnKey,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";
import { COMPETITOR_BENCHMARKS, MODEL } from "@/lib/chat-knowledge";

/**
 * Job assessor for notes and photos.
 *
 * THE MODEL DOES NOT PRICE ANYTHING. It reads a description and photos and
 * recommends WHICH PRICEBOOK INPUTS fit. `estimate()` then produces the
 * number. Regional averages are shown beside that number so the customer can
 * see we sit under what Grand Forks and Fargo actually charge.
 */

const MAX_NOTES = 1200;
const MAX_PHOTO_CHARS = 7_000_000;

export type RegionalComp = {
  who: string;
  what: string;
  price: string;
  low: number;
  high: number;
  source: string;
};

/** Named local/national comparable for a size tier. Sourced, not invented. */
export function regionalFor(service: ServiceKey, size: string): RegionalComp {
  if (service === "leaf-cleanup") {
    if (size === "small") {
      return {
        who: "LawnStarter",
        what: "a single yard cleanup",
        price: "$174–$198",
        low: 174,
        high: 198,
        source: "lawnstarter.com",
      };
    }
    if (size === "large" || size === "acreage" || size === "acre" || size === "half") {
      return {
        who: "His Workmanship (Fargo)",
        what: size === "half" || size === "acre" ? "leaf raking on a half-acre yard" : "leaf raking on a half-acre yard",
        price: size === "acre" || size === "acreage" ? "$450+ (half-acre listed; acre is a walk)" : "$450",
        low: 450,
        high: size === "acre" || size === "acreage" ? 900 : 450,
        source: "hisworkmanship.com",
      };
    }
    return {
      who: "His Workmanship (Fargo, same climate)",
      what: "leaf raking on a quarter-acre yard",
      price: "$320",
      low: 320,
      high: 320,
      source: "hisworkmanship.com",
    };
  }
  if (service === "gutter-cleaning") {
    return {
      who: "HomeYou Grand Forks",
      what: "single-story gutter cleaning",
      price: "$160–$205",
      low: 160,
      high: 205,
      source: "homeyou.com Grand Forks",
    };
  }
  if (size === "bags" || size === "small-item" || size === "single" || size === "dresser") {
    return {
      who: "LoadUp / HomeYou Grand Forks",
      what: "single-item pickup / quarter load",
      price: "from $70 / $111–$164",
      low: 70,
      high: 164,
      source: "loadup.com, homeyou.com Grand Forks",
    };
  }
  if (size === "three" || size === "half" || size === "quarter" || size === "two") {
    return {
      who: "Grand Forks junk haulers",
      what: "half truck load, local average",
      price: "$211–$344",
      low: 211,
      high: 344,
      source: "homeyou.com Grand Forks",
    };
  }
  return {
    who: "Grand Forks junk haulers",
    what: "full truck load, local average",
    price: "$422–$550",
    low: 422,
    high: 550,
    source: "homeyou.com Grand Forks",
  };
}

function systemFor(service: ServiceKey, pack?: LandlordPack): string {
  const sizes = (pack ? sizesForPack(pack === "leaves" ? "leaves" : "turns") : sizeOptionsFor(service))
    .map((s) => `  ${s.value} = ${s.label} (${s.hint}) — ${formatRange(s.range)}`)
    .join("\n");
  const addons = addOnsFor(service)
    .map((a) => `  ${a.key} = ${a.label} (${a.hint}) — ${formatRange(a.range)}`)
    .join("\n");
  const comps = COMPETITOR_BENCHMARKS.map((b) => `  ${b.who}, ${b.what}: ${b.price}`).join("\n");
  const landlord = pack
    ? `
THIS IS A LANDLORD / OWNER JOB (${pack}).
- bags = curb bags from one unit
- three = typical Grand Forks apartment after students leave (furniture + bags)
- full = trashed unit, truck bed full
- overflow = whole building / several units in the photos
Default to three for a normal unit. Only pick overflow if you can see multiple units or a hallway of stuff. Photos size the FIRST stop — do not guess how many addresses they have.
`
    : "";

  return `You size up yard, gutter and haul jobs for a small owner-operated business in Grand Forks, North Dakota. A customer has described their job and may have attached photos. Pick the right SIZE TIER and any ADD-ONS that apply.

YOU DO NOT SET PRICES. Never state a dollar total, never invent a number, never discount. You choose inputs; the company's pricebook computes the price. Regional averages below are context only.

SIZE TIERS (choose exactly one \`size\`):
${sizes}

ADD-ONS (zero or more \`addOns\`, only where the photo or description supports it):
${addons}

WHAT LOCAL AND REGIONAL COMPETITORS CHARGE:
${comps}
${landlord}
HOW TO JUDGE THIS MARKET:
- Grand Forks lots are mostly 50×140 city lots (~7,000 sq ft). Estimate \`lotSqFt\` from the photo when you can see the house and lawn. A corner with mature trees is ~12,000. Do not call it an acre unless the photo clearly shows a rural lot.
- Wet, matted, or snow-packed leaves after mid-October: \`wet-heavy\`.
- Leaves still spread across the yard: \`bagging\`.
- Basements, second floors: \`stairs\`. Long driveways: \`long-carry\`.
- Fridges/freezers/AC: \`appliance-freon\`. Garage/basement sort: \`cleanout\`.
- Gutters: single-story only from the ground.

BE HONEST:
- Vague photos: pick the middle tier, confidence low.
- Refused items (paint, chemicals, oil, propane, concrete, dirt, roofing, asbestos): name them in \`refused\`.
- Bigger than the largest tier: say so and recommend a walk-through.

Reply with ONLY a JSON object, no prose, no code fence:
{"size":"<one size value>","lotSqFt":<estimated lot square footage or null>,"addOns":["<add-on keys>"],"refused":["<items>"],"reasoning":"<two sentences, plain, to the customer>","confidence":"high"|"medium"|"low"}`;
}

type AssessOk = {
  ok: true;
  size: string | null;
  sizeLabel: string | null;
  addOns: AddOnKey[];
  refused: string[];
  reasoning: string;
  confidence: "high" | "medium" | "low";
  regional: RegionalComp | null;
  lotSqFt: number | null;
};

function parseAssess(
  raw: string,
  service: ServiceKey,
  pack?: LandlordPack,
): AssessOk | { ok: false; error: string } {
  const json = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  let parsed: {
    size?: string;
    lotSqFt?: number;
    addOns?: string[];
    refused?: string[];
    reasoning?: string;
    confidence?: string;
  };
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: `Couldn't read that one. Text ${BUSINESS.phone} and we'll size it by hand.` };
  }

  const validSizes = pack
    ? sizesForPack(pack === "leaves" ? "leaves" : "turns")
    : sizeOptionsFor(service);
  const size = validSizes.find((s) => s.value === parsed.size)?.value ?? null;
  const validAddOns = addOnsFor(service).map((a) => a.key);
  const addOns = (parsed.addOns ?? []).filter((k): k is AddOnKey => validAddOns.includes(k as AddOnKey));
  const refused = Array.from(
    new Set([...(parsed.refused ?? []).filter((r) => typeof r === "string")]),
  );

  const lotSqFt =
    typeof parsed.lotSqFt === "number" && parsed.lotSqFt >= 1500 && parsed.lotSqFt <= 350000
      ? Math.round(parsed.lotSqFt)
      : null;

  return {
    ok: true,
    size,
    sizeLabel: size ? validSizes.find((s) => s.value === size)!.label : null,
    addOns,
    refused,
    reasoning: (parsed.reasoning ?? "").slice(0, 400),
    confidence: ["high", "medium", "low"].includes(parsed.confidence ?? "")
      ? (parsed.confidence as "high" | "medium" | "low")
      : "medium",
    regional: size ? regionalFor(service, size) : null,
    lotSqFt,
  };
}

function imageParts(photos: string[]) {
  const out: { mime: string; data: string; dataUrl: string }[] = [];
  for (const url of photos) {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(url);
    if (m) out.push({ mime: m[1], data: m[2], dataUrl: url });
  }
  return out.slice(0, 3);
}

async function viaXai(
  service: ServiceKey,
  pack: LandlordPack | undefined,
  notes: string,
  photos: { mime: string; data: string; dataUrl: string }[],
): Promise<string | null> {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) return null;
  const content: unknown[] = photos.map((p) => ({
    type: "image_url",
    image_url: { url: p.dataUrl },
  }));
  content.push({
    type: "text",
    text: notes
      ? `The customer picked "${service}"${pack ? ` (landlord pack: ${pack})` : ""} and wrote:\n\n${notes}`
      : `The customer picked "${service}"${pack ? ` (landlord pack: ${pack})` : ""} and attached photo(s) with no description.`,
  });
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "grok-2-vision-1212",
      temperature: 0.1,
      max_tokens: 400,
      messages: [
        { role: "system", content: systemFor(service, pack) },
        { role: "user", content },
      ],
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    console.error(`[assess] xai ${res.status}: ${await res.text()}`);
    return null;
  }
  const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return (body.choices?.[0]?.message?.content || "").trim() || null;
}

async function viaAnthropic(
  service: ServiceKey,
  pack: LandlordPack | undefined,
  notes: string,
  photos: { mime: string; data: string; dataUrl: string }[],
): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  const content: unknown[] = photos.map((p) => ({
    type: "image",
    source: { type: "base64", media_type: p.mime, data: p.data },
  }));
  content.push({
    type: "text",
    text: notes
      ? `The customer picked "${service}"${pack ? ` (landlord pack: ${pack})` : ""} and wrote:\n\n${notes}`
      : `The customer picked "${service}"${pack ? ` (landlord pack: ${pack})` : ""} and attached photo(s) with no description.`,
  });
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
      system: systemFor(service, pack),
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    console.error(`[assess] anthropic ${res.status}: ${await res.text()}`);
    return null;
  }
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  return (body.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim() || null;
}

export const assessJob = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        service: z.enum([
          "leaf-cleanup",
          "junk-removal",
          "furniture-appliances",
          "gutter-cleaning",
          "other",
        ]),
        notes: z.string().trim().max(MAX_NOTES).optional(),
        photoDataUrl: z.string().max(MAX_PHOTO_CHARS).optional(),
        photos: z.array(z.string().max(MAX_PHOTO_CHARS)).max(3).optional(),
        pack: z.enum(["turns", "leaves", "combo"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.service === "other") {
      return {
        ok: false as const,
        error: `Pick a service above first, or just describe it and we'll price it by hand.`,
      };
    }
    const photos = imageParts(
      [...(data.photos ?? []), data.photoDataUrl ?? ""].filter(Boolean),
    );
    if (!data.notes?.trim() && !photos.length) {
      return {
        ok: false as const,
        error: "Add a photo or a note first and we'll size it against Grand Forks averages.",
      };
    }

    const service = data.service as ServiceKey;
    const pack = data.pack;
    const notes = data.notes?.trim() ?? "";

    try {
      const raw =
        (await viaXai(service, pack, notes, photos)) ||
        (await viaAnthropic(service, pack, notes, photos));
      if (!raw) {
        return {
          ok: false as const,
          error: `Couldn't size it up just now. Text ${BUSINESS.phone} a photo and we'll do it by hand.`,
        };
      }
      const parsed = parseAssess(raw, service, pack);
      if (!parsed.ok) return parsed;
      const refused = Array.from(new Set([...refusedItemsIn(notes), ...parsed.refused]));
      return { ...parsed, refused };
    } catch (err) {
      console.error("[assess] failed:", err);
      return {
        ok: false as const,
        error: `Couldn't reach us just now. Text ${BUSINESS.phone}.`,
      };
    }
  });
