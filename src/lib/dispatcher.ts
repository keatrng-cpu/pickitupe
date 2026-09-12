import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  canonicalService,
  clampStops,
  estimate,
  formatRange,
  hasGutterBundle,
  isPromoActive,
  normalizeAddOns,
  packDefaultSize,
  packService,
  parseAddOns,
  PROMO_DEADLINE_LABEL,
  sizeOptionsFor,
  type AddOnKey,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";
import { dayOptions, firstOpenDay, formatDayLong, parseSpokenDay, slotsFor } from "@/lib/schedule";
import { jobsForPhone, loadFill } from "@/lib/bookings";
import { lockWithDeposit } from "@/lib/pay-actions";
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
  pack?: LandlordPack;
  stops?: number;
  extraAddresses?: string[];
  addOns?: AddOnKey[];
  desk?: "landlord";
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
  pack: z.enum(["turns", "leaves", "combo"]).optional(),
  stops: z.number().int().min(1).max(8).optional(),
  extraAddresses: z.array(z.string().max(200)).max(8).optional(),
  addOns: z.array(z.string().max(40)).max(10).optional(),
  desk: z.enum(["landlord"]).optional(),
});

const SYSTEM = `You are the Pick It Up E shop line in Grand Forks, ND / East Grand Forks, MN.
You book hauls. Warm, brief, local. No filler. Close the lead.

You MUST use tools for prices and dates. Never invent a dollar amount or a day.
Open days come from the crew calendar (four slots a day, Mon–Sat, closed Sunday).
ASAP means the first day with room for that job's size. The customer can also tap the calendar on their screen.

Services:
${SIZE_HINTS}

Add-ons: stairs, long-carry, cleanout, fridge (junk); bagging and wet-heavy (leaves).
On a leaf stop, same-stop extras — keep service=leaf-cleanup, do NOT switch to gutter-cleaning:
- gutters-here: ranch / single-story $80–$110
- gutters-wrap: wraparound or split $110–$145
- porch-piece: one bulky piece $55–$85
Ask once after they pick leaves: "Gutters while we're there?" Sequence: rake first, climb second. Bundle extras never take the September percent. Deposit stays $50. Do not offer gutter add-ons on landlord stacks.
Promo: ${isPromoActive() ? `${PROMO_DEADLINE_LABEL} still takes 20% off the leaf/junk base, capped at $75, floor $55. Bundle extras are already trip-priced — no percent on those.` : "Percent-off window is closed. Book before the city vacuum (mid-Oct to mid-Nov). Neighbor/block credit for same-street density. Floor still $55. No extra coupon."}
Deposit: $50 on the card holds the day (landlord stacks $75–$100) and comes off the invoice. No hold without the card. Owner cell if they insist: ${PHONE}.

HOW TO TALK
- One question at a time. Confirm what they just said in a few words, then ask the next missing piece.
- Never re-ask a field that is already filled on the desk snapshot.
- Order: (1) what we're hauling (2) size if unclear (3) name (4) 10-digit phone (5) street address (6) day — they can tap the board or say ASAP (7) book_stop.
- If they dump several facts in one message, grab them all, confirm, ask only what's still missing.
- If they say book / yes / lock it / come get it and nothing is missing, call book_stop immediately.
- book_stop REQUIRES name, 10-digit phone, and a street address. If any are missing, ask for that one thing. Do not book.
- When booked, read back: what's hauled, the dollar range, the day, the job number, and the payUrl so they can put the deposit on the card. The day is not held until the card clears.
- Customers look up jobs with the phone they booked.
- Keep replies under 45 words, spoken out loud. Straight. No "great question", no "I'd be happy to".
- Short answers fill the missing field. "Pat" is a name. "123 Main" is the address. "tomorrow" or "Monday" is a day.
- If they dump several facts ("couch, Pat, 701-555-0100, 12 3rd St, ASAP"), grab them all, confirm in one line, ask only what's still missing.`;

const LANDLORD_SYSTEM = `You are the Pick It Up E landlord desk in Grand Forks, ND / East Grand Forks, MN.
You book stacked owner jobs — tenant turns (move-out junk) and leaf routes at their buildings. Not one-off couches. Warm, brief. Close the stack.

You MUST use tools for prices and dates. Never invent a dollar amount or a day.
Crew calendar: four slots a day, Mon–Sat, closed Sunday. First open day holds the truck. Extra addresses stack on the next open days that week. One job number.

Packs:
- turns: tenant cleanouts. Default size "three" (typical unit). "full" if trashed. "overflow" if a whole building (walk first).
- leaves: yards at their buildings. Default size "medium".
- combo: turns AND leaves the same week. $40 off the stack.

Pricing (from quote_job, never invent):
- First stop is full rate. Extra stops this week are route rate — $30–$45 off each extra.
- Do NOT apply the September 20 percent on 2+ stop owner jobs. Route rate is the owner deal.
- Deposit: $50 one stop, $75 two, $100 three or more. Combo starts at $75 and steps up.

HOW TO TALK
- One question at a time.
- Order: (1) pack — turns, leaves, or both (2) how many addresses this week (3) size only if they said bags / trashed / whole building (4) name on the invoice (5) 10-digit phone (6) first street address — rest stack on the same code (7) day or ASAP (8) book_stop.
- Never re-ask a field already on the desk snapshot.
- book_stop REQUIRES name, 10-digit phone, and a street address. Pass pack and stops so the quote matches.
- When booked, read back: pack, how many stops, dollar range, day, job number, deposit. Then stop selling.
- Keep replies under 45 words. Straight. No filler.
- Owner cell if they insist: ${PHONE}.`;

function asPack(v: unknown): LandlordPack | undefined {
  const s = String(v || "");
  if (s === "turns" || s === "leaves" || s === "combo") return s;
  return undefined;
}

function fillPack(lead: ShopLead): ShopLead {
  const next = { ...lead };
  if (!next.pack) return next;
  next.desk = "landlord";
  next.service = packService(next.pack);
  if (!next.size) next.size = packDefaultSize(next.pack);
  if (!next.stops) next.stops = 1;
  return next;
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
          addOns: { type: "array", items: { type: "string" }, description: "Same-stop extras on a leaf job: gutters-here, gutters-wrap, porch-piece." },
          pack: { type: "string", enum: ["turns", "leaves", "combo"] },
          stops: { type: "integer", description: "How many units, yards, or addresses this week." },
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
          addOns: { type: "array", items: { type: "string" } },
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
          pack: { type: "string", enum: ["turns", "leaves", "combo"] },
          stops: { type: "integer" },
          addOns: { type: "array", items: { type: "string" } },
        },
        required: ["service", "size", "name", "phone", "address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_job",
      description: "Look up bookings by the phone they booked with, or a job number.",
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
  if (lead.desk === "landlord") {
    if (!lead.pack) m.push("pack");
    if (!lead.stops || lead.stops < 1) m.push("stops");
  }
  if (!lead.service || lead.service === "other") m.push("service");
  if (!lead.size) m.push("size");
  if (!lead.name || lead.name.trim().length < 2) m.push("name");
  if (!lead.phone || !isUsPhone(lead.phone)) m.push("phone");
  if (!lead.address || lead.address.trim().length < 5) m.push("address");
  const extraNeed = (lead.desk === "landlord" || lead.pack) && (lead.stops ?? 1) > 1 ? (lead.stops ?? 1) - 1 : 0;
  const extraHave = (lead.extraAddresses ?? []).filter((a) => a.trim().length >= 5).length;
  if (extraNeed > extraHave) m.push("extras");
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
    if (lead.pack === "leaves" || lead.service === "leaf-cleanup")
      return "City lot, corner, half acre, or an acre? Square footage is even better.";
    if (lead.pack) return "Typical unit, trashed, or a whole building?";
    if (lead.service === "gutter-cleaning") return "House or a whole complex?";
    return "One item, a few pieces, or a truckload?";
  }
  if (first === "name") return lead.pack ? "Name on the invoice?" : "Name on the job?";
  if (first === "phone") return "Ten-digit phone we'll text the morning of?";
  if (first === "address") {
    return lead.stops && lead.stops > 1
      ? "First street address — then I'll take the rest, one per stop."
      : "Street address for the stop?";
  }
  if (first === "extras") {
    const have = (lead.extraAddresses ?? []).filter((a) => a.trim().length >= 5).length;
    return `Street for stop ${have + 2}? Same week, same code.`;
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
  if (Array.isArray(args.addOns)) next.addOns = parseAddOns(args.addOns.map(String));
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

async function runTool(name: string, raw: string, lead: ShopLead, email: string | null): Promise<string> {
  const args = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
  const service = asService(args.service ?? lead.service);
  const size = String(args.size || lead.size || "");
  const addOns = parseAddOns(
    Array.isArray(args.addOns) ? args.addOns.map(String) : (lead.addOns ?? []),
  );

  if (name === "quote_job") {
    const pack = asPack(args.pack) ?? lead.pack;
    const stops = clampStops(args.stops ?? lead.stops ?? 1);
    const q = estimate({
      service: pack ? packService(pack) : service,
      size: size || (pack ? packDefaultSize(pack) : "single"),
      addOns,
      pack,
      stops,
      earlyBird: isPromoActive(),
    });
    return JSON.stringify({
      range: q.range ? formatRange(q.range) : null,
      lines: q.lines.map((l) => `${l.label} ${formatRange(l.range)}`),
      promo: q.appliedDiscount,
      deposit: q.deposit,
      pack: pack ?? null,
      stops,
    });
  }

  if (name === "open_days") {
    const fill = await loadFill();
    const need = slotsFor(service, size, addOns);
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
    const extras = [
      ...(Array.isArray(args.extraAddresses) ? args.extraAddresses.map(String) : []),
      ...(lead.extraAddresses ?? []),
    ]
      .map((a) => a.trim())
      .filter((a, i, arr) => a.length >= 5 && arr.indexOf(a) === i);
    const gap = missingOf({
      ...lead,
      service,
      size,
      name: nameOnJob,
      phone,
      address,
      extraAddresses: extras,
      day: String(args.day || lead.day || ""),
      asap: args.asap === true || lead.asap === true,
    });
    if (gap.length) {
      return JSON.stringify({ ok: false, missing: gap, ask: nextAsk(gap, lead) });
    }
    try {
      const held = await lockWithDeposit({
        data: {
          source: "chat",
          name: nameOnJob,
          phone,
          address,
          extraAddresses: extras,
          email: String(args.email || lead.email || email || ""),
          service,
          jobSize: size || "single",
          preferredDate: String(args.day || lead.day || ""),
          asap: Boolean(args.asap ?? lead.asap ?? true) && !args.day && !lead.day,
          notes: lead.pack
            ? `Landlord desk · ${lead.stops ?? 1} ${lead.pack}`
            : addOns.length
              ? `Shop line · ${addOns.join(",")}`
              : "Shop line",
          pack: lead.pack,
          stops: lead.pack ? lead.stops ?? 1 : 1,
          addOns: lead.pack ? [] : addOns,
        },
      });
      if (!held.ok) {
        return JSON.stringify({ ok: false, error: held.error });
      }
      return JSON.stringify({
        ok: true,
        day: held.preferredDate,
        dayLabel: held.preferredDate ? formatDayLong(held.preferredDate) : null,
        code: `#${held.id}`,
        id: held.id,
        payUrl: held.url,
        deposit: held.deposit,
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
    lead.pack ? `pack=${lead.pack}` : null,
    lead.stops && lead.stops > 1 ? `stops=${lead.stops}` : null,
    lead.service ? `service=${lead.service}` : null,
    lead.size ? `size=${lead.size}` : null,
    lead.addOns?.length ? `addons=${lead.addOns.join(",")}` : null,
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
): Promise<{ text: string; booked?: { day: string; code: string }; lead: ShopLead }> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { text: "", lead };

  let current = fillPack({ ...lead });
  const messages: GrokMessage[] = [
    { role: "system", content: current.desk === "landlord" || current.pack ? LANDLORD_SYSTEM : SYSTEM },
    { role: "system", content: deskSnapshot(current) },
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
    const body = (await res.json()) as { choices: { message: GrokMessage }[] };
    const msg = body.choices[0]?.message;
    if (!msg) return { text: "", booked, lead: current };
    if (msg.tool_calls?.length) {
      messages.push(msg);
      for (const call of msg.tool_calls) {
        const result = await runTool(call.function.name, call.function.arguments || "{}", current, email);
        current = applyToolToLead(current, call.function.name, call.function.arguments || "{}", result);
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
    return { text: (msg.content || "").trim(), booked, lead: current };
  }
  return { text: "", booked, lead: current };
}

function guessService(text: string, lead?: ShopLead): ServiceKey | undefined {
  const t = text.toLowerCase();
  if (/(leaf|yard|rake|bag of leaves|lawn)/.test(t)) return "leaf-cleanup";
  if (/gutter/.test(t)) {
    if (lead?.service === "leaf-cleanup" || hasGutterBundle(lead?.addOns)) return "leaf-cleanup";
    return "gutter-cleaning";
  }
  if (/(junk|couch|sofa|mattress|fridge|furniture|appliance|dresser|cleanout|haul)/.test(t)) {
    return "junk-removal";
  }
  return undefined;
}

function guessSize(service: ServiceKey, text: string): string | undefined {
  const t = text.toLowerCase();
  const sizes = sizeOptionsFor(service).filter((s) => !s.hide);
  for (const s of sizes) {
    if (t.includes(s.value) || t.includes(s.label.toLowerCase())) return s.value;
  }
  if (service === "junk-removal" || service === "furniture-appliances") {
    if (/(couch|sofa|mattress|recliner|loveseat|sectional|sleeper)/.test(t)) return "single";
    if (/(fridge|refrigerator|freezer|washer|dryer|stove|oven|dishwasher|appliance)/.test(t))
      return "quarter";
    if (/(dresser|table|bed frame|headboard|nightstand|chair|grill|tv|bicycle|bike|treadmill|microwave)/.test(t))
      return "single";
    if (/(two trips|overflow|whole garage|whole house|estate|building)/.test(t)) return "overflow";
    if (/(full load|whole truck|full truck)/.test(t)) return "full";
    if (/(half)/.test(t)) return "half";
    if (/(few pieces|quarter)/.test(t)) return "quarter";
    if (/(few bags|bags of)/.test(t)) return "bags";
    if (/\bbags\b/.test(t) && !/leaf|leaves|yard/.test(t)) return "bags";
  }
  if (service === "leaf-cleanup") {
    if (/(half[\s-]?acre|½[\s-]?acre)/.test(t)) return "half";
    if (/(two acres|2 acres|acreage|tree-heavy)/.test(t)) return "acreage";
    if (/(one acre|an acre|1 acre|\bacre\b)/.test(t)) return "acre";
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

  const extras = [...(lead.addOns ?? [])];
  const saysLeaves = /(leaf|yard|rake|bag of leaves|lawn)/.test(t);
  const wantsGutters = /gutter/.test(t);
  const wantsPorch =
    /(couch on the porch|the porch piece|grab the couch|take the couch|and the couch)/.test(t);
  const leafContext =
    lead.service === "leaf-cleanup" || saysLeaves || lead.pack === "leaves";
  if (!next.pack && leafContext && wantsGutters) {
    extras.push(
      /(wraparound|wrap around|split|long runs)/.test(t) ? "gutters-wrap" : "gutters-here",
    );
    next.service = "leaf-cleanup";
  }
  if (!next.pack && leafContext && wantsPorch) {
    extras.push("porch-piece");
    next.service = "leaf-cleanup";
  }
  if (extras.length) next.addOns = normalizeAddOns(extras);

  const service = guessService(text, next);
  if (service) {
    if (
      service === "gutter-cleaning" &&
      (next.service === "leaf-cleanup" || hasGutterBundle(next.addOns))
    ) {
      next.service = "leaf-cleanup";
    } else {
      next.service = service;
    }
  }
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
  const spoken = parseSpokenDay(text);
  if (spoken?.asap) next.asap = true;
  if (spoken?.day) {
    next.day = spoken.day;
    next.asap = false;
  }

  const missing = missingOf(next);
  if (missing.includes("name") && !next.name) {
    const before = phone && phone.index != null ? text.slice(0, phone.index) : text;
    const guessed = looksLikeName(before) || looksLikeName(text);
    if (guessed) next.name = guessed;
  }
  if (missing.includes("address") && !next.address) {
    const loose = text.match(/\b\d{1,5}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,6}\b/);
    if (loose && !isUsPhone(loose[0]) && loose[0].length >= 5) next.address = loose[0].trim();
  }
  return fillPack(next);
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

  if (wantBook && missing.includes("day")) next.asap = true;
  const gap = missingOf(next);

  if (wantBook && gap.length === 0) {
    try {
      const held = await lockWithDeposit({
        data: {
          source: "chat",
          name: next.name as string,
          phone: next.phone as string,
          address: next.address as string,
          extraAddresses: next.extraAddresses,
          email: next.email || email || "",
          service: next.service as ServiceKey,
          jobSize: next.size,
          preferredDate: next.day || "",
          asap: next.asap !== false,
          notes: next.pack ? `Landlord desk · ${next.stops ?? 1} ${next.pack}` : next.addOns?.length ? `Shop line · ${next.addOns.join(",")}` : "Shop line",
          pack: next.pack,
          stops: next.pack ? next.stops ?? 1 : 1,
          addOns: next.pack ? [] : next.addOns,
        },
      });
      if (!held.ok) {
        return { text: held.error, lead: next };
      }
      const q = estimate({
        service: next.service as ServiceKey,
        size: next.size as string,
        addOns: next.addOns ?? [],
        pack: next.pack,
        stops: next.stops,
        earlyBird: isPromoActive(),
      });
      const range = q.range ? formatRange(q.range) : "we'll confirm on site";
      const day = held.preferredDate || next.day || "";
      return {
        text: `Job #${held.id}. ${serviceLabel(next.service)} ${day ? formatDayLong(day) : "first open day"}. ${range}. Put $${held.deposit} on the card to hold it — comes off the invoice: ${held.url}`,
        lead: { ...next, booked: true, code: `#${held.id}`, bookedDay: day, day },
      };
    } catch (err) {
      return { text: err instanceof Error ? err.message : "Couldn't hold the day.", lead: next };
    }
  }

  if (next.service && next.size && gap.length) {
    const q = estimate({
      service: next.service,
      size: next.size,
      addOns: next.addOns ?? [],
      pack: next.pack,
      stops: next.stops,
      earlyBird: isPromoActive(),
    });
    const fill = await loadFill();
    const asap = firstOpenDay(fill, slotsFor(next.service, next.size, next.addOns ?? []));
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
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(800) }))
          .max(16),
        lead: leadSchema.optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const incoming: ShopLead = {
      ...(data.lead ?? {}),
      asap: data.lead?.asap ?? true,
      addOns: parseAddOns(data.lead?.addOns),
    };
    if (!incoming.email && context.email) incoming.email = context.email;
    const lastUser = data.turns.filter((t) => t.role === "user").at(-1)?.content ?? "";
    const merged = fillPack(absorb(incoming, lastUser));
    const ai = await grokLoop(data.turns, merged, context.email).catch(
      (): { text: string; booked?: { day: string; code: string }; lead: ShopLead } => ({
        text: "",
        lead: merged,
      }),
    );
    const leadOut = { ...merged, ...ai.lead };
    if (ai.booked) {
      const text =
        ai.text || `Locked ${formatDayLong(ai.booked.day)}. ${ai.booked.code}. We'll text the morning of.`;
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
    return fallbackReply(data.turns, leadOut, context.email);
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
