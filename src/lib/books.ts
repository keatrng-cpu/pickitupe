/**
 * Owner books — server functions behind /jobs, /jobs/$id, /jobs/books and
 * /jobs/customers. Every handler is gated on the owner email; nothing here is
 * reachable by a customer session.
 *
 * Money is integer cents end to end. Dates are 'YYYY-MM-DD' strings (db.ts
 * normalises `date` columns to that on both backends).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { BOOKING_SELECT, ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { HOME } from "@/lib/service-area";
import { todayISO } from "@/lib/schedule";
import {
  DEFAULT_BUSINESS_START,
  DEFAULT_RESERVE_PCT,
  EXPENSE_CATEGORIES,
  mileageDeductionCents,
  mileageRateFor,
  phaseFor,
  selfEmploymentTaxCents,
  suggestedTripMiles,
  type CostPhase,
} from "@/lib/tax";
import type { BookingRow } from "@/lib/bookings";

// ---------------------------------------------------------------------------
// Types the pages consume
// ---------------------------------------------------------------------------

export type OwnerBookingRow = BookingRow & {
  source: string | null;
  final_cents: number | null;
  owner_notes: string | null;
  completed_at: string | null;
  last_contact_at: string | null;
  paid_cents: number;
};

export type BookingEvent = {
  id: number;
  booking_id: number;
  kind: string;
  body: string | null;
  created_at: string;
};

export type PaymentRow = {
  id: number;
  booking_id: number | null;
  paid_on: string;
  amount_cents: number;
  method: string;
  kind: string;
  note: string | null;
  customer: string | null;
};

export type ExpenseRow = {
  id: number;
  spent_on: string;
  vendor: string | null;
  category: string;
  amount_cents: number;
  paid_with: string | null;
  booking_id: number | null;
  note: string | null;
  customer: string | null;
  receipt_id: number | null;
  /** Every receipt attached (merged rows carry several). */
  receipt_ids: number[];
  phase: CostPhase | null;
  tax_cents: number | null;
  review: "auto" | "needs-review" | "reviewed" | null;
};

export type TripRow = {
  id: number;
  driven_on: string;
  miles: number;
  purpose: string;
  from_label: string | null;
  to_label: string | null;
  booking_id: number | null;
  rate_cents: number;
  customer: string | null;
};

export type FixedCost = { id: string; label: string; cents: number; deductible: "none" | "full" | "interest" };

export const DEFAULT_FIXED_COSTS: FixedCost[] = [
  { id: "truck", label: "Truck payment (2020 Sierra Denali)", cents: 55_000, deductible: "interest" },
  { id: "warranty", label: "Extended warranty", cents: 22_000, deductible: "none" },
  { id: "auto-ins", label: "Progressive auto ($450 / 6 mo)", cents: 7_500, deductible: "none" },
  { id: "web", label: "Supabase Pro + Netlify + domain", cents: 4_800, deductible: "full" },
];

export type OwnerSettings = {
  businessStart: string;
  /** Start-up equipment budget the owner set aside; Books shows spend against it. */
  budgetCents: number;
  /**
   * Recurring monthly obligations the business must clear before the owner is
   * paid — the truck payment, the extended warranty, insurance. `deductible`
   * says how Schedule C sees each one: 'none' (personal; covered by the
   * mileage rate), 'full' (a business expense you should also log when paid),
   * or 'interest' (only the business share of loan interest — ask the CPA).
   */
  fixedCosts: FixedCost[];
  /** Rebate slips scanned but not yet received — see resolveRebate in receipts.ts. */
  rebates: { receiptId: number; vendor: string; cents: number; rebateNumber: string | null; purchaseDate: string | null; mailBy: string | null; createdAt: string }[];
  homeAddress: string;
  homeLat: number;
  homeLon: number;
  landfillAddress: string;
  landfillLat: number | null;
  landfillLon: number | null;
  reservePct: number;
  checks: Record<string, boolean>;
};

const OWNER_SELECT = `${BOOKING_SELECT}, source, final_cents, owner_notes, completed_at, last_contact_at`;

// ---------------------------------------------------------------------------
// Gate + bootstrap
// ---------------------------------------------------------------------------

async function ownerSql(email: string | null | undefined): Promise<Sql> {
  if (!isOwnerEmail(email)) throw new Error("Forbidden");
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  return sql;
}

const idInput = z.object({ id: z.number().int().positive() });
const yearInput = z.object({ year: z.number().int().min(2024).max(2100) });

function yearRange(year: number) {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

async function loadSettings(sql: Sql): Promise<OwnerSettings> {
  const rows = await sql.query<{ key: string; value: string }>("select key, value from owner_settings");
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const num = (k: string) => {
    const v = map.get(k);
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const checks: Record<string, boolean> = {};
  for (const [k, v] of map) if (k.startsWith("check:")) checks[k.slice(6)] = v === "1";
  const start = map.get("business.startDate");
  const rebates: OwnerSettings["rebates"] = [];
  for (const [k, v] of map) {
    if (!k.startsWith("rebate:")) continue;
    try {
      rebates.push(JSON.parse(v));
    } catch {
      // a malformed row is ignored, not fatal
    }
  }
  rebates.sort((a, b) => (a.mailBy ?? "9999").localeCompare(b.mailBy ?? "9999"));
  let fixedCosts: FixedCost[] = DEFAULT_FIXED_COSTS;
  const fixedRaw = map.get("fixed.costs");
  if (fixedRaw) {
    try {
      const parsed = JSON.parse(fixedRaw);
      if (Array.isArray(parsed)) fixedCosts = parsed;
    } catch {
      // keep defaults
    }
  }
  return {
    rebates,
    fixedCosts,
    budgetCents: num("budget.startCents") ?? 500_000,
    businessStart: start && /^\d{4}-\d{2}-\d{2}$/.test(start) ? start : DEFAULT_BUSINESS_START,
    homeAddress: map.get("home.address") ?? "",
    homeLat: num("home.lat") ?? HOME.lat,
    homeLon: num("home.lon") ?? HOME.lon,
    landfillAddress: map.get("landfill.address") ?? "",
    landfillLat: num("landfill.lat"),
    landfillLon: num("landfill.lon"),
    reservePct: num("tax.reservePct") ?? DEFAULT_RESERVE_PCT,
    checks,
  };
}

// ---------------------------------------------------------------------------
// Dashboard summary (top of /jobs)
// ---------------------------------------------------------------------------

export type OwnerSummary = {
  today: string;
  jobsToday: number;
  jobsThisWeek: number;
  openLeads: number;
  awaitingCard: number;
  collectedYtdCents: number;
  owedCents: number;
  expensesYtdCents: number;
  milesYtd: number;
  mileageDeductionCents: number;
  reservePct: number;
  reserveTargetCents: number;
  needsReply: number;
  needsReview: number;
};

export const getOwnerSummary = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }): Promise<OwnerSummary> => {
    const sql = await ownerSql(context.email);
    const today = todayISO();
    const year = today.slice(0, 4);
    const { from, to } = yearRange(Number(year));
    const settings = await loadSettings(sql);

    const bookings = await sql.query<
      Pick<OwnerBookingRow, "id" | "status" | "preferred_date" | "created_at" | "last_contact_at" | "completed_at" | "final_cents" | "estimate_high"> & { paid_cents: number }
    >(
      `select b.id, b.status, b.preferred_date, b.created_at, b.last_contact_at, b.completed_at,
              b.final_cents, b.estimate_high,
              coalesce((select sum(p.amount_cents) from payments p where p.booking_id = b.id), 0)::int as paid_cents
         from bookings b`,
    );

    const weekEnd = new Date(`${today}T12:00:00Z`);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);
    const weekEndISO = weekEnd.toISOString().slice(0, 10);
    const fourHoursAgo = Date.now() - 4 * 3600_000;
    const twoDaysAgo = Date.now() - 2 * 86400_000;

    let jobsToday = 0, jobsThisWeek = 0, openLeads = 0, awaitingCard = 0, owed = 0, needsReply = 0, needsReview = 0;
    for (const b of bookings) {
      const live = b.status !== "done" && b.status !== "cancelled" && b.status !== "hold";
      if (live && b.preferred_date === today) jobsToday += 1;
      if (live && b.preferred_date && b.preferred_date >= today && b.preferred_date <= weekEndISO) jobsThisWeek += 1;
      if (b.status === "new" || b.status === "quoted") openLeads += 1;
      if (b.status === "hold") awaitingCard += 1;
      if (b.status === "done") {
        const bill = b.final_cents ?? (b.estimate_high != null ? b.estimate_high * 100 : 0);
        owed += Math.max(0, bill - b.paid_cents);
        const doneAt = b.completed_at ? Date.parse(b.completed_at) : NaN;
        if (Number.isFinite(doneAt) && doneAt < twoDaysAgo) {
          // no review ask logged after completion
          needsReview += 1;
        }
      }
      if (b.status === "new" && !b.last_contact_at && Date.parse(b.created_at) < fourHoursAgo) needsReply += 1;
    }
    if (needsReview > 0) {
      const asked = await sql.query<{ n: number }>(
        `select count(distinct e.booking_id)::int as n
           from booking_events e join bookings b on b.id = e.booking_id
          where b.status = 'done' and e.kind = 'text' and e.body ilike '%review%'
            and e.created_at >= coalesce(b.completed_at, b.created_at)`,
      );
      needsReview = Math.max(0, needsReview - (asked[0]?.n ?? 0));
    }

    const [collected] = await sql.query<{ c: number }>(
      `select coalesce(sum(amount_cents), 0)::int as c from payments where paid_on between $1 and $2`,
      [from, to],
    );
    const [spent] = await sql.query<{ c: number }>(
      `select coalesce(sum(amount_cents), 0)::int as c from expenses where spent_on between $1 and $2`,
      [from, to],
    );
    const trips = await sql.query<{ miles: number; rate_cents: number }>(
      `select miles::float8 as miles, rate_cents::float8 as rate_cents from mileage_trips where driven_on between $1 and $2`,
      [from, to],
    );
    const milesYtd = Math.round(trips.reduce((s, t) => s + t.miles, 0) * 10) / 10;

    return {
      today,
      jobsToday,
      jobsThisWeek,
      openLeads,
      awaitingCard,
      collectedYtdCents: collected?.c ?? 0,
      owedCents: owed,
      expensesYtdCents: spent?.c ?? 0,
      milesYtd,
      mileageDeductionCents: mileageDeductionCents(trips),
      reservePct: settings.reservePct,
      reserveTargetCents: Math.round(((collected?.c ?? 0) * settings.reservePct) / 100),
      needsReply,
      needsReview,
    };
  });

// ---------------------------------------------------------------------------
// One job: everything about it
// ---------------------------------------------------------------------------

export type BookingDetail = {
  booking: OwnerBookingRow;
  events: BookingEvent[];
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  trips: TripRow[];
  suggestedMiles: number | null;
  settings: OwnerSettings;
};

export const getBookingDetail = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .validator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }): Promise<BookingDetail | null> => {
    const sql = await ownerSql(context.email);
    const rows = await sql.query<OwnerBookingRow>(
      `select ${OWNER_SELECT},
              coalesce((select sum(p.amount_cents) from payments p where p.booking_id = bookings.id), 0)::int as paid_cents
         from bookings where id = $1`,
      [data.id],
    );
    const booking = rows[0];
    if (!booking) return null;
    const [events, payments, expenses, trips, settings] = await Promise.all([
      sql.query<BookingEvent>(
        `select id, booking_id, kind, body, created_at from booking_events where booking_id = $1 order by created_at desc, id desc limit 200`,
        [data.id],
      ),
      sql.query<PaymentRow>(
        `select id, booking_id, paid_on, amount_cents, method, kind, note, null::text as customer from payments where booking_id = $1 order by paid_on desc, id desc`,
        [data.id],
      ),
      sql.query<ExpenseRow>(
        `select e.id, e.spent_on, e.vendor, e.category, e.amount_cents, e.paid_with, e.booking_id, e.note, null::text as customer, e.receipt_id, e.phase, e.tax_cents, e.review,
                coalesce((select array_to_json(array_agg(r.id order by r.id)) from receipts r where r.expense_id = e.id), '[]'::json) as receipt_ids
           from expenses e where e.booking_id = $1 order by e.spent_on desc, e.id desc`,
        [data.id],
      ),
      sql.query<TripRow>(
        `select id, driven_on, miles::float8 as miles, purpose, from_label, to_label, booking_id, rate_cents::float8 as rate_cents, null::text as customer
           from mileage_trips where booking_id = $1 order by driven_on desc, id desc`,
        [data.id],
      ),
      loadSettings(sql),
    ]);
    const job = booking.lat != null && booking.lon != null ? { lat: booking.lat, lon: booking.lon } : null;
    const landfill =
      settings.landfillLat != null && settings.landfillLon != null
        ? { lat: settings.landfillLat, lon: settings.landfillLon }
        : null;
    const hauls = booking.service !== "gutter-cleaning";
    return {
      booking,
      events,
      payments,
      expenses,
      trips,
      suggestedMiles: suggestedTripMiles({ lat: settings.homeLat, lon: settings.homeLon }, job, hauls ? landfill : null),
      settings,
    };
  });

const STATUS = z.enum(["hold", "new", "quoted", "scheduled", "done", "cancelled"]);

export const updateBookingDetails = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        status: STATUS.optional(),
        finalCents: z.number().int().min(0).max(10_000_000).nullable().optional(),
        ownerNotes: z.string().max(4000).nullable().optional(),
        preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const [before] = await sql.query<{ status: string }>("select status from bookings where id = $1", [data.id]);
    if (!before) throw new Error("No job");
    if (data.status !== undefined && data.status !== before.status) {
      await sql.query(
        `update bookings set status = $2, completed_at = case when $2 = 'done' then coalesce(completed_at, now()) else completed_at end where id = $1`,
        [data.id, data.status],
      );
      await logEvent(sql, data.id, "status", `${before.status} → ${data.status}`);
    }
    if (data.finalCents !== undefined) {
      await sql.query("update bookings set final_cents = $2 where id = $1", [data.id, data.finalCents]);
      if (data.finalCents != null) await logEvent(sql, data.id, "system", `Final bill set to $${(data.finalCents / 100).toFixed(2)}`);
    }
    if (data.ownerNotes !== undefined) {
      await sql.query("update bookings set owner_notes = $2 where id = $1", [data.id, data.ownerNotes]);
    }
    if (data.preferredDate !== undefined) {
      await sql.query("update bookings set preferred_date = $2 where id = $1", [data.id, data.preferredDate]);
      await logEvent(sql, data.id, "system", `Date set to ${data.preferredDate ?? "none"}`);
    }
    return { ok: true as const };
  });

export const addBookingEvent = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        kind: z.enum(["note", "call", "text", "email"]),
        body: z.string().trim().min(1).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    await logEvent(sql, data.id, data.kind, data.body);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

const METHOD = z.enum(["stripe", "cash", "check", "venmo", "zelle", "other"]);
const DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const addPayment = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        bookingId: z.number().int().positive().nullable(),
        paidOn: DATE,
        amountCents: z.number().int().min(-10_000_000).max(10_000_000).refine((n) => n !== 0),
        method: METHOD,
        note: z.string().trim().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const kind = data.amountCents < 0 ? "refund" : "payment";
    const [row] = await sql.query<{ id: number }>(
      `insert into payments (booking_id, paid_on, amount_cents, method, kind, note) values ($1,$2,$3,$4,$5,$6) returning id`,
      [data.bookingId, data.paidOn, data.amountCents, data.method, kind, data.note || null],
    );
    if (data.bookingId) {
      await logEvent(sql, data.bookingId, "payment", `${kind === "refund" ? "Refunded" : "Received"} $${Math.abs(data.amountCents / 100).toFixed(2)} by ${data.method}`);
    }
    return { ok: true as const, id: row.id };
  });

export const deletePayment = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    await sql.query("delete from payments where id = $1 and stripe_session_id is null", [data.id]);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Expenses
// ---------------------------------------------------------------------------

const CATEGORY = z.enum(EXPENSE_CATEGORIES.map((c) => c.key) as [string, ...string[]]);

export const addExpense = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        spentOn: DATE,
        vendor: z.string().trim().max(120).optional(),
        category: CATEGORY,
        // negative = a refund or rebate received against that category; never zero
        amountCents: z.number().int().min(-10_000_000).max(10_000_000).refine((n) => n !== 0),
        paidWith: z.enum(["card", "checking", "personal", "cash"]).optional(),
        bookingId: z.number().int().positive().nullable().optional(),
        note: z.string().trim().max(400).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const settings = await loadSettings(sql);
    const phase = phaseFor(data.category, data.spentOn, settings.businessStart);
    const [row] = await sql.query<{ id: number }>(
      `insert into expenses (spent_on, vendor, category, amount_cents, paid_with, booking_id, note, phase, review)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'reviewed') returning id`,
      [data.spentOn, data.vendor || null, data.category, data.amountCents, data.paidWith || null, data.bookingId ?? null, data.note || null, phase],
    );
    if (data.bookingId) {
      await logEvent(sql, data.bookingId, "system", `Expense $${(data.amountCents / 100).toFixed(2)} · ${data.category}${data.vendor ? ` · ${data.vendor}` : ""}`);
    }
    return { ok: true as const, id: row.id };
  });

export const deleteExpense = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    await sql.query("delete from expenses where id = $1", [data.id]);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Mileage
// ---------------------------------------------------------------------------

export const addTrip = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        drivenOn: DATE,
        miles: z.number().min(0.1).max(2000),
        purpose: z.string().trim().min(2).max(200),
        fromLabel: z.string().trim().max(200).optional(),
        toLabel: z.string().trim().max(200).optional(),
        bookingId: z.number().int().positive().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const rate = mileageRateFor(data.drivenOn);
    const miles = Math.round(data.miles * 10) / 10;
    const [row] = await sql.query<{ id: number }>(
      `insert into mileage_trips (driven_on, miles, purpose, from_label, to_label, booking_id, rate_cents)
       values ($1,$2,$3,$4,$5,$6,$7) returning id`,
      [data.drivenOn, miles, data.purpose, data.fromLabel || null, data.toLabel || null, data.bookingId ?? null, rate],
    );
    if (data.bookingId) {
      await logEvent(sql, data.bookingId, "system", `Trip logged: ${miles} mi @ ${rate}¢`);
    }
    return { ok: true as const, id: row.id, rate };
  });

export const deleteTrip = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    await sql.query("delete from mileage_trips where id = $1", [data.id]);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Books page: a whole year at once
// ---------------------------------------------------------------------------

export type YearBooks = {
  year: number;
  payments: PaymentRow[];
  expenses: ExpenseRow[];
  trips: TripRow[];
  jobs: { id: number; name: string; service: string; preferred_date: string | null; status: string }[];
  totals: {
    collectedCents: number;
    expensesCents: number;
    mileageCents: number;
    miles: number;
    netCents: number;
    seTaxCents: number;
    reserveTargetCents: number;
    byLine: { line: string; label: string; cents: number }[];
    /** This year's spend split by cost phase. */
    phases: Record<CostPhase, number>;
    /** Every year, not just the one on screen — "what has it cost to start, and is it paying back". */
    allTime: { investedCents: number; operatingCents: number; collectedCents: number; netCents: number; receipts: number; needsReview: number };
    /** Cash-flow view against the fixed monthly obligations. */
    nut: { monthlyCents: number; thisMonthCollectedCents: number; doneJobs: number; avgTicketCents: number | null };
  };
  settings: OwnerSettings;
};

export const getYearBooks = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .validator((input: unknown) => yearInput.parse(input))
  .handler(async ({ data, context }): Promise<YearBooks> => {
    const sql = await ownerSql(context.email);
    const { from, to } = yearRange(data.year);
    const [payments, expenses, trips, jobs, settings] = await Promise.all([
      sql.query<PaymentRow>(
        `select p.id, p.booking_id, p.paid_on, p.amount_cents, p.method, p.kind, p.note, b.name as customer
           from payments p left join bookings b on b.id = p.booking_id
          where p.paid_on between $1 and $2 order by p.paid_on desc, p.id desc`,
        [from, to],
      ),
      sql.query<ExpenseRow>(
        `select e.id, e.spent_on, e.vendor, e.category, e.amount_cents, e.paid_with, e.booking_id, e.note, b.name as customer,
                e.receipt_id, e.phase, e.tax_cents, e.review,
                coalesce((select array_to_json(array_agg(r.id order by r.id)) from receipts r where r.expense_id = e.id), '[]'::json) as receipt_ids
           from expenses e left join bookings b on b.id = e.booking_id
          where e.spent_on between $1 and $2 order by e.spent_on desc, e.id desc`,
        [from, to],
      ),
      sql.query<TripRow>(
        `select t.id, t.driven_on, t.miles::float8 as miles, t.purpose, t.from_label, t.to_label, t.booking_id, t.rate_cents::float8 as rate_cents, b.name as customer
           from mileage_trips t left join bookings b on b.id = t.booking_id
          where t.driven_on between $1 and $2 order by t.driven_on desc, t.id desc`,
        [from, to],
      ),
      sql.query<{ id: number; name: string; service: string; preferred_date: string | null; status: string }>(
        `select id, name, service, preferred_date, status from bookings
          where status not in ('cancelled') order by created_at desc limit 300`,
      ),
      loadSettings(sql),
    ]);
    const collectedCents = payments.reduce((s, p) => s + p.amount_cents, 0);
    const expensesCents = expenses.reduce((s, e) => s + e.amount_cents, 0);
    const phases: Record<CostPhase, number> = { startup: 0, equipment: 0, operating: 0 };
    for (const e of expenses) {
      const ph = (e.phase as CostPhase | null) ?? phaseFor(e.category, e.spent_on, settings.businessStart);
      phases[ph] += e.amount_cents;
    }
    const [allExp] = await sql.query<{ invested: number; operating: number; receipts: number; needs_review: number }>(
      `select coalesce(sum(case when coalesce(phase, case when category = 'equipment' then 'equipment' when spent_on < $1 then 'startup' else 'operating' end) in ('startup','equipment') then amount_cents else 0 end), 0)::int as invested,
              coalesce(sum(case when coalesce(phase, case when category = 'equipment' then 'equipment' when spent_on < $1 then 'startup' else 'operating' end) = 'operating' then amount_cents else 0 end), 0)::int as operating,
              count(receipt_id)::int as receipts,
              coalesce(sum(case when review = 'needs-review' then 1 else 0 end), 0)::int as needs_review
         from expenses`,
      [settings.businessStart],
    );
    const [allPay] = await sql.query<{ c: number }>(`select coalesce(sum(amount_cents), 0)::int as c from payments`);
    const [allMiles] = await sql.query<{ c: number }>(`select coalesce(sum(round(miles * rate_cents)), 0)::int as c from mileage_trips`);
    const monthStart = new Date().toISOString().slice(0, 7) + "-01";
    const [mtd] = await sql.query<{ c: number }>(`select coalesce(sum(amount_cents), 0)::int as c from payments where paid_on >= $1`, [monthStart]);
    const [done] = await sql.query<{ n: number; avg: number | null }>(
      `select count(*)::int as n,
              (select round(avg(x.paid))::int from (
                 select coalesce(sum(p.amount_cents), 0) as paid from bookings b join payments p on p.booking_id = b.id
                  where b.status = 'done' group by b.id having sum(p.amount_cents) > 0) x) as avg
         from bookings where status = 'done'`,
    );
    const nut = {
      monthlyCents: settings.fixedCosts.reduce((s, f) => s + f.cents, 0),
      thisMonthCollectedCents: mtd?.c ?? 0,
      doneJobs: done?.n ?? 0,
      avgTicketCents: done?.avg ?? null,
    };
    const allTime = {
      investedCents: allExp?.invested ?? 0,
      operatingCents: allExp?.operating ?? 0,
      collectedCents: allPay?.c ?? 0,
      netCents: (allPay?.c ?? 0) - (allExp?.invested ?? 0) - (allExp?.operating ?? 0) - (allMiles?.c ?? 0),
      receipts: allExp?.receipts ?? 0,
      needsReview: allExp?.needs_review ?? 0,
    };
    const mileageCents = mileageDeductionCents(trips);
    const miles = Math.round(trips.reduce((s, t) => s + t.miles, 0) * 10) / 10;
    const netCents = collectedCents - expensesCents - mileageCents;
    const lineMap = new Map<string, { label: string; cents: number }>();
    for (const e of expenses) {
      const cat = EXPENSE_CATEGORIES.find((c) => c.key === e.category);
      const line = cat?.line ?? "27a";
      const label = cat?.label ?? e.category;
      const cur = lineMap.get(`${line}|${label}`) ?? { label, cents: 0 };
      cur.cents += e.amount_cents;
      lineMap.set(`${line}|${label}`, cur);
    }
    const byLine = [...lineMap.entries()]
      .map(([k, v]) => ({ line: k.split("|")[0], label: v.label, cents: v.cents }))
      .sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }));
    if (mileageCents > 0) byLine.push({ line: "9", label: `Car & truck (standard mileage, ${miles} mi)`, cents: mileageCents });
    byLine.sort((a, b) => a.line.localeCompare(b.line, undefined, { numeric: true }));
    return {
      year: data.year,
      payments,
      expenses,
      trips,
      jobs,
      totals: {
        collectedCents,
        expensesCents,
        mileageCents,
        miles,
        netCents,
        seTaxCents: selfEmploymentTaxCents(netCents),
        reserveTargetCents: Math.round((collectedCents * settings.reservePct) / 100),
        byLine,
        phases,
        allTime,
        nut,
      },
      settings,
    };
  });

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        homeAddress: z.string().trim().max(200).optional(),
        homeLat: z.number().min(-90).max(90).optional(),
        homeLon: z.number().min(-180).max(180).optional(),
        landfillAddress: z.string().trim().max(200).optional(),
        landfillLat: z.number().min(-90).max(90).nullable().optional(),
        landfillLon: z.number().min(-180).max(180).nullable().optional(),
        reservePct: z.number().int().min(0).max(60).optional(),
        businessStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        budgetCents: z.number().int().min(0).max(100_000_000).optional(),
        fixedCosts: z
          .array(
            z.object({
              id: z.string().min(1).max(40),
              label: z.string().trim().min(1).max(80),
              cents: z.number().int().min(0).max(100_000_000),
              deductible: z.enum(["none", "full", "interest"]),
            }),
          )
          .max(20)
          .optional(),
        checks: z.record(z.string().max(60), z.boolean()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const put = async (key: string, value: string | null) => {
      if (value == null) {
        await sql.query("delete from owner_settings where key = $1", [key]);
      } else {
        await sql.query(
          `insert into owner_settings (key, value, updated_at) values ($1, $2, now())
           on conflict (key) do update set value = excluded.value, updated_at = now()`,
          [key, value],
        );
      }
    };
    if (data.homeAddress !== undefined) await put("home.address", data.homeAddress);
    if (data.homeLat !== undefined) await put("home.lat", String(data.homeLat));
    if (data.homeLon !== undefined) await put("home.lon", String(data.homeLon));
    if (data.landfillAddress !== undefined) await put("landfill.address", data.landfillAddress);
    if (data.landfillLat !== undefined) await put("landfill.lat", data.landfillLat == null ? null : String(data.landfillLat));
    if (data.landfillLon !== undefined) await put("landfill.lon", data.landfillLon == null ? null : String(data.landfillLon));
    if (data.reservePct !== undefined) await put("tax.reservePct", String(data.reservePct));
    if (data.businessStart !== undefined) await put("business.startDate", data.businessStart);
    if (data.budgetCents !== undefined) await put("budget.startCents", String(data.budgetCents));
    if (data.fixedCosts !== undefined) await put("fixed.costs", JSON.stringify(data.fixedCosts));
    if (data.checks) {
      for (const [k, v] of Object.entries(data.checks)) await put(`check:${k}`, v ? "1" : "0");
    }
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Customers: one row per phone number, derived — no new table to keep in sync
// ---------------------------------------------------------------------------

export type CustomerRow = {
  phone: string;
  name: string;
  email: string | null;
  address: string;
  jobs: number;
  lastJobId: number;
  lastStatus: string;
  lastDate: string | null;
  lastContactAt: string | null;
  collectedCents: number;
  source: string | null;
};

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }): Promise<CustomerRow[]> => {
    const sql = await ownerSql(context.email);
    const rows = await sql.query<{
      id: number; name: string; phone: string; email: string | null; address: string; status: string;
      preferred_date: string | null; created_at: string; last_contact_at: string | null; source: string | null; paid_cents: number;
    }>(
      `select b.id, b.name, b.phone, b.email, b.address, b.status, b.preferred_date, b.created_at, b.last_contact_at, b.source,
              coalesce((select sum(p.amount_cents) from payments p where p.booking_id = b.id), 0)::int as paid_cents
         from bookings b order by b.created_at desc limit 500`,
    );
    const byPhone = new Map<string, CustomerRow>();
    for (const r of rows) {
      const key = r.phone.replace(/\D/g, "").slice(-10) || r.phone;
      const cur = byPhone.get(key);
      if (!cur) {
        byPhone.set(key, {
          phone: r.phone, name: r.name, email: r.email, address: r.address, jobs: 1,
          lastJobId: r.id, lastStatus: r.status, lastDate: r.preferred_date, lastContactAt: r.last_contact_at,
          collectedCents: r.paid_cents, source: r.source,
        });
      } else {
        cur.jobs += 1;
        cur.collectedCents += r.paid_cents;
        if (!cur.email && r.email) cur.email = r.email;
        if (r.last_contact_at && (!cur.lastContactAt || r.last_contact_at > cur.lastContactAt)) cur.lastContactAt = r.last_contact_at;
      }
    }
    return [...byPhone.values()];
  });
