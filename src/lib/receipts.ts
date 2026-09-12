/**
 * Receipt scanning — photo or PDF in, booked expense out.
 *
 * The model READS the document and RECOMMENDS a category from the pricebook's
 * expense list; the server decides everything with tax consequence:
 *   - cents are parsed and re-validated here, never trusted as free text
 *   - the category must exist in EXPENSE_CATEGORIES or it becomes "other"
 *   - the cost phase (start-up / equipment / operating) is computed from the
 *     owner's business-start setting, not guessed
 *   - identical bytes (sha256) and same vendor+date+total are refused as
 *     duplicates and handed back for the owner to confirm
 *
 * The receipt bytes live in Postgres beside the expense. `extracted` keeps
 * the raw model output so an audit can see what was read before any edit.
 */
import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { DEFAULT_BUSINESS_START, EXPENSE_CATEGORIES, phaseFor, type CostPhase } from "@/lib/tax";

/**
 * Receipts are few (dozens a year) and every cent matters, so this uses the
 * most capable model rather than the chat model. Cost per scan is a few cents.
 */
export const RECEIPT_MODEL = "claude-sonnet-5";

const MAX_BYTES = 4_500_000; // Netlify sync function body limit is 6 MB; base64 adds a third
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

const scanInput = z.object({
  dataUrl: z.string().min(64).max(6_500_000),
  bookingId: z.number().int().positive().nullable().optional(),
  note: z.string().trim().max(400).optional(),
});

export type ScanResult =
  | {
      status: "booked" | "needs-review";
      expenseId: number;
      receiptId: number;
      extracted: Extracted;
      phase: CostPhase;
    }
  | { status: "duplicate"; receiptId: number | null; expenseId: number | null; extracted: Extracted | null; message: string }
  | { status: "not-a-receipt"; receiptId: number; extracted: Extracted | null; message: string }
  | { status: "rebate"; receiptId: number; extracted: Extracted; rebate: PendingRebate; message: string }
  | { status: "error"; message: string };

/** A rebate slip the owner still has to mail in / is waiting on. Stored in owner_settings as `rebate:<receiptId>`. */
export type PendingRebate = {
  receiptId: number;
  vendor: string;
  cents: number;
  rebateNumber: string | null;
  purchaseDate: string | null;
  mailBy: string | null;
  createdAt: string;
};

export type Extracted = {
  isReceipt: boolean;
  documentType: string;
  vendor: string;
  date: string | null;
  totalCents: number;
  taxCents: number | null;
  category: string;
  paidWith: "card" | "cash" | "check" | "unknown";
  items: { description: string; qty: number | null; amountCents: number | null; serial: string | null }[];
  confidence: "high" | "medium" | "low";
  summary: string;
  rebateCents: number | null;
  rebateNumber: string | null;
  mailBy: string | null;
};

const extractedSchema = z.object({
  is_receipt: z.boolean(),
  document_type: z.string().max(40).default("receipt"),
  vendor: z.string().max(120).default(""),
  date: z.string().max(20).nullable().default(null),
  total_cents: z.number().int().min(0).max(100_000_000).default(0),
  tax_cents: z.number().int().min(0).max(100_000_000).nullable().default(null),
  category: z.string().max(40).default("other"),
  paid_with: z.enum(["card", "cash", "check", "unknown"]).default("unknown"),
  items: z
    .array(
      z.object({
        description: z.string().max(160),
        qty: z.number().nullable().default(null),
        amount_cents: z.number().int().nullable().default(null),
        serial: z.string().max(60).nullable().default(null),
      }),
    )
    .max(60)
    .default([]),
  confidence: z.enum(["high", "medium", "low"]).default("medium"),
  summary: z.string().max(240).default(""),
  rebate_cents: z.number().int().min(0).max(100_000_000).nullable().default(null),
  rebate_number: z.string().max(40).nullable().default(null),
  mail_by: z.string().max(20).nullable().default(null),
});

function systemPrompt(businessStart: string) {
  const cats = EXPENSE_CATEGORIES.map((c) => `- "${c.key}": ${c.label}. ${c.hint}`).join("\n");
  return `You read receipts, invoices and statements for Pick It Up E LLC, a one-truck leaf-cleanup, junk-hauling and single-story gutter-cleaning business in Grand Forks, North Dakota. The business opened ${businessStart}.

Return ONLY a JSON object, no prose, no code fence, with exactly these keys:
{
  "is_receipt": boolean,            // true only for proof of a completed business purchase. false for rebate slips, menus, flyers, photos of a yard
  "document_type": "receipt" | "invoice" | "statement" | "order-confirmation" | "rebate" | "other",
  "vendor": string,                 // the seller, e.g. "Acme Tools", "Menards", "Grand Forks Landfill"
  "date": "YYYY-MM-DD" | null,      // the purchase/transaction date printed on it; null if none
  "total_cents": integer,           // the amount actually paid, in cents (grand total incl. tax, after discounts)
  "tax_cents": integer | null,      // sales tax in cents if shown
  "category": string,               // exactly one key from the list below
  "paid_with": "card" | "cash" | "check" | "unknown",
  "items": [{"description": string, "qty": number|null, "amount_cents": integer|null, "serial": string|null}],
  "confidence": "high" | "medium" | "low",
  "summary": string,                // one line a bookkeeper would write, e.g. "Backpack blower, Hackzall kit, 3 batteries, 2 blades"
  "rebate_cents": integer | null,   // ONLY for document_type "rebate": the rebate amount owed back, in cents
  "rebate_number": string | null,   // ONLY for rebates: the offer / rebate number printed on it (e.g. "5003")
  "mail_by": "YYYY-MM-DD" | null    // ONLY for rebates: the deadline to submit, if stated (e.g. "one year from purchase date" → purchase date + 1 year)
}

Category keys:
${cats}

Rules:
- A Menards "Rebate Receipt" / 11% rebate slip, a mail-in rebate form, or a rebate confirmation is document_type "rebate" with is_receipt false: fill vendor, date (the purchase date printed on it), rebate_cents, rebate_number, mail_by, and set total_cents to 0. It is NOT the purchase receipt.
- Durable tools and machines (blowers, saws, batteries, chargers, vacuums, trailers, ladders) are "equipment", even when several are on one receipt.
- Consumables (bags, tarps, straps, gloves, blades, fuel cans, oil) are "supplies". A receipt that is mostly equipment with a few consumables is "equipment".
- Landfill / transfer-station / tipping fees are "dump-fees".
- Gasoline for the truck is "fuel". Printing, signs, door hangers, ads are "advertising". Insurance premiums are "insurance". Government filing fees, permits, WSI are "taxes".
- Serial numbers matter for equipment (warranty, insurance): capture any serial or "S/N" printed next to an item.
- If the total is illegible or two totals conflict, set confidence "low" and pick the one labeled total/balance/amount paid.
- Never invent a vendor or date. Use null and lower the confidence.`;
}

function dataUrlToBuffer(dataUrl: string): { mime: string; buf: Buffer } | null {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) return null;
  const mime = m[1].toLowerCase();
  if (!ALLOWED.has(mime)) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return null;
  return { mime, buf };
}

async function callModel(mime: string, base64: string, businessStart: string, hint?: string): Promise<{ raw: string; parsed: Extracted | null }> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) throw new Error("Receipt scanning isn't configured (ANTHROPIC_API_KEY).");
  const doc =
    mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
      : { type: "image", source: { type: "base64", media_type: mime, data: base64 } };
  const content: unknown[] = [doc, { type: "text", text: hint ? `Owner's note: ${hint}\n\nRead this document.` : "Read this document." }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: RECEIPT_MODEL,
      max_tokens: 1200,
      system: systemPrompt(businessStart),
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    console.error(`[receipts] anthropic ${res.status}: ${detail.slice(0, 300)}`);
    throw new Error(`The scanner is unavailable right now (${res.status}). Add the expense by hand and attach the photo later.`);
  }
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = (body.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("")
    .trim();
  const jsonText = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  let parsed: Extracted | null = null;
  try {
    const obj = extractedSchema.parse(JSON.parse(jsonText));
    const category = EXPENSE_CATEGORIES.some((c) => c.key === obj.category) ? obj.category : "other";
    const date = obj.date && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : null;
    parsed = {
      isReceipt: obj.is_receipt,
      documentType: obj.document_type,
      vendor: obj.vendor.trim(),
      date,
      totalCents: obj.total_cents,
      taxCents: obj.tax_cents,
      category,
      paidWith: obj.paid_with,
      items: obj.items.map((i) => ({ description: i.description, qty: i.qty, amountCents: i.amount_cents, serial: i.serial })),
      confidence: obj.confidence,
      summary: obj.summary.trim(),
      rebateCents: obj.rebate_cents,
      rebateNumber: obj.rebate_number?.trim() || null,
      mailBy: obj.mail_by && /^\d{4}-\d{2}-\d{2}$/.test(obj.mail_by) ? obj.mail_by : null,
    };
  } catch (err) {
    console.error("[receipts] could not parse model output:", err, raw.slice(0, 200));
  }
  return { raw, parsed };
}

async function ownerSql(email: string | null | undefined): Promise<Sql> {
  if (!isOwnerEmail(email)) throw new Error("Forbidden");
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  return sql;
}

async function businessStart(sql: Sql): Promise<string> {
  const rows = await sql.query<{ value: string }>("select value from owner_settings where key = 'business.startDate'");
  const v = rows[0]?.value;
  return v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : DEFAULT_BUSINESS_START;
}

export const scanReceipt = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => scanInput.parse(input))
  .handler(async ({ data, context }): Promise<ScanResult> => {
    const sql = await ownerSql(context.email);
    const file = dataUrlToBuffer(data.dataUrl);
    if (!file) return { status: "error", message: "That file isn't a JPG, PNG, WebP or PDF under 4.5 MB." };

    const sha = createHash("sha256").update(file.buf).digest("hex");
    const dupBytes = await sql.query<{ id: number; expense_id: number | null }>(
      "select id, expense_id from receipts where sha256 = $1",
      [sha],
    );
    if (dupBytes[0]?.expense_id) {
      return {
        status: "duplicate",
        receiptId: dupBytes[0].id,
        expenseId: dupBytes[0].expense_id,
        extracted: null,
        message: `This exact photo is already booked as expense #${dupBytes[0].expense_id}.`,
      };
    }
    // Same bytes, but nothing was booked from them last time (unreadable, or a
    // rebate slip before rebates were understood): read it again and reuse the row.
    const orphan = dupBytes[0] ?? null;
    if (orphan) {
      const pending = await sql.query<{ key: string }>("select key from owner_settings where key = $1", [`rebate:${orphan.id}`]);
      if (pending[0]) {
        return { status: "duplicate", receiptId: orphan.id, expenseId: null, extracted: null, message: "That rebate slip is already tracked under \"Rebates owed\" on the Books page." };
      }
    }

    const start = await businessStart(sql);
    const { raw, parsed } = await callModel(file.mime, file.buf.toString("base64"), start, data.note);

    // Store the bytes first, whatever the model said — a receipt that failed to
    // parse is still a receipt the owner wants kept.
    const extractedJson = JSON.stringify({ model: RECEIPT_MODEL, raw, parsed });
    let receipt: { id: number };
    if (orphan) {
      await sql.query("update receipts set extracted = $2 where id = $1", [orphan.id, extractedJson]);
      receipt = { id: orphan.id };
    } else {
      const inserted = await sql.query<{ id: number }>(
        `insert into receipts (mime, bytes, byte_size, sha256, extracted) values ($1, $2, $3, $4, $5) returning id`,
        [file.mime, file.buf, file.buf.byteLength, sha, extractedJson],
      );
      receipt = inserted[0];
    }

    if (parsed && parsed.documentType === "rebate" && (parsed.rebateCents ?? 0) > 0) {
      const mailBy = parsed.mailBy ?? (parsed.date ? addOneYear(parsed.date) : null);
      const rebate: PendingRebate = {
        receiptId: receipt.id,
        vendor: parsed.vendor || "Rebate",
        cents: parsed.rebateCents ?? 0,
        rebateNumber: parsed.rebateNumber,
        purchaseDate: parsed.date,
        mailBy,
        createdAt: new Date().toISOString(),
      };
      await sql.query(
        `insert into owner_settings (key, value, updated_at) values ($1, $2, now())
         on conflict (key) do update set value = excluded.value, updated_at = now()`,
        [`rebate:${receipt.id}`, JSON.stringify(rebate)],
      );
      const implied = Math.round(rebate.cents / 0.11);
      return {
        status: "rebate",
        receiptId: receipt.id,
        extracted: parsed,
        rebate,
        message: `${rebate.vendor} rebate slip — $${(rebate.cents / 100).toFixed(2)} owed back to you${rebate.rebateNumber ? ` (rebate #${rebate.rebateNumber})` : ""}${rebate.purchaseDate ? ` on the ${rebate.purchaseDate} purchase` : ""}${/menards/i.test(rebate.vendor) ? `, which puts that purchase near $${(implied / 100).toFixed(2)} before tax` : ""}. Tracked under "Rebates owed" on the Books page${mailBy ? ` — mail it by ${mailBy}` : ""}. The purchase itself needs the long register receipt.`,
      };
    }

    if (!parsed || !parsed.isReceipt || parsed.totalCents <= 0) {
      const kind = parsed?.documentType && parsed.documentType !== "other" ? parsed.documentType.replaceAll("-", " ") : "document";
      return {
        status: "not-a-receipt",
        receiptId: receipt.id,
        extracted: parsed,
        message: parsed && !parsed.isReceipt
          ? `That's ${/^[aeiou]/i.test(kind) ? "an" : "a"} ${kind}, not a purchase receipt. Kept the file; add the expense by hand if it belongs.`
          : "Couldn't read a total off it. Kept the file; add the amount by hand.",
      };
    }

    const today = new Date().toISOString().slice(0, 10);
    let spentOn = parsed.date ?? today;
    let review: "auto" | "needs-review" = parsed.confidence === "high" ? "auto" : "needs-review";
    if (spentOn > today) {
      spentOn = today;
      review = "needs-review";
    }
    if (!parsed.date) review = "needs-review";

    // Same vendor, same day, same total already on the books → don't double-book.
    const dupRow = await sql.query<{ id: number }>(
      `select id from expenses where spent_on = $1 and amount_cents = $2 and lower(coalesce(vendor,'')) = lower($3) limit 1`,
      [spentOn, parsed.totalCents, parsed.vendor],
    );
    if (dupRow[0]) {
      return {
        status: "duplicate",
        receiptId: receipt.id,
        expenseId: dupRow[0].id,
        extracted: parsed,
        message: `${parsed.vendor || "This vendor"} · $${(parsed.totalCents / 100).toFixed(2)} on ${spentOn} is already expense #${dupRow[0].id}. Kept the photo; tap "Book anyway" if it really is a second purchase.`,
      };
    }

    const phase = phaseFor(parsed.category, spentOn, start);
    const paidWith = parsed.paidWith === "unknown" ? null : parsed.paidWith;
    const serials = parsed.items.filter((i) => i.serial).map((i) => `${i.description.slice(0, 40)} S/N ${i.serial}`);
    const note = [parsed.summary, ...serials, data.note].filter(Boolean).join(" · ").slice(0, 400);

    const [expense] = await sql.query<{ id: number }>(
      `insert into expenses (spent_on, vendor, category, amount_cents, paid_with, booking_id, note, receipt_id, phase, tax_cents, review, line_items)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
      [
        spentOn,
        parsed.vendor || null,
        parsed.category,
        parsed.totalCents,
        paidWith,
        data.bookingId ?? null,
        note || null,
        receipt.id,
        phase,
        parsed.taxCents,
        review,
        JSON.stringify(parsed.items),
      ],
    );
    await sql.query("update receipts set expense_id = $2 where id = $1", [receipt.id, expense.id]);
    if (data.bookingId) {
      await logEvent(sql, data.bookingId, "system", `Receipt booked: ${parsed.vendor} $${(parsed.totalCents / 100).toFixed(2)} · ${parsed.category}`);
    }
    return { status: review === "auto" ? "booked" : "needs-review", expenseId: expense.id, receiptId: receipt.id, extracted: parsed, phase };
  });

/** Owner confirmed a flagged duplicate really is a second purchase. */
export const bookReceiptAnyway = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ receiptId: z.number().int().positive(), bookingId: z.number().int().positive().nullable().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const rows = await sql.query<{ id: number; extracted: unknown; expense_id: number | null }>(
      "select id, extracted, expense_id from receipts where id = $1",
      [data.receiptId],
    );
    const r = rows[0];
    if (!r) throw new Error("No such receipt");
    if (r.expense_id) return { ok: true as const, expenseId: r.expense_id };
    const ex = (typeof r.extracted === "string" ? JSON.parse(r.extracted) : r.extracted) as { parsed?: Extracted | null } | null;
    const p = ex?.parsed;
    if (!p || p.totalCents <= 0) throw new Error("Nothing readable on that receipt — add it by hand.");
    const start = await businessStart(sql);
    const spentOn = p.date ?? new Date().toISOString().slice(0, 10);
    const [expense] = await sql.query<{ id: number }>(
      `insert into expenses (spent_on, vendor, category, amount_cents, paid_with, booking_id, note, receipt_id, phase, tax_cents, review, line_items)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'reviewed',$11) returning id`,
      [spentOn, p.vendor || null, p.category, p.totalCents, p.paidWith === "unknown" ? null : p.paidWith, data.bookingId ?? null, p.summary || null, r.id, phaseFor(p.category, spentOn, start), p.taxCents, JSON.stringify(p.items)],
    );
    await sql.query("update receipts set expense_id = $2 where id = $1", [r.id, expense.id]);
    return { ok: true as const, expenseId: expense.id };
  });

/** Owner edits after a scan (or any expense). Marks it reviewed. */
export const updateExpense = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        spentOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        vendor: z.string().trim().max(120).nullable().optional(),
        category: z.enum(EXPENSE_CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
        amountCents: z.number().int().min(1).max(100_000_000).optional(),
        paidWith: z.enum(["card", "checking", "personal", "cash", "check"]).nullable().optional(),
        bookingId: z.number().int().positive().nullable().optional(),
        note: z.string().trim().max(400).nullable().optional(),
        phase: z.enum(["startup", "equipment", "operating"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const cur = await sql.query<{ spent_on: string; category: string; phase: string | null }>(
      "select spent_on, category, phase from expenses where id = $1",
      [data.id],
    );
    if (!cur[0]) throw new Error("No such expense");
    const start = await businessStart(sql);
    const spentOn = data.spentOn ?? cur[0].spent_on;
    const category = data.category ?? cur[0].category;
    const phase = data.phase ?? phaseFor(category, spentOn, start);
    const sets: string[] = ["review = 'reviewed'", "phase = $2"];
    const vals: unknown[] = [data.id, phase];
    const put = (col: string, v: unknown) => {
      vals.push(v);
      sets.push(`${col} = $${vals.length}`);
    };
    if (data.spentOn !== undefined) put("spent_on", data.spentOn);
    if (data.vendor !== undefined) put("vendor", data.vendor);
    if (data.category !== undefined) put("category", data.category);
    if (data.amountCents !== undefined) put("amount_cents", data.amountCents);
    if (data.paidWith !== undefined) put("paid_with", data.paidWith);
    if (data.bookingId !== undefined) put("booking_id", data.bookingId);
    if (data.note !== undefined) put("note", data.note);
    await sql.query(`update expenses set ${sets.join(", ")} where id = $1`, vals);
    return { ok: true as const, phase };
  });

function addOneYear(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${y + 1}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Rebate arrived (or the owner gave up on it). "received" books the credit as a
 * negative expense in the category of the original purchase — a vendor rebate
 * is a purchase-price adjustment, not income — and the receipt of the check
 * can be snapped and attached later like any other document.
 */
export const resolveRebate = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        receiptId: z.number().int().positive(),
        action: z.enum(["received", "dismiss"]),
        category: z.enum(EXPENSE_CATEGORIES.map((c) => c.key) as [string, ...string[]]).optional(),
        receivedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        amountCents: z.number().int().min(1).max(100_000_000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const rows = await sql.query<{ value: string }>("select value from owner_settings where key = $1", [`rebate:${data.receiptId}`]);
    if (!rows[0]) return { ok: true as const, expenseId: null };
    const rebate = JSON.parse(rows[0].value) as PendingRebate;
    let expenseId: number | null = null;
    if (data.action === "received") {
      const cents = data.amountCents ?? rebate.cents;
      const category = data.category ?? "equipment";
      const on = data.receivedOn ?? new Date().toISOString().slice(0, 10);
      const start = await businessStart(sql);
      const [row] = await sql.query<{ id: number }>(
        `insert into expenses (spent_on, vendor, category, amount_cents, paid_with, note, receipt_id, phase, review)
         values ($1,$2,$3,$4,null,$5,$6,$7,'reviewed') returning id`,
        [
          on,
          rebate.vendor,
          category,
          -Math.abs(cents),
          `Rebate received${rebate.rebateNumber ? ` #${rebate.rebateNumber}` : ""}${rebate.purchaseDate ? ` on ${rebate.purchaseDate} purchase` : ""} — reduces that cost`,
          rebate.receiptId,
          phaseFor(category, rebate.purchaseDate ?? on, start),
        ],
      );
      expenseId = row.id;
      await sql.query("update receipts set expense_id = $2 where id = $1 and expense_id is null", [rebate.receiptId, row.id]);
    }
    await sql.query("delete from owner_settings where key = $1", [`rebate:${data.receiptId}`]);
    return { ok: true as const, expenseId };
  });

/** Bytes for /api/receipt/$id — server-only helper. */
export async function readReceipt(id: number): Promise<{ mime: string; bytes: Buffer } | null> {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  const rows = await sql.query<{ mime: string; bytes: Buffer | Uint8Array }>("select mime, bytes from receipts where id = $1", [id]);
  const r = rows[0];
  if (!r) return null;
  return { mime: r.mime, bytes: Buffer.isBuffer(r.bytes) ? r.bytes : Buffer.from(r.bytes) };
}
