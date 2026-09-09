import { getSql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { formatRange, parseAddOns, type ServiceKey } from "@/lib/pricebook";
import { DAILY_SLOTS, firstOpenDay, slotsFor } from "@/lib/schedule";
import { loadFill } from "@/lib/bookings";
import { notifyOwnerOfBooking } from "@/lib/booking-alert.server";
import { bookedMessage, notifyCustomer } from "@/lib/customer-notify.server";

if (typeof window !== "undefined") {
  throw new Error("pay-finalize.server.ts is server-only");
}

export async function finalizePaidDeposit(bookingId: number, sessionId: string) {
  const sql = await getSql();
  await ensurePayColumns(sql);
  const rows = await sql.query<{
    id: number;
    name: string;
    phone: string;
    email: string | null;
    address: string;
    service: string;
    job_size: string | null;
    estimate_low: number | null;
    estimate_high: number | null;
    preferred_date: string | null;
    notes: string | null;
    deposit_cents: number;
    deposit_paid: boolean;
    extra_addresses: string | null;
    add_ons: string | null;
  }>(
    `select id, name, phone, email, address, service, job_size, estimate_low, estimate_high,
            preferred_date, notes, deposit_cents, deposit_paid, extra_addresses, add_ons
       from bookings where id = $1`,
    [bookingId],
  );
  const row = rows[0];
  if (!row || row.deposit_paid) return;

  const fill = await loadFill();
  const need = slotsFor(
    (row.service as ServiceKey) || "junk-removal",
    row.job_size || "single",
    parseAddOns(row.add_ons),
  );
  let day = row.preferred_date;
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    const used = fill.find((f) => f.day === day)?.used ?? 0;
    if (used + need > DAILY_SLOTS) day = firstOpenDay(fill, need);
  } else {
    day = firstOpenDay(fill, need);
  }

  await sql.query(
    `update bookings
        set deposit_paid = true,
            deposit_session_id = $2,
            status = 'scheduled',
            preferred_date = coalesce($3, preferred_date)
      where id = $1`,
    [bookingId, sessionId, day],
  );

  const deposit = Math.round((row.deposit_cents || 5000) / 100);
  const range =
    row.estimate_low != null && row.estimate_high != null
      ? formatRange({ low: row.estimate_low, high: row.estimate_high })
      : null;
  await notifyCustomer(
    row.phone,
    row.email,
    bookedMessage({ name: row.name, id: row.id, day, range, deposit }),
  );
  await notifyOwnerOfBooking({
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: [row.address, row.extra_addresses].filter(Boolean).join(" · "),
    service: row.service,
    jobSize: row.job_size,
    estimateLow: row.estimate_low,
    estimateHigh: row.estimate_high,
    preferredDate: day,
    notes: `${row.notes || ""} · DEPOSIT PAID $${deposit}`.trim(),
  });
}

export async function finalizeBalance(bookingId: number, sessionId: string) {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await sql.query(
    `update bookings set balance_paid = true, invoice_session_id = $2 where id = $1`,
    [bookingId, sessionId],
  );
}
