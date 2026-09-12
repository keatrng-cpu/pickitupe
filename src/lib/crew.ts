/**
 * Crew portal (/crew) and the owner's crew management (/jobs/crew).
 *
 * THE PRIVACY BOUNDARY IS `CREW_BOOKING_SELECT`. A crew session never selects
 * estimate_low/high, discount_amount, deposit_*, balance_paid, final_cents,
 * invoice_session_id, owner_notes, source or payments. If a column with money
 * in it is ever needed on the crew side, it is a deliberate decision made
 * here, not a widening of a select somewhere else.
 *
 * Owner functions are gated by isOwnerEmail; crew functions by an active row in
 * crew_members matching the signed-in email. The owner is also treated as crew
 * so the portal can be tested from the owner login.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSql, type Sql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { todayISO } from "@/lib/schedule";
import { hoursBetween, totals, weekOf } from "@/lib/crew-math";

export type CrewMember = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  wage_cents: number;
  active: boolean;
  created_at: string;
};

export type TimeEntry = {
  id: number;
  crew_id: number;
  started_at: string;
  ended_at: string | null;
  booking_id: number | null;
  note: string | null;
  paid_expense_id: number | null;
  customer?: string | null;
  crew_name?: string;
};

/** What a crew member may see about a job. No money, no owner notes, no source. */
const CREW_BOOKING_SELECT = `
  id, name, phone, address, extra_addresses, service, job_size, add_ons,
  preferred_date, status, urgency, notes, neighbor_of, households, area_tier, lat, lon
`;

export type CrewJob = {
  id: number;
  name: string;
  phone: string;
  address: string;
  extra_addresses: string | null;
  service: string;
  job_size: string | null;
  add_ons: string | null;
  preferred_date: string | null;
  status: string;
  urgency: string | null;
  notes: string | null;
  neighbor_of: string | null;
  households: number | null;
  area_tier: string | null;
  lat: number | null;
  lon: number | null;
};

async function ready(): Promise<Sql> {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await ensureOwnerTables(sql);
  return sql;
}

async function ownerSql(email: string | null | undefined): Promise<Sql> {
  if (!isOwnerEmail(email)) throw new Error("Forbidden");
  return ready();
}

/**
 * The signed-in crew member. The owner works the truck too, so an owner login
 * gets a crew row created on first visit — at $0/hr, because a single-member
 * LLC owner is paid by draw, not wages; the hours still count for the job
 * timeline and for knowing what a job really costs in labor.
 */
async function crewFor(sql: Sql, email: string | null | undefined): Promise<CrewMember | null> {
  // Local demo (VITE_AUTH_ENABLED=false, no DATABASE_URL): the shared dev user
  // has no email but isOwnerEmail() says yes — give it the same address the
  // client shows so the owner-as-crew path can be exercised locally.
  const e = (email ?? "").trim().toLowerCase() || (isOwnerEmail(email) ? "dev@example.com" : "");
  if (!e) return null;
  const rows = await sql.query<CrewMember>("select * from crew_members where email = $1 and active", [e]);
  if (rows[0]) return rows[0];
  if (isOwnerEmail(email)) {
    const local = e.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const [row] = await sql.query<CrewMember>(
      `insert into crew_members (email, name, wage_cents) values ($1, $2, 0)
       on conflict (email) do update set active = true returning *`,
      [e, `${local} (owner)`],
    );
    return row;
  }
  return null;
}

/**
 * timestamptz comes back from the driver as a Date, and Date survives the
 * server-fn serializer — the page then calls .slice() on it and dies. Every
 * time_entries row leaves this module as ISO strings.
 */
function isoRow<T extends { started_at: unknown; ended_at: unknown }>(row: T): T {
  const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v == null ? null : String(v));
  return { ...row, started_at: iso(row.started_at), ended_at: iso(row.ended_at) };
}
function isoRows<T extends { started_at: unknown; ended_at: unknown }>(rows: T[]): T[] {
  return rows.map(isoRow);
}

// ---------------------------------------------------------------------------
// Crew side
// ---------------------------------------------------------------------------

export type CrewHome = {
  me: { id: number; name: string; wageCents: number; isOwner: boolean };
  open: TimeEntry | null;
  week: { from: string; to: string; hours: number; cents: number; entries: TimeEntry[] };
  unpaid: { hours: number; cents: number };
  jobs: CrewJob[];
  today: string;
};

export const getCrewHome = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }): Promise<CrewHome | null> => {
    const sql = await ready();
    const me = await crewFor(sql, context.email);
    if (!me) return null;
    const today = todayISO();
    const [from, to] = weekOf(today);
    const entries = isoRows(
      await sql.query<TimeEntry>(
        `select t.id, t.crew_id, t.started_at, t.ended_at, t.booking_id, t.note, t.paid_expense_id, b.name as customer
           from time_entries t left join bookings b on b.id = t.booking_id
          where t.crew_id = $1 and t.started_at >= ($2::date)::timestamptz and t.started_at < ($3::date + 1)::timestamptz
          order by t.started_at desc`,
        [me.id, from, to],
      ),
    );
    const openRow = (
      await sql.query<TimeEntry>(
        `select t.id, t.crew_id, t.started_at, t.ended_at, t.booking_id, t.note, t.paid_expense_id, b.name as customer
           from time_entries t left join bookings b on b.id = t.booking_id
          where t.crew_id = $1 and t.ended_at is null order by t.started_at desc limit 1`,
        [me.id],
      )
    )[0];
    const open = openRow ? isoRow(openRow) : null;
    const unpaidRows = isoRows(await sql.query<TimeEntry>("select * from time_entries where crew_id = $1 and ended_at is not null and paid_expense_id is null", [me.id]));
    const weekT = totals(entries.filter((e) => e.ended_at), me.wage_cents);
    const unpaidT = totals(unpaidRows, me.wage_cents);
    // Scheduled work from yesterday forward — plus anything without a date that's quoted/scheduled so it isn't lost.
    const jobs = await sql.query<CrewJob>(
      `select ${CREW_BOOKING_SELECT} from bookings
        where status in ('scheduled', 'quoted', 'new')
          and (preferred_date is null or preferred_date >= ($1::date - 1)::text)
        order by preferred_date nulls last, created_at`,
      [today],
    );
    return {
      me: { id: me.id, name: me.name, wageCents: me.wage_cents, isOwner: isOwnerEmail(context.email) },
      open,
      week: { from, to, hours: weekT.hours, cents: weekT.cents, entries },
      unpaid: unpaidT,
      jobs,
      today,
    };
  });

export const clockIn = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ bookingId: z.number().int().positive().nullable().optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ready();
    const me = await crewFor(sql, context.email);
    if (!me) throw new Error("Forbidden");
    const open = await sql.query<{ id: number }>("select id from time_entries where crew_id = $1 and ended_at is null", [me.id]);
    if (open[0]) return { ok: true as const, id: open[0].id, already: true };
    const [row] = await sql.query<{ id: number }>(
      "insert into time_entries (crew_id, started_at, booking_id) values ($1, now(), $2) returning id",
      [me.id, data.bookingId ?? null],
    );
    if (data.bookingId) await logEvent(sql, data.bookingId, "system", `${me.name} clocked in`);
    return { ok: true as const, id: row.id, already: false };
  });

export const clockOut = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ note: z.string().trim().max(300).optional() }).parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ready();
    const me = await crewFor(sql, context.email);
    if (!me) throw new Error("Forbidden");
    const rows = isoRows(
      await sql.query<TimeEntry>(
        "update time_entries set ended_at = now(), note = coalesce($2, note) where crew_id = $1 and ended_at is null returning *",
        [me.id, data.note || null],
      ),
    );
    const row = rows[0];
    if (row?.booking_id) await logEvent(sql, row.booking_id, "system", `${me.name} clocked out · ${hoursBetween(row.started_at, row.ended_at)} h`);
    return { ok: true as const, hours: row ? hoursBetween(row.started_at, row.ended_at) : 0 };
  });

/** Crew logs a customer contact (tapped a text, made a call) on the job's timeline. */
export const crewLogContact = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z.object({ bookingId: z.number().int().positive(), kind: z.enum(["call", "text", "note"]), body: z.string().trim().min(1).max(600) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ready();
    const me = await crewFor(sql, context.email);
    if (!me) throw new Error("Forbidden");
    await logEvent(sql, data.bookingId, data.kind, `${me.name}: ${data.body}`);
    return { ok: true as const };
  });

/** Crew can mark the work finished; the owner still bills. */
export const crewMarkDone = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ bookingId: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    const sql = await ready();
    const me = await crewFor(sql, context.email);
    if (!me) throw new Error("Forbidden");
    await sql.query(
      `update bookings set status = 'done', completed_at = coalesce(completed_at, now()) where id = $1 and status in ('scheduled', 'quoted', 'new')`,
      [data.bookingId],
    );
    await logEvent(sql, data.bookingId, "status", `→ done (marked by ${me.name})`);
    return { ok: true as const };
  });

// ---------------------------------------------------------------------------
// Owner side
// ---------------------------------------------------------------------------

export const listCrew = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }) => {
    const sql = await ownerSql(context.email);
    const crew = await sql.query<CrewMember>("select * from crew_members order by active desc, name");
    const entries = isoRows(
      await sql.query<TimeEntry>(
        `select t.id, t.crew_id, t.started_at, t.ended_at, t.booking_id, t.note, t.paid_expense_id, b.name as customer, c.name as crew_name
           from time_entries t join crew_members c on c.id = t.crew_id left join bookings b on b.id = t.booking_id
          order by t.started_at desc limit 300`,
      ),
    );
    const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v));
    return { crew: crew.map((c) => ({ ...c, created_at: iso(c.created_at) })), entries };
  });

export const upsertCrew = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive().optional(),
        email: z.string().trim().email().max(120),
        name: z.string().trim().min(1).max(80),
        phone: z.string().trim().max(24).optional(),
        // 0 is allowed on purpose: the owner's own row (paid by draw, not wages)
        wageCents: z.number().int().min(0).max(20_000),
        active: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const email = data.email.toLowerCase();
    if (data.id) {
      await sql.query(
        "update crew_members set email = $2, name = $3, phone = $4, wage_cents = $5, active = coalesce($6, active) where id = $1",
        [data.id, email, data.name, data.phone || null, data.wageCents, data.active ?? null],
      );
      return { ok: true as const, id: data.id };
    }
    const [row] = await sql.query<{ id: number }>(
      `insert into crew_members (email, name, phone, wage_cents) values ($1, $2, $3, $4)
       on conflict (email) do update set name = excluded.name, phone = excluded.phone, wage_cents = excluded.wage_cents, active = true
       returning id`,
      [email, data.name, data.phone || null, data.wageCents],
    );
    return { ok: true as const, id: row.id };
  });

/** Owner fixes a shift (forgot to clock out, wrong day) or deletes it. */
export const editTimeEntry = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number().int().positive(),
        startedAt: z.string().datetime({ offset: true }).optional(),
        endedAt: z.string().datetime({ offset: true }).nullable().optional(),
        note: z.string().trim().max(300).nullable().optional(),
        remove: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    if (data.remove) {
      await sql.query("delete from time_entries where id = $1 and paid_expense_id is null", [data.id]);
      return { ok: true as const };
    }
    if (data.startedAt !== undefined) await sql.query("update time_entries set started_at = $2 where id = $1", [data.id, data.startedAt]);
    if (data.endedAt !== undefined) await sql.query("update time_entries set ended_at = $2 where id = $1", [data.id, data.endedAt]);
    if (data.note !== undefined) await sql.query("update time_entries set note = $2 where id = $1", [data.id, data.note]);
    return { ok: true as const };
  });

/**
 * Pay day: every finished, unpaid shift for one crew member becomes one
 * "wages" expense in the books (Schedule C line 26) and the shifts are stamped
 * with it. Gross wages only — employer FICA, WSI and unemployment are separate
 * expenses under "taxes" when you pay them.
 */
export const recordPay = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z.object({ crewId: z.number().int().positive(), paidOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), paidWith: z.enum(["checking", "cash", "check", "card", "personal"]).default("checking") }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const sql = await ownerSql(context.email);
    const [member] = await sql.query<CrewMember>("select * from crew_members where id = $1", [data.crewId]);
    if (!member) throw new Error("No such crew member");
    const entries = isoRows(
      await sql.query<TimeEntry>(
        "select * from time_entries where crew_id = $1 and ended_at is not null and paid_expense_id is null order by started_at",
        [data.crewId],
      ),
    );
    if (!entries.length) return { ok: true as const, expenseId: null, hours: 0, cents: 0 };
    const t = totals(entries, member.wage_cents);
    if (t.cents <= 0) return { ok: true as const, expenseId: null, hours: t.hours, cents: 0 };
    const first = entries[0].started_at.slice(0, 10);
    const last = entries[entries.length - 1].started_at.slice(0, 10);
    const [exp] = await sql.query<{ id: number }>(
      `insert into expenses (spent_on, vendor, category, amount_cents, paid_with, note, phase, review)
       values ($1, $2, 'wages', $3, $4, $5, 'operating', 'reviewed') returning id`,
      [data.paidOn, member.name, t.cents, data.paidWith, `Wages · ${entries.length} shift${entries.length === 1 ? "" : "s"} ${first} → ${last} · ${t.hours} h × $${(member.wage_cents / 100).toFixed(2)}`],
    );
    await sql.query("update time_entries set paid_expense_id = $2 where id = any($1::int[])", [entries.map((e) => e.id), exp.id]);
    return { ok: true as const, expenseId: exp.id, hours: t.hours, cents: t.cents };
  });
