import { getSql } from "@/lib/db";
import { ensurePayColumns } from "@/lib/pay-columns";
import { ensureOwnerTables, logEvent } from "@/lib/owner-schema";
import { formatRange, parseAddOns, type ServiceKey } from "@/lib/pricebook";
import { DAILY_SLOTS, firstOpenDay, slotsFor } from "@/lib/schedule";
import { loadFill } from "@/lib/bookings";
import { notifyOwnerOfBooking } from "@/lib/booking-alert.server";
import { bookedMessage, notifyCustomer } from "@/lib/customer-notify.server";
import { bookedEmail } from "@/lib/email-theme";
import { ensureManageToken, manageUrl } from "@/lib/care.server";

if (typeof window !== "undefined") {
  throw new Error("pay-finalize.server.ts is server-only");
}

/**
 * Record money that arrived through Stripe in the owner books. The session id
 * is unique in `payments`, so a replayed webhook cannot count it twice.
 */
async function recordStripePayment(
  sql: Awaited<ReturnType<typeof getSql>>,
  bookingId: number,
  sessionId: string,
  amountCents: number,
  kind: "deposit" | "balance",
) {
  await ensureOwnerTables(sql);
  await sql.query(
    `insert into payments (booking_id, paid_on, amount_cents, method, kind, stripe_session_id, note)
     values ($1, current_date, $2, 'stripe', $3, $4, 'Paid on the site')
     on conflict (stripe_session_id) do nothing`,
    [bookingId, amountCents, kind, sessionId],
  );
  await logEvent(sql, bookingId, "payment", `${kind === "deposit" ? "Deposit" : "Balance"} $${(amountCents / 100).toFixed(2)} paid by card`);
}

/**
 * The deposit cleared: pick the real day, flip the booking to scheduled, and
 * tell everyone. Called by BOTH the Stripe webhook and the success page
 * (`confirmDeposit`), whichever lands first — the conditional update below is
 * the lock, so the customer and owner are notified exactly once.
 *
 * Returns the day the job actually landed on. It can differ from the day the
 * customer tapped: if that day filled while they were typing a card number,
 * the job moves to the first open day, and the confirmation screen must say
 * so instead of echoing the day from the URL.
 */
export async function finalizePaidDeposit(
  bookingId: number,
  sessionId: string,
  amountCents?: number | null,
): Promise<{ day: string | null; token: string | null; moved: boolean } | null> {
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
  if (!row) return null;
  if (row.deposit_paid) {
    const token = await ensureManageToken(sql, bookingId);
    const cur = await sql.query<{ preferred_date: string | null }>(`select preferred_date from bookings where id = $1`, [bookingId]);
    return { day: cur[0]?.preferred_date ?? null, token, moved: false };
  }

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

  const asked = row.preferred_date;
  const claimed = await sql.query<{ id: number }>(
    `update bookings
        set deposit_paid = true,
            deposit_session_id = $2,
            status = 'scheduled',
            preferred_date = coalesce($3, preferred_date)
      where id = $1 and deposit_paid = false
      returning id`,
    [bookingId, sessionId, day],
  );
  const token = await ensureManageToken(sql, bookingId);
  // Lost the race to the other caller: it already notified everyone.
  if (!claimed.length) return { day, token, moved: false };
  const moved = Boolean(asked && day && asked.slice(0, 10) !== day);
  const link = token ? manageUrl(token) : null;

  const deposit = Math.round((row.deposit_cents || 5000) / 100);
  await recordStripePayment(sql, bookingId, sessionId, amountCents ?? row.deposit_cents ?? 5000, "deposit");
  const range =
    row.estimate_low != null && row.estimate_high != null
      ? formatRange({ low: row.estimate_low, high: row.estimate_high })
      : null;
  await notifyCustomer(
    row.phone,
    row.email,
    bookedMessage({ name: row.name, id: row.id, day, range, deposit, link, moved }),
    bookedEmail({
      id: row.id,
      name: row.name,
      service: row.service,
      jobSize: row.job_size,
      addOns: row.add_ons,
      address: row.address,
      extraAddresses: row.extra_addresses,
      day,
      range: row.estimate_low != null && row.estimate_high != null ? { low: row.estimate_low, high: row.estimate_high } : null,
      deposit,
      notes: row.notes,
      manageUrl: link,
      moved,
    }),
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
    notes: `${row.notes || ""} · DEPOSIT PAID $${deposit}${moved ? ` · asked for ${asked}, full — moved to ${day}` : ""}`.trim(),
  });
  return { day, token, moved };
}

export async function finalizeBalance(bookingId: number, sessionId: string, amountCents?: number | null) {
  const sql = await getSql();
  await ensurePayColumns(sql);
  await sql.query(
    `update bookings set balance_paid = true, invoice_session_id = $2 where id = $1`,
    [bookingId, sessionId],
  );
  if (amountCents && amountCents > 0) {
    await recordStripePayment(sql, bookingId, sessionId, amountCents, "balance");
  }
}
