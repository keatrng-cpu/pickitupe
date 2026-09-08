import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  addOnsFor,
  canonicalService,
  clampStops,
  formatRange,
  isPromoLive,
  packDefaultSize,
  packService,
  PHONE,
  PROMO_DEADLINE_LABEL,
  quote,
  SERVICES,
  sizesFor,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";
import { dayOptions, firstOpenDay, formatDayLong, parseSpokenDay, slotsFor } from "@/lib/schedule";
import { findJobByCode, loadFill, placeJob } from "@/lib/jobs";
import { getSql } from "@/lib/db";
import { type JobSource } from "@/lib/channel";
import { digitsPhone, isUsPhone } from "@/lib/phone";
import { optionalSession } from "@/lib/optional-session";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ShopLead = {
  service?: ServiceKey;
  size?: string;
  name?: string;
  phone?: string;
  address?: string;
  day?: string;
  asap?: boolean;
  booked?: boolean;
  code?: string;
  bookedDay?: string;
  pack?: LandlordPack;
  stops?: number;
};

const SIZE_HINTS = SERVICES.filter((s) => s.value !== "other" && s.value !== "furniture-appliances")
  .map((s) => {
    const sizes = sizesFor(s.value)
      .map((x) => `${x.value} (${x.label})`)
      .join(", ");
    return `${s.label}: ${sizes}`;
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
  day: z.string().max(40).optional(),
  asap: z.boolean().optional(),
  booked: z.boolean().optional(),
  code: z.string().max(20).optional(),
  bookedDay: z.string().max(40).optional(),
  pack: z.enum(["turns", "leaves", "combo"]).optional(),
  stops: z.number().int().min(1).max(8).optional(),
});

const SYSTEM = `You are the Pick It Up E shop line in Grand Forks, ND / East Grand Forks, MN.
You book hauls. Warm, brief, local. No filler. Close the lead.

You MUST use tools for prices and dates. Never invent a dollar amount or a day.
Open days come from the crew calendar (four slots a day, Mon–Sat, closed Sunday).
ASAP means the first day with room for that job's size. The customer can also tap the calendar on their screen.

Services:
${SIZE_HINTS}

Add-ons: stairs, long-carry, cleanout, fridge (junk); pack-out (leaves).
Promo: ${PROMO_DEADLINE_LABEL} still takes 20% off, capped at $75, floor $55.
Deposit $50 after we confirm. Owner cell if they insist: ${PHONE}.

HOW TO TALK
- One question at a time. Confirm what they just said in a few words, then ask the next missing piece.
- Never re-ask a field that is already filled on the desk snapshot.
- Order: (1) what we're hauling (2) size if unclear (3) name (4) 10-digit phone (5) street address (6) day — they can tap the board or say ASAP (7) book_stop.
- If they dump several facts in one message, grab them all, confirm, ask only what's still missing.
- If they say book / yes / lock it / come get it and nothing is missing, call book_stop immediately. Do not recap again first.
- book_stop REQUIRES name, 10-digit phone, and a street address. If any are missing, ask for that one thing. Do not book.
- When booked, read back: what's hauled, the dollar range, the actual day, the PICK code. Then stop selling.
- Customers look up jobs with the phone they booked. PICK-XXXX still works.
- If they say a job is done / hauled, mark it hauled with the code.
- Keep replies under 45 words, spoken out loud. Straight. No "great question", no "I'd be happy to".
- Short answers fill the missing field. "Pat" is a name. "123 Main" is the address. "tomorrow" or "Monday" is a day.
- If they dump several facts ("couch, Pat, 701-555-0100, 12 3rd St, ASAP"), grab them all, confirm in one line, ask only what's still missing.`;

const LANDLORD_SYSTEM = `You are the Pick It Up E landlord desk in Grand Forks, ND / East Grand Forks, MN.
You book stacked owner jobs — tenant turns (move-out junk) and leaf routes at their buildings. Not one-off couches. Warm, brief. Close the stack.

You MUST use tools for prices and dates. Never invent a dollar amount or a day.
Crew calendar: four slots a day, Mon–Sat, closed Sunday. First open day holds the truck. Extra addresses stack on the next open days that week. One PICK code.

Packs:
- turns: tenant cleanouts. Default size "three" (typical unit). "full" if trashed. "building" if a whole complex (walk first).
- leaves: yards at their buildings. Default size "medium".
- combo: turns AND leaves the same week. $40 off the stack.

Pricing (from quote_job, never invent):
- First stop is full rate. Extra stops this week are route rate — $30–$45 off each extra.
- Do NOT apply the September 20 percent on 2+ stop owner jobs. Route rate is the owner deal.
- Deposit: $50 one stop, $75 two, $100 three or more. Combo starts at $75 and steps up. Comes off the invoice.

HOW TO TALK
- One question at a time.
- Order: (1) pack — turns, leaves, or both (2) how many addresses this week (3) size only if they said bags / trashed / whole building (4) name on the invoice (5) 10-digit phone (6) first street address — rest stack on the same code (7) day or ASAP (8) book_stop.
- Never re-ask a field already on the desk snapshot.
- If they dump facts, grab them all, confirm, ask only what's missing.
- book_stop REQUIRES name, 10-digit phone, and a street address. Pass pack and stops so the quote matches.
- When booked, read back: pack, how many stops, dollar range, day, PICK code, deposit. Then stop selling.
- Keep replies under 45 words. Straight. No filler.
- Owner cell if they insist: ${PHONE}.`;

function systemFor(source: JobSource) {
  return source === "landlord" ? LANDLORD_SYSTEM : SYSTEM;
}

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
          pack: { type: "string", enum: ["turns", "leaves", "combo"] },
          stops: { type: "integer", description: "How many units, yards, or addresses this week. 2+ is route rate." },
          complexes: { type: "integer", description: "Legacy: apartment complexes. Prefer stops." },
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
        "Put the job on the crew calendar. Requires name, 10-digit phone, and street address. Returns the real day and PICK code.",
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
          pack: { type: "string", enum: ["turns", "leaves", "combo"] },
          stops: { type: "integer" },
        },
        required: ["service", "size", "name", "phone", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_job",
      description: "Look up a booking by PICK-XXXX code or the phone they booked with.",
      parameters: {
        type: "object",
        properties: {
          code: { type: "string" },
          phone: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_hauled",
      description: "Mark a booked stop complete so the website shows it hauled.",
      parameters: {
        type: "object",
        properties: { code: { type: "string" } },
        required: ["code"],
      },
    },
  },
];

function asService(v: unknown): ServiceKey {
  const s = String(v || "");
  if (s === "leaf-cleanup" || s === "junk-removal" || s === "gutter-cleaning") return s;
  return canonicalService("junk-removal");
}

function asPack(v: unknown): LandlordPack | undefined {
  const s = String(v || "");
  if (s === "turns" || s === "leaves" || s === "combo") return s;
  return undefined;
}

function fillPack(lead: ShopLead): ShopLead {
  const next = { ...lead };
  if (!next.pack) return next;
  next.service = packService(next.pack);
  if (!next.size) next.size = packDefaultSize(next.pack);
  if (!next.stops) next.stops = 1;
  return next;
}

function missingOf(lead: ShopLead, source: JobSource = "call"): string[] {
  const m: string[] = [];
  if (source === "landlord") {
    if (!lead.pack) m.push("pack");
    if (!lead.stops || lead.stops < 1) m.push("stops");
  }
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
  if (first === "pack") return "Tenant turns, a leaf route, or both this week?";
  if (first === "stops") {
    if (lead.pack === "leaves") return "How many yards this week?";
    if (lead.pack === "combo") return "How many addresses get both this week?";
    return "How many units this week?";
  }
  if (first === "service") return "What are we hauling — leaves, junk, or gutters?";
  if (first === "size") {
    if (lead.pack === "leaves" || lead.service === "leaf-cleanup") return "Small city lot, standard, or large?";
    if (lead.pack) return "Typical unit, trashed, or a whole building?";
    if (lead.service === "gutter-cleaning") return "House or a whole complex?";
    return "One item, a few pieces, or a truckload?";
  }
  if (first === "name") return lead.pack ? "Name on the invoice?" : "Name on the job?";
  if (first === "phone") return "Ten-digit phone we'll text the morning of?";
  if (first === "address") {
    return lead.stops && lead.stops > 1
      ? "First street address — we'll stack the rest on the same code."
      : "Street address for the stop?";
  }
  if (first === "day") return "Tap a day on the board or say ASAP and I'll lock the first open one.";
  return "Want me to lock that day?";
}

function looksLikeName(text: string): string | undefined {
  const t = text.trim().replace(/[.!?,]+$/g, "");
  if (t.length < 2 || t.length > 42) return;
  if (/\d/.test(t)) return;
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 3) return;
  if (!words.every((w) => /^[A-Za-z][A-Za-z'-]*$/.test(w))) return;
  if (
    /^(yes|yeah|yep|ok|okay|please|thanks|thank you|hi|hello|hey|no|nope|asap|today|tomorrow|leaves|leaf|junk|gutters?|couch|sofa|book|lock|sure|correct|right|name|phone|address|it|me)$/i.test(
      t,
    )
  ) {
    return;
  }
  return words.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function applyToolToLead(lead: ShopLead, tool: string, raw: string, result: string): ShopLead {
  let args: Record<string, unknown> = {};
  try {
    args = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  } catch {
    args = {};
  }
  const next: ShopLead = { ...lead };
  if (args.service) next.service = asService(args.service);
  if (typeof args.size === "string" && args.size) next.size = args.size;
  if (typeof args.name === "string" && args.name.trim().length >= 2) next.name = args.name.trim();
  if (typeof args.phone === "string" && isUsPhone(args.phone)) next.phone = digitsPhone(args.phone);
  if (typeof args.address === "string" && args.address.trim().length >= 5) {
    next.address = args.address.trim();
  }
  if (typeof args.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(args.day)) {
    next.day = args.day;
    next.asap = false;
  }
  if (args.asap === true) next.asap = true;
  const pack = asPack(args.pack);
  if (pack) next.pack = pack;
  if (args.stops != null) next.stops = clampStops(args.stops);
  if (tool === "book_stop") {
    try {
      const parsed = JSON.parse(result) as { ok?: boolean; day?: string | null; code?: string };
      if (parsed.ok && parsed.day && parsed.code) {
        next.booked = true;
        next.day = parsed.day;
        next.bookedDay = parsed.day;
        next.code = parsed.code;
      }
    } catch {
      /* ignore */
    }
  }
  return fillPack(next);
}

async function runTool(
  name: string,
  raw: string,
  source: JobSource,
  lead: ShopLead,
  userId: string | null,
): Promise<string> {
  const args = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  const service = asService(args.service ?? lead.service);
  const size = String(args.size || lead.size || "");
  const addOns = Array.isArray(args.addOns) ? args.addOns.map(String) : [];

  if (name === "quote_job") {
    const pack = asPack(args.pack) ?? lead.pack;
    const stops = clampStops(args.stops ?? lead.stops ?? args.complexes ?? 1);
    const complexes = Number(args.complexes) || 1;
    const q = quote({
      service: pack ? packService(pack) : service,
      size: size || (pack ? packDefaultSize(pack) : complexes > 1 ? "building" : ""),
      addOns,
      pack,
      stops,
      complexes,
      earlyBird: isPromoLive(),
    });
    return JSON.stringify({
      range: q.range ? formatRange(q.range) : null,
      lines: q.lines.map((l) => `${l.label} ${formatRange(l.range)}`),
      promo: q.appliedDiscount,
      deposit: q.deposit,
      stops,
      pack: pack ?? null,
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
    const pack = asPack(args.pack) ?? lead.pack;
    const stops = clampStops(args.stops ?? lead.stops ?? 1);
    const filled = fillPack({ ...lead, service, size, pack, stops, name: nameOnJob, phone, address });
    const gap = missingOf(filled, source);
    if (gap.length) {
      return JSON.stringify({ ok: false, missing: gap, ask: nextAsk(gap, filled) });
    }
    const stacked =
      filled.stops && filled.stops > 1
        ? `${address} · ${filled.stops} ${filled.pack ?? "stops"} this week`
        : address;
    const held = await placeJob({
      service: filled.service as ServiceKey,
      size: filled.size || "single",
      day: String(args.day || lead.day || "1970-01-01"),
      asap: Boolean(args.asap ?? lead.asap ?? true) && !args.day && !lead.day,
      source,
      phone,
      name: nameOnJob,
      address: stacked,
      userId,
    });
    if (!held.ok) return JSON.stringify(held);
    return JSON.stringify({
      ok: true,
      day: held.day,
      dayLabel: formatDayLong(held.day),
      code: held.code,
      slots: held.slots,
    });
  }

  if (name === "find_job") {
    const code = String(args.code || "")
      .toUpperCase()
      .replace(/\s+/g, "");
    const phone = digitsPhone(String(args.phone || lead.phone || ""));
    if (code) {
      const full = code.startsWith("PICK-") ? code : `PICK-${code}`;
      const job = await findJobByCode(full);
      return JSON.stringify(job ?? { error: "No job with that code." });
    }
    if (isUsPhone(phone)) {
      const sql = await getSql();
      const rows = await sql<{
        id: number;
        day: string;
        size: string;
        status: string;
        code: string | null;
      }>`
        select id, day::text as day, size, status, code
        from haul_jobs
        where phone = ${phone} and size <> 'hold'
        order by day desc
        limit 5
      `;
      return JSON.stringify(rows);
    }
    return JSON.stringify({ error: "Need a phone or PICK code." });
  }

  if (name === "mark_hauled") {
    const code = String(args.code || "")
      .toUpperCase()
      .replace(/\s+/g, "");
    const full = code.startsWith("PICK-") ? code : `PICK-${code}`;
    const sql = await getSql();
    const rows = await sql<{ id: number; day: string; status: string; code: string | null }>`
      update haul_jobs
      set status = 'done'
      where code = ${full} and status = 'booked'
      returning id, day::text as day, status, code
    `;
    return JSON.stringify(rows[0] ?? { error: "Nothing to mark. Check the code." });
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

function deskSnapshot(lead: ShopLead, source: JobSource) {
  const missing = missingOf(lead, source);
  const filled = [
    lead.pack ? `pack=${lead.pack}` : null,
    lead.stops && lead.stops > 1 ? `stops=${lead.stops}` : null,
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
  source: JobSource,
  lead: ShopLead,
  userId: string | null,
): Promise<{ text: string; booked?: { day: string; code: string }; lead: ShopLead }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { text: "", lead };

  let current = fillPack({ ...lead });
  const messages: GrokMessage[] = [
    { role: "system", content: systemFor(source) },
    { role: "system", content: deskSnapshot(current, source) },
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
        temperature: 0.2,
        max_tokens: 220,
        tools,
        messages,
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { text: "", booked, lead: current };
    const body = (await res.json()) as {
      choices: { message: GrokMessage }[];
    };
    const msg = body.choices[0]?.message;
    if (!msg) return { text: "", booked, lead: current };
    if (msg.tool_calls?.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        const result = await runTool(
          call.function.name,
          call.function.arguments || "{}",
          source,
          current,
          userId,
        );
        current = applyToolToLead(current, call.function.name, call.function.arguments || "{}", result);
        if (call.function.name === "book_stop") {
          try {
            const parsed = JSON.parse(result) as { ok?: boolean; day?: string; code?: string };
            if (parsed.ok && parsed.day && parsed.code) {
              booked = { day: parsed.day, code: parsed.code };
            }
          } catch {
            /* ignore */
          }
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result,
        });
      }
      continue;
    }
    return { text: (msg.content || "").trim(), booked, lead: current };
  }
  return { text: "", booked, lead: current };
}

function guessService(text: string): ServiceKey | undefined {
  const t = text.toLowerCase();
  if (/(leaf|yard|rake|bag of leaves|lawn)/.test(t)) return "leaf-cleanup";
  if (/gutter/.test(t)) return "gutter-cleaning";
  if (/(junk|couch|sofa|mattress|fridge|furniture|appliance|couch|dresser|cleanout|haul)/.test(t)) {
    return "junk-removal";
  }
  return undefined;
}

function guessSize(service: ServiceKey, text: string): string | undefined {
  const t = text.toLowerCase();
  const sizes = sizesFor(service);
  for (const s of sizes) {
    if (t.includes(s.value) || t.includes(s.label.toLowerCase())) return s.value;
  }
  if (service === "junk-removal") {
    if (/(couch|sofa|mattress|recliner|loveseat|sectional|sleeper)/.test(t)) return "sofa";
    if (/(fridge|refrigerator|freezer)/.test(t)) return "fridge";
    if (/(washer|dryer|stove|oven|dishwasher|appliance)/.test(t)) return "appliance";
    if (/(dresser|table|bed frame|headboard|nightstand)/.test(t)) return "dresser";
    if (/(grill|tv|bicycle|bike|treadmill|microwave|chair)/.test(t)) return "small-item";
    if (/(full load|whole truck|building|turnover|units|complex)/.test(t)) return "building";
    if (/(half)/.test(t)) return "half";
    if (/(few bags|bags of)/.test(t)) return "bags";
  }
  if (service === "leaf-cleanup") {
    if (/(acreage|acre)/.test(t)) return "acreage";
    if (/(large|corner|huge|big yard)/.test(t)) return "large";
    if (/(small|tiny|townhouse)/.test(t)) return "small";
    if (/(standard|regular|normal|city lot|my yard)/.test(t)) return "medium";
  }
  return undefined;
}

function absorb(lead: ShopLead, text: string): ShopLead {
  const next: ShopLead = { ...lead };
  const t = text.toLowerCase();
  if (/(both|yard \+ unit|yard and unit|leaves and (junk|turns)|combo)/.test(t)) next.pack = "combo";
  else if (/(leaf route|leaf packs?)/.test(t)) next.pack = "leaves";
  else if (/(tenant turns?|move-?out|owner pack)/.test(t)) next.pack = "turns";
  const counted = t.match(
    /(\d+|one|two|three|four|five|six)\s+(units?|yards?|stops?|addresses|buildings|places|complexes)/,
  );
  if (counted) {
    const word: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
    next.stops = clampStops(word[counted[1]] ?? counted[1]);
  }
  const service = guessService(text);
  if (service) next.service = service;
  if (next.service) {
    const size = guessSize(next.service, text);
    if (size) next.size = size;
  }
  const phone = text.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  if (phone && isUsPhone(phone[0])) next.phone = digitsPhone(phone[0]);
  const name = text.match(
    /(?:i'm|i am|this is|name is|it's|its)\s+([A-Za-z][A-Za-z' -]{1,40})/i,
  );
  if (name) next.name = name[1].replace(/[.!?].*$/, "").trim();
  const addr = text.match(
    /\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:st|street|ave|avenue|rd|road|blvd|ln|lane|dr|drive|way|ct|court|pl|place|n|s|e|w|north|south|east|west)\b\.?/i,
  );
  if (addr) next.address = addr[0].trim();
  const spoken = parseSpokenDay(text);
  if (spoken?.asap) next.asap = true;
  if (spoken?.day) {
    next.day = spoken.day;
    next.asap = false;
  }

  const filled = fillPack(next);
  const missing = missingOf(filled);
  if (missing.includes("name") && !filled.name) {
    const before = phone && phone.index != null ? text.slice(0, phone.index) : text;
    const guessed = looksLikeName(before) || looksLikeName(text);
    if (guessed) filled.name = guessed;
  }
  if (missing.includes("address") && !filled.address) {
    const loose = text.match(/\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\b/);
    if (loose && !isUsPhone(loose[0]) && loose[0].length >= 5) filled.address = loose[0].trim();
  }
  return filled;
}

function serviceLabel(service?: ServiceKey) {
  return SERVICES.find((s) => s.value === service)?.label ?? "that haul";
}

async function fallbackReply(
  turns: ChatTurn[],
  source: JobSource,
  lead: ShopLead,
  userId: string | null,
): Promise<{ text: string; lead: ShopLead }> {
  const last = turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
  const t = last.toLowerCase();
  const codeMatch = last.toUpperCase().match(/PICK-[A-Z0-9]{4}/);
  let next = source === "landlord" ? fillPack(absorb(lead, last)) : absorb(lead, last);

  if (codeMatch && /(done|hauled|finished|complete)/.test(t)) {
    const result = await runTool("mark_hauled", JSON.stringify({ code: codeMatch[0] }), source, next, userId);
    const parsed = JSON.parse(result) as { error?: string; code?: string };
    if (parsed.error) return { text: "I couldn't find that code. Read it back and I'll mark it hauled.", lead: next };
    return { text: `Marked hauled. ${parsed.code} is off the open list.`, lead: next };
  }
  if (codeMatch) {
    const result = await runTool("find_job", JSON.stringify({ code: codeMatch[0] }), source, next, userId);
    const job = JSON.parse(result) as { error?: string; day?: string; size?: string; status?: string };
    if (job.error) return { text: "Nothing on file with that code.", lead: next };
    return {
      text: `${codeMatch[0]} is ${job.status} for ${job.size} on ${job.day ? formatDayLong(job.day) : "a day we'll confirm"}.`,
      lead: next,
    };
  }

  if (!next.size && next.service) {
    const sizes = sizesFor(next.service);
    if (sizes.length === 1) next.size = sizes[0].value;
  }

  const missing = missingOf(next, source);
  const wantBook = /(book|schedule|come|lock|yes|yeah|yep|do it|asap|today|tomorrow)/.test(t);

  if (wantBook && missing.includes("day")) next.asap = true;
  const gap = missingOf(next, source);

  if (wantBook && gap.length === 0) {
    const held = await placeJob({
      service: next.service as ServiceKey,
      size: next.size as string,
      day: next.day || "1970-01-01",
      asap: next.asap !== false,
      source,
      phone: next.phone,
      name: next.name,
      address: next.address,
      userId,
    });
    if (!held.ok) return { text: held.error, lead: next };
    const q = quote({
      service: next.service as ServiceKey,
      size: next.size as string,
      addOns: [],
      pack: next.pack,
      stops: next.stops,
      earlyBird: isPromoLive(),
    });
    const range = q.range ? formatRange(q.range) : "we'll confirm on site";
    return {
      text: `Locked. ${serviceLabel(next.service)} ${formatDayLong(held.day)}. ${range}. Code ${held.code}. We'll text ${next.phone}.`,
      lead: { ...next, booked: true, code: held.code, bookedDay: held.day, day: held.day },
    };
  }

  if (next.service && next.size && gap.length) {
    const q = quote({
      service: next.service,
      size: next.size,
      addOns: [],
      earlyBird: isPromoLive(),
    });
    const fill = await loadFill();
    const asap = firstOpenDay(fill, slotsFor(next.service, next.size));
    const range = q.range ? formatRange(q.range) : "we'll quote after a look";
    const ask = nextAsk(gap, next);
    if (!lead.service || !lead.size) {
      return {
        text: `${serviceLabel(next.service)} runs ${range}. First open is ${asap ? formatDayLong(asap) : "a text away"}. ${ask}`,
        lead: next,
      };
    }
    return { text: ask, lead: next };
  }

  return { text: nextAsk(gap, next), lead: next };
}

export const talkShop = createServerFn({ method: "POST" })
  .middleware([optionalSession])
  .validator((input: unknown) =>
    z
      .object({
        turns: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string().max(800),
            }),
          )
          .max(16),
        source: z.enum(["web", "call", "door", "landlord"]).optional(),
        lead: leadSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const source = data.source ?? "call";
    const incoming: ShopLead = { ...(data.lead ?? {}), asap: data.lead?.asap ?? true };
    const lastUser = data.turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
    let merged = absorb(incoming, lastUser);
    if (source === "landlord") {
      merged = fillPack({
        ...merged,
        pack:
          merged.pack ??
          (merged.service === "leaf-cleanup" ? "leaves" : merged.service ? "turns" : undefined),
      });
    }
    const userId = context.userId;
    const ai = await grokLoop(data.turns, source, merged, userId).catch(
      (): { text: string; booked?: { day: string; code: string }; lead: ShopLead } => ({
        text: "",
        lead: merged,
      }),
    );
    const leadOut = { ...merged, ...ai.lead };
    if (ai.booked) {
      const text =
        ai.text ||
        `Locked ${formatDayLong(ai.booked.day)}. Code ${ai.booked.code}. We'll text the morning of.`;
      return {
        text,
        lead: {
          ...leadOut,
          booked: true,
          code: ai.booked.code,
          bookedDay: ai.booked.day,
          day: ai.booked.day,
        } satisfies ShopLead,
      };
    }
    if (ai.text) return { text: ai.text, lead: leadOut };
    return fallbackReply(data.turns, source, leadOut, userId);
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
