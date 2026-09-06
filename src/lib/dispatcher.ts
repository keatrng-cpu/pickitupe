import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  canonicalService,
  estimate,
  formatRange,
  isPromoActive,
  PROMO_DEADLINE_LABEL,
  sizeOptionsFor,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";
import { dayOptions, firstOpenDay, formatDayLong, slotsFor } from "@/lib/schedule";
import { bookJob, jobsForPhone, loadFill } from "@/lib/bookings";
import { digitsPhone, isUsPhone } from "@/lib/phone";
import { optionalSession } from "@/lib/optional-session";
import { PHONE } from "@/lib/messages";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ShopLead = {
  service?: ServiceKey;
  size?: string;
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  day?: string;
  asap?: boolean;
  booked?: boolean;
  code?: string;
  bookedDay?: string;
};

const SERVICE_LABEL: Record<string, string> = {
  "leaf-cleanup": "Fall leaf & yard cleanup",
  "junk-removal": "Junk & furniture",
  "furniture-appliances": "Junk & furniture",
  "gutter-cleaning": "Gutter cleaning",
};

const SIZE_HINTS = (["leaf-cleanup", "junk-removal", "gutter-cleaning"] as ServiceKey[])
  .map((s) => {
    const sizes = sizeOptionsFor(s)
      .map((x) => `${x.value} (${x.label})`)
      .join(", ");
    return `${SERVICE_LABEL[s]}: ${sizes}`;
  })
  .join("\n");

const leadSchema = z.object({
  service: z
    .enum(["leaf-cleanup", "junk-removal", "furniture-appliances", "gutter-cleaning", "other"])
    .optional(),
  size: z.string().max(40).optional(),
  name: z.string().max(80).optional(),
  phone: z.string().max(24).optional(),
  address: z.string().max(200).optional(),
  email: z.string().max(80).optional(),
  day: z.string().max(40).optional(),
  asap: z.boolean().optional(),
  booked: z.boolean().optional(),
  code: z.string().max(20).optional(),
  bookedDay: z.string().max(40).optional(),
});

const SYSTEM = `You are the Pick It Up E shop line in Grand Forks, ND / East Grand Forks, MN.
You book hauls. Warm, brief, local. No filler. Close the lead.

You MUST use tools for prices and dates. Never invent a dollar amount or a day.
Open days come from the crew calendar (four slots a day, Mon–Sat, closed Sunday).
ASAP means the first day with room for that job's size. The customer can also tap the calendar on their screen.

Services:
${SIZE_HINTS}

Add-ons: stairs, long-carry, cleanout, fridge (junk); bagging (leaves); downspout (gutters).
Promo: ${PROMO_DEADLINE_LABEL} still takes 20% off, capped at $75, floor $55.
Deposit $50 after we confirm. Owner cell if they insist: ${PHONE}.

HOW TO TALK
- One question at a time. Confirm what they just said in a few words, then ask the next missing piece.
- Never re-ask a field that is already filled on the desk snapshot.
- Order: (1) what we're hauling (2) size if unclear (3) name (4) 10-digit phone (5) street address (6) day — they can tap the board or say ASAP (7) book_stop.
- If they dump several facts in one message, grab them all, confirm, ask only what's still missing.
- If they say book / yes / lock it / come get it and nothing is missing, call book_stop immediately.
- book_stop REQUIRES name, 10-digit phone, and a street address. If any are missing, ask for that one thing. Do not book.
- When booked, read back: what's hauled, the dollar range, the actual day, the job number. Then stop selling.
- Customers look up jobs with the phone they booked.
- Keep replies under 45 words, spoken out loud. Straight. No "great question", no "I'd be happy to".`;

const tools = [
  {
    type: "function",
    function: {
      name: "quote_job",
      description: "Real estimate from the pricebook.",
      parameters: {
        type: "object",
        properties: {
          service: { type: "string", enum: ["leaf-cleanup", "junk-removal", "gutter-cleaning"] },
          size: { type: "string" },
          addOns: { type: "array", items: { type: "string" } },
        },
        required: ["service", "size"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "open_days",
      description: "First open day and remaining slots. Use before promising a date.",
      parameters: {
        type: "object",
        properties: {
          service: { type: "string", enum: ["leaf-cleanup", "junk-removal", "gutter-cleaning"] },
          size: { type: "string" },
        },
        required: ["service", "size"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "book_stop",
      description:
        "Put the job on the crew calendar. Requires name, 10-digit phone, and street address. Returns the real day and job number.",
      parameters: {
        type: "object",
        properties: {
          service: { type: "string", enum: ["leaf-cleanup", "junk-removal", "gutter-cleaning"] },
          size: { type: "string" },
          asap: { type: "boolean" },
          day: { type: "string", description: "YYYY-MM-DD if they picked a day" },
          name: { type: "string" },
          phone: { type: "string" },
          address: { type: "string" },
          email: { type: "string" },
        },
        required: ["service", "size", "name", "phone", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_job",
      description: "Look up bookings by the phone they booked with.",
      parameters: {
        type: "object",
        properties: { phone: { type: "string" } },
        required: ["phone"],
      },
    },
  },
];

function asService(v: unknown): ServiceKey {
  const s = String(v || "");
  if (s === "leaf-cleanup" || s === "junk-removal" || s === "gutter-cleaning") return s;
  return canonicalService("junk-removal");
}

function missingOf(lead: ShopLead): string[] {
  const m: string[] = [];
  if (!lead.service || lead.service === "other") m.push("service");
  if (!lead.size) m.push("size");
  if (!lead.name || lead.name.trim().length < 2) m.push("name");
  if (!lead.phone || !isUsPhone(lead.phone)) m.push("phone");
  if (!lead.address || lead.address.trim().length < 5) m.push("address");
  if (!lead.asap && !/^\d{4}-\d{2}-\d{2}$/.test(lead.day || "")) m.push("day");
  return m;
}

function nextAsk(missing: string[], lead: ShopLead): string {
  const first = missing[0];
  if (first === "service") return "What are we hauling — leaves, junk, or gutters?";
  if (first === "size") {
    if (lead.service === "leaf-cleanup") return "Small city lot, standard, large, or acreage?";
    if (lead.service === "gutter-cleaning") return "House or a whole complex?";
    return "One item, a few pieces, or a truckload?";
  }
  if (first === "name") return "Name on the job?";
  if (first === "phone") return "Ten-digit phone we'll text the morning of?";
  if (first === "address") return "Street address for the stop?";
  if (first === "day") return "Tap a day on the board or say ASAP and I'll lock the first open one.";
  return "Want me to lock that day?";
}

async function runTool(name: string, raw: string, lead: ShopLead, email: string | null): Promise<string> {
  const args = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  const service = asService(args.service ?? lead.service);
  const size = String(args.size || lead.size || "");
  const addOns = Array.isArray(args.addOns) ? (args.addOns.map(String) as AddOnKey[]) : [];

  if (name === "quote_job") {
    const q = estimate({
      service,
      size: size || "single",
      addOns,
      earlyBird: isPromoActive(),
    });
    return JSON.stringify({
      range: q.range ? formatRange(q.range) : null,
      lines: q.lines.map((l) => `${l.label} ${formatRange(l.range)}`),
      promo: q.appliedDiscount,
      deposit: q.deposit,
    });
  }

  if (name === "open_days") {
    const fill = await loadFill();
    const need = slotsFor(service, size);
    const asap = firstOpenDay(fill, need);
    const days = dayOptions(fill, need)
      .filter((d) => d.open)
      .slice(0, 8)
      .map((d) => ({ day: d.day, label: d.label, openSlots: 4 - d.used }));
    return JSON.stringify({
      asap,
      asapLabel: asap ? formatDayLong(asap) : null,
      days,
    });
  }

  if (name === "book_stop") {
    const nameOnJob = String(args.name || lead.name || "").trim();
    const phone = String(args.phone || lead.phone || "");
    const address = String(args.address || lead.address || "").trim();
    const gap = missingOf({
      ...lead,
      service,
      size,
      name: nameOnJob,
      phone,
      address,
      day: String(args.day || lead.day || ""),
      asap: args.asap === true || lead.asap === true,
    });
    if (gap.length) {
      return JSON.stringify({ ok: false, missing: gap, ask: nextAsk(gap, lead) });
    }
    try {
      const held = await bookJob({
        name: nameOnJob,
        phone,
        address,
        email: String(args.email || lead.email || email || ""),
        service,
        jobSize: size || "single",
        preferredDate: String(args.day || lead.day || ""),
        asap: Boolean(args.asap ?? lead.asap ?? true) && !args.day && !lead.day,
        notes: "Shop line",
      });
      return JSON.stringify({
        ok: true,
        day: held.preferredDate,
        dayLabel: held.preferredDate ? formatDayLong(held.preferredDate) : null,
        code: `#${held.id}`,
        id: held.id,
      });
    } catch (err) {
      return JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Couldn't hold the day.",
      });
    }
  }

  if (name === "find_job") {
    const phone = String(args.phone || lead.phone || "");
    const rows = await jobsForPhone(phone);
    return JSON.stringify(
      rows.slice(0, 5).map((r) => ({
        id: r.id,
        day: r.preferred_date,
        service: r.service,
        size: r.job_size,
        status: r.status,
      })),
    );
  }

  return JSON.stringify({ error: "unknown tool" });
}

type GrokMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
  tool_call_id?: string;
};

function deskSnapshot(lead: ShopLead) {
  const missing = missingOf(lead);
  const filled = [
    lead.service ? `service=${lead.service}` : null,
    lead.size ? `size=${lead.size}` : null,
    lead.name ? `name=${lead.name}` : null,
    lead.phone && isUsPhone(lead.phone) ? `phone=${digitsPhone(lead.phone)}` : null,
    lead.address ? `address=${lead.address}` : null,
    lead.asap ? "day=ASAP" : lead.day ? `day=${lead.day}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return `DESK SNAPSHOT (already on their screen — do not re-ask these): ${filled || "nothing yet"}. STILL MISSING: ${missing.join(", ") || "nothing — book now if they want it"}.`;
}

async function grokLoop(
  turns: ChatTurn[],
  lead: ShopLead,
  email: string | null,
): Promise<{ text: string; booked?: { day: string; code: string } }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { text: "" };

  const messages: GrokMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "system", content: deskSnapshot(lead) },
    ...turns.map((t) => ({ role: t.role, content: t.content }) as GrokMessage),
  ];

  let booked: { day: string; code: string } | undefined;

  for (let i = 0; i < 4; i += 1) {
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        temperature: 0.25,
        max_tokens: 220,
        tools,
        messages,
      }),
    });
    if (!res.ok) return { text: "", booked };
    const body = (await res.json()) as { choices: { message: GrokMessage }[] };
    const msg = body.choices[0]?.message;
    if (!msg) return { text: "", booked };
    if (msg.tool_calls?.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        const result = await runTool(call.function.name, call.function.arguments || "{}", lead, email);
        if (call.function.name === "book_stop") {
          try {
            const parsed = JSON.parse(result) as { ok?: boolean; day?: string | null; code?: string };
            if (parsed.ok && parsed.day && parsed.code) booked = { day: parsed.day, code: parsed.code };
          } catch {
            /* ignore */
          }
        }
        messages.push({ role: "tool", tool_call_id: call.id, content: result });
      }
      continue;
    }
    return { text: (msg.content || "").trim(), booked };
  }
  return { text: "", booked };
}

function guessService(text: string): ServiceKey | undefined {
  const t = text.toLowerCase();
  if (/(leaf|yard|rake|bag of leaves|lawn)/.test(t)) return "leaf-cleanup";
  if (/gutter/.test(t)) return "gutter-cleaning";
  if (/(junk|couch|sofa|mattress|fridge|furniture|appliance|dresser|cleanout|haul)/.test(t)) {
    return "junk-removal";
  }
  return undefined;
}

function guessSize(service: ServiceKey, text: string): string | undefined {
  const t = text.toLowerCase();
  const sizes = sizeOptionsFor(service);
  for (const s of sizes) {
    if (t.includes(s.value) || t.includes(s.label.toLowerCase())) return s.value;
  }
  if (service === "junk-removal" || service === "furniture-appliances") {
    if (/(couch|sofa|mattress)/.test(t)) return "sofa";
    if (/(fridge|refrigerator)/.test(t)) return "fridge";
    if (/(washer|dryer|stove|appliance)/.test(t)) return "appliance";
    if (/(full load|whole truck|overflow)/.test(t)) return "full";
    if (/(half)/.test(t)) return "half";
    if (/(few bags|bags)/.test(t)) return "bags";
  }
  if (service === "leaf-cleanup") {
    if (/(acreage|acre)/.test(t)) return "acreage";
    if (/(large|corner)/.test(t)) return "large";
    if (/(small|tiny)/.test(t)) return "small";
    if (/(standard|regular|normal)/.test(t)) return "medium";
  }
  return undefined;
}

function absorb(lead: ShopLead, text: string): ShopLead {
  const next: ShopLead = { ...lead };
  const service = guessService(text);
  if (service) next.service = service;
  if (next.service) {
    const size = guessSize(next.service, text);
    if (size) next.size = size;
  }
  const phone = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phone && isUsPhone(phone[0])) next.phone = digitsPhone(phone[0]);
  const name = text.match(/(?:i'm|i am|this is|name is|it's|its)\s+([A-Za-z][A-Za-z' -]{1,40})/i);
  if (name) next.name = name[1].replace(/[.!?].*$/, "").trim();
  const addr = text.match(
    /\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:st|street|ave|avenue|rd|road|blvd|ln|lane|dr|drive|way|ct|court|pl|place|n|s|e|w|north|south|east|west)\b\.?/i,
  );
  if (addr) next.address = addr[0].trim();
  if (/\basap\b|soonest|first open/.test(text.toLowerCase())) next.asap = true;
  return next;
}

function serviceLabel(service?: ServiceKey) {
  return SERVICE_LABEL[service || ""] ?? "that haul";
}

async function fallbackReply(
  turns: ChatTurn[],
  lead: ShopLead,
  email: string | null,
): Promise<{ text: string; lead: ShopLead }> {
  const last = turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
  const t = last.toLowerCase();
  const next = absorb(lead, last);

  if (/(look up|status|where's my|where is my)/.test(t) && (next.phone || lead.phone)) {
    const rows = await jobsForPhone(next.phone || lead.phone || "");
    if (!rows.length) return { text: "Nothing on file for that phone.", lead: next };
    const r = rows[0];
    return {
      text: `Job #${r.id} is ${r.status}${r.preferred_date ? ` for ${formatDayLong(r.preferred_date)}` : ""}.`,
      lead: next,
    };
  }

  if (!next.size && next.service) {
    const sizes = sizeOptionsFor(next.service);
    if (sizes.length === 1) next.size = sizes[0].value;
  }

  const missing = missingOf(next);
  const wantBook = /(book|schedule|come|lock|yes|yeah|yep|do it|asap|today|tomorrow)/.test(t);

  if (wantBook && missing.length === 0) {
    try {
      const held = await bookJob({
        name: next.name as string,
        phone: next.phone as string,
        address: next.address as string,
        email: next.email || email || "",
        service: next.service as ServiceKey,
        jobSize: next.size,
        preferredDate: next.day || "",
        asap: next.asap !== false,
        notes: "Shop line",
      });
      const q = estimate({
        service: next.service as ServiceKey,
        size: next.size as string,
        addOns: [],
        earlyBird: isPromoActive(),
      });
      const range = q.range ? formatRange(q.range) : "we'll confirm on site";
      const day = held.preferredDate || next.day || "";
      return {
        text: `Locked. ${serviceLabel(next.service)} ${day ? formatDayLong(day) : "first open day"}. ${range}. Job #${held.id}. We'll text ${next.phone}.`,
        lead: { ...next, booked: true, code: `#${held.id}`, bookedDay: day, day },
      };
    } catch (err) {
      return { text: err instanceof Error ? err.message : "Couldn't hold the day.", lead: next };
    }
  }

  if (next.service && next.size && missing.length) {
    const q = estimate({
      service: next.service,
      size: next.size,
      addOns: [],
      earlyBird: isPromoActive(),
    });
    const fill = await loadFill();
    const asap = firstOpenDay(fill, slotsFor(next.service, next.size));
    const range = q.range ? formatRange(q.range) : "we'll quote after a look";
    const ask = nextAsk(missing, next);
    if (!lead.service || !lead.size) {
      return {
        text: `${serviceLabel(next.service)} runs ${range}. First open is ${asap ? formatDayLong(asap) : "a text away"}. ${ask}`,
        lead: next,
      };
    }
    return { text: ask, lead: next };
  }

  return { text: nextAsk(missing, next), lead: next };
}

export const talkShop = createServerFn({ method: "POST" })
  .middleware([optionalSession])
  .validator((input: unknown) =>
    z
      .object({
        turns: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(800) }))
          .max(16),
        lead: leadSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const incoming: ShopLead = { ...(data.lead ?? {}), asap: data.lead?.asap ?? true };
    if (!incoming.email && context.email) incoming.email = context.email;
    const lastUser = data.turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
    const merged = absorb(incoming, lastUser);
    const ai = await grokLoop(data.turns, merged, context.email).catch(
      (): { text: string; booked?: { day: string; code: string } } => ({ text: "" }),
    );
    if (ai.booked) {
      const text =
        ai.text || `Locked ${formatDayLong(ai.booked.day)}. ${ai.booked.code}. We'll text the morning of.`;
      return {
        text,
        lead: {
          ...merged,
          booked: true,
          code: ai.booked.code,
          bookedDay: ai.booked.day,
          day: ai.booked.day,
        } satisfies ShopLead,
      };
    }
    if (ai.text) return { text: ai.text, lead: merged };
    return fallbackReply(data.turns, merged, context.email);
  });

export const speakShop = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ text: z.string().min(1).max(600) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { audio: null as string | null };
    const res = await fetch("https://api.x.ai/v1/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ text: data.text, voice_id: "orion", language: "en" }),
    });
    if (!res.ok) return { audio: null as string | null };
    const buf = Buffer.from(await res.arrayBuffer());
    return { audio: `data:audio/mpeg;base64,${buf.toString("base64")}` };
  });
