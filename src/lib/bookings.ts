import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import {
  estimate,
  isPromoActive,
  PROMO_CAP,
  PROMO_DEADLINE_LABEL,
  PROMO_PERCENT,
  type AddOnKey,
  type ServiceKey,
  parseAddOns,
} from "@/lib/pricebook";
import {
  DAILY_SLOTS,
  firstOpenDay,
  slotsFor,
  todayISO,
  type DayFill,
} from "@/lib/schedule";
import { z } from "zod";
import { BOOKING_SELECT, ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { notifyOwnerOfBooking } from "@/lib/booking-alert.server";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { digitsPhone, isUsPhone } from "@/lib/phone";

const bookingInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(200),
  service: z.enum([
    "leaf-cleanup",
    "junk-removal",
    "furniture-appliances",
    "gutter-cleaning",
    "other",
  ]),
  notes: z.string().trim().max(800).optional().or(z.literal("")),
  preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
  urgency: z
    .enum(["before-vacuum", "this-week", "flexible"])
    .optional()
    .or(z.literal("")),
  jobSize: z.string().trim().max(40).optional().or(z.literal("")),
  addOns: z.array(z.string().max(40)).max(10).optional(),
  estimateLow: z.number().int().min(0).max(100_000).optional(),
  estimateHigh: z.number().int().min(0).max(100_000).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  areaTier: z.enum(["core", "ring", "outside", "unknown"]).optional(),
  neighborOf: z.string().trim().max(200).optional().or(z.literal("")),
  households: z.number().int().min(1).max(6).optional(),
  asap: z.boolean().optional(),
  // ?s= tag the visitor landed with (dh, gbp, chat). Never trusted for anything but reporting.
  source: z.string().trim().max(24).regex(/^[a-z0-9_-]*$/i).optional(),
});

export type BookingRow = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  service: string;
  notes: string | null;
  preferred_date: string | null;
  early_bird: boolean;
  status: string;
  created_at: string;
  urgency: string | null;
  job_size: string | null;
  add_ons: string | null;
  estimate_low: number | null;
  estimate_high: number | null;
  lat: number | null;
  lon: number | null;
  area_tier: string | null;
  neighbor_of: string | null;
  households: number | null;
  applied_discount: string | null;
  discount_amount: number | null;
  deposit_cents?: number | null;
  deposit_paid?: boolean | null;
  extra_addresses?: string | null;
  pack?: string | null;
  stops?: number | null;
  balance_paid?: boolean | null;
  // owner books (migration 0007) — present when selected through listBookings
  source?: string | null;
  final_cents?: number | null;
  owner_notes?: string | null;
  completed_at?: string | null;
  last_contact_at?: string | null;
};

/** Board select: the pay columns plus the owner-books columns. */
export const OWNER_BOOKING_SELECT = `${BOOKING_SELECT}, source, final_cents, owner_notes, completed_at, last_contact_at`;

/**
 * The promo is now a fixed calendar deadline (see `isPromoActive` in
 * pricebook.ts), not a count against the database — so this needs no
 * database at all and cannot fail. The home page loads through this; the
 * phone number and the offer badge must render even if Postgres is down.
 */
export const getOfferStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    return {
      active: isPromoActive(),
      percent: PROMO_PERCENT,
      cap: PROMO_CAP,
      deadlineLabel: PROMO_DEADLINE_LABEL,
    };
  },
);

export async function loadFill(): Promise<DayFill[]> {
  try {
    const sql = await getSql();
    await ensurePayColumns(sql);
    const rows = await sql<{ preferred_date: string | null; job_size: string | null; service: string; add_ons: string | null }>`
      select preferred_date, job_size, service, add_ons
      from bookings
      where preferred_date is not null
        and preferred_date >= ${todayISO()}
        and status not in ('cancelled', 'done', 'hold')
    `;
    const used = new Map<string, number>();
    for (const r of rows) {
      const day = (r.preferred_date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const need = slotsFor(
        (r.service as ServiceKey) || "junk-removal",
        r.job_size || "single",
        parseAddOns(r.add_ons),
      );
      used.set(day, (used.get(day) ?? 0) + need);
    }
    return [...used.entries()].map(([day, usedSlots]) => ({ day, used: usedSlots }));
  } catch {
    return [];
  }
}

export const getScheduleFill = createServerFn({ method: "GET" }).handler(
  async () => loadFill(),
);

export const submitBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => bookingInput.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    await ensureOwnerTables(sql);
    // Recomputed server-side from the server clock — never trust a
    // client-supplied flag for something that changes the price.
    const earlyBird = isPromoActive();

    // Same rule for the block credit. The client sends what the customer
    // picked; the SERVER decides what it is worth, so a hand-edited request
    // cannot mint a discount, and so the row records the number we are
    // actually bound to rather than the one a browser claimed.
    const households = data.households ?? 1;
    const priced = estimate({
      service: data.service as ServiceKey,
      size: data.jobSize || "",
      addOns: (data.addOns ?? []) as AddOnKey[],
      earlyBird,
      notes: data.notes || "",
      households,
      urgency: data.urgency || undefined,
    });

    const need = slotsFor(
      data.service as ServiceKey,
      data.jobSize || "single",
      (data.addOns ?? []) as AddOnKey[],
    );
    const fill = await loadFill();
    let preferredDate = data.preferredDate || null;
    if (data.asap || preferredDate === "asap") {
      preferredDate = firstOpenDay(fill, need);
    }
    if (preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
      const used = fill.find((f) => f.day === preferredDate)?.used ?? 0;
      if (used + need > DAILY_SLOTS) {
        const next = firstOpenDay(fill, need);
        throw new Error(
          next
            ? `That day is full. Next open is ${next}.`
            : "That day is full.",
        );
      }
    }

    const inserted = await sql<{ id: number }>`
      insert into bookings
        (name, phone, email, address, service, notes, preferred_date, early_bird, status,
         urgency, job_size, add_ons, estimate_low, estimate_high, lat, lon, area_tier, neighbor_of,
         households, applied_discount, discount_amount, source)
      values
        (
          ${data.name},
          ${data.phone},
          ${data.email || null},
          ${data.address},
          ${data.service},
          ${data.notes || null},
          ${preferredDate},
          ${earlyBird},
          ${"new"},
          ${data.urgency || null},
          ${data.jobSize || null},
          ${data.addOns?.length ? data.addOns.join(",") : null},
          ${data.estimateLow ?? null},
          ${data.estimateHigh ?? null},
          ${data.lat ?? null},
          ${data.lon ?? null},
          ${data.areaTier || null},
          ${data.neighborOf || null},
          ${households},
          ${priced.appliedDiscount},
          ${priced.discount},
          ${data.source || null}
        )
      returning id
    `;
    const id = inserted[0]?.id ?? 0;
    await logEvent(sql, id, "system", `Booked on the site${data.source ? ` · via ${data.source}` : ""}`);

    // The row is saved. Now tell the owner — this cannot throw and cannot
    // fail the booking (see booking-alert.server.ts). Awaited on purpose: a
    // serverless instance may be frozen the moment the response goes out.
    const alert = await notifyOwnerOfBooking({
      id,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      address: data.address,
      service: data.service,
      jobSize: data.jobSize || null,
      addOns: data.addOns ?? [],
      estimateLow: priced.range?.low ?? data.estimateLow ?? null,
      estimateHigh: priced.range?.high ?? data.estimateHigh ?? null,
      urgency: data.urgency || null,
      preferredDate,
      notes: data.notes || null,
      neighborOf: data.neighborOf || null,
      households,
      appliedDiscount: priced.appliedDiscount,
      discount: priced.discount,
      areaTier: data.areaTier ?? null,
    });

    return {
      ok: true as const,
      id,
      earlyBird,
      appliedDiscount: priced.appliedDiscount,
      discount: priced.discount,
      ownerAlerted: alert.sent,
      preferredDate,
    };
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }) => {
    if (!isOwnerEmail(context.email)) {
      throw new Error("Forbidden");
    }
    const sql = await getSql();
    await ensurePayColumns(sql);
    await ensureOwnerTables(sql);
    return sql.query<BookingRow>(
      `select ${OWNER_BOOKING_SELECT} from bookings order by created_at desc limit 200`,
    );
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number(),
        status: z.enum(["hold", "new", "quoted", "scheduled", "done", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    if (!isOwnerEmail(context.email)) {
      throw new Error("Forbidden");
    }
    const sql = await getSql();
    await ensurePayColumns(sql);
    await ensureOwnerTables(sql);
    const before = await sql.query<{ status: string }>(`select status from bookings where id = $1`, [data.id]);
    await sql`
      update bookings
         set status = ${data.status},
             completed_at = case when ${data.status} = 'done' then coalesce(completed_at, now()) else completed_at end
       where id = ${data.id}
    `;
    if (before[0] && before[0].status !== data.status) {
      await logEvent(sql, data.id, "status", `${before[0].status} → ${data.status}`);
    }
    if (data.status === "done") {
      const rows = await sql.query<{ name: string; phone: string; email: string | null; estimate_low: number | null; estimate_high: number | null }>(
        `select name, phone, email, estimate_low, estimate_high from bookings where id = $1`,
        [data.id],
      );
      const row = rows[0];
      if (row) {
        const { doneReviewMessage, notifyCustomer } = await import("@/lib/customer-notify.server");
        const est =
          row.estimate_low != null && row.estimate_high != null
            ? `$${row.estimate_low}–$${row.estimate_high}`
            : null;
        await notifyCustomer(row.phone, row.email, doneReviewMessage(row.name, est));
      }
    }
    return { ok: true as const };
  });

const phoneInput = z.object({ phone: z.string().min(7).max(24) });

export async function jobsForPhone(raw: string) {
  const phone = digitsPhone(raw);
  if (!isUsPhone(phone)) return [] as BookingRow[];
  const sql = await getSql();
  await ensurePayColumns(sql);
  const rows = await sql.query<BookingRow>(
    `select ${BOOKING_SELECT} from bookings order by created_at desc limit 200`,
  );
  return rows.filter((r) => digitsPhone(r.phone).slice(-10) === phone).slice(0, 20);
}

export const lookupByPhone = createServerFn({ method: "POST" })
  .validator((input: unknown) => phoneInput.parse(input))
  .handler(async ({ data }) => jobsForPhone(data.phone));

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([sessionEmail])
  .handler(async ({ context }) => {
    const email = context.email?.trim().toLowerCase();
    if (!email) return [] as BookingRow[];
    const sql = await getSql();
    await ensurePayColumns(sql);
    return sql.query<BookingRow>(
      `select ${BOOKING_SELECT} from bookings
        where lower(coalesce(email, '')) = $1
        order by created_at desc
        limit 40`,
      [email],
    );
  });

export const claimByPhone = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ phone: z.string().min(7).max(24) }).parse(input))
  .handler(async ({ data, context }) => {
    const email = context.email?.trim();
    const phone = digitsPhone(data.phone);
    if (!email || !isUsPhone(phone)) return { ok: false as const, n: 0 };
    const sql = await getSql();
    const rows = await sql<{ id: number; phone: string; email: string | null }>`
      select id, phone, email from bookings
    `;
    let n = 0;
    for (const r of rows) {
      if (digitsPhone(r.phone) !== phone) continue;
      if (r.email && r.email.toLowerCase() !== email.toLowerCase()) continue;
      await sql`update bookings set email = ${email} where id = ${r.id}`;
      n += 1;
    }
    return { ok: true as const, n };
  });

export const completeByPhone = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z.object({ id: z.number().int().positive(), phone: z.string().min(7).max(24) }).parse(input),
  )
  .handler(async ({ data }) => {
    const phone = digitsPhone(data.phone);
    if (!isUsPhone(phone)) return null;
    const sql = await getSql();
    const rows = await sql<BookingRow>`
      update bookings
      set status = 'done'
      where id = ${data.id}
        and regexp_replace(phone, '[^0-9]', '', 'g') = ${phone}
        and status not in ('done', 'cancelled')
      returning id, name, phone, email, address, service, notes,
                preferred_date, early_bird, status, created_at,
                urgency, job_size, add_ons, estimate_low, estimate_high,
                lat, lon, area_tier, neighbor_of,
                households, applied_discount, discount_amount
    `;
    return rows[0] ?? null;
  });

export const completeMyBooking = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ id: z.number().int().positive() }).parse(input))
  .handler(async ({ data, context }) => {
    const email = context.email?.trim().toLowerCase();
    if (!email) return null;
    const sql = await getSql();
    const rows = await sql<BookingRow>`
      update bookings
      set status = 'done'
      where id = ${data.id}
        and lower(coalesce(email, '')) = ${email}
        and status not in ('done', 'cancelled')
      returning id, name, phone, email, address, service, notes,
                preferred_date, early_bird, status, created_at,
                urgency, job_size, add_ons, estimate_low, estimate_high,
                lat, lon, area_tier, neighbor_of,
                households, applied_discount, discount_amount
    `;
    return rows[0] ?? null;
  });

