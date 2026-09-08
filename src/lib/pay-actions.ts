import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  estimate,
  isPromoActive,
  landlordDeposit,
  DEPOSIT,
  type AddOnKey,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";
import { firstOpenDay, slotsFor } from "@/lib/schedule";
import { sessionEmail } from "@/lib/optional-session";
import { isOwnerEmail } from "@/lib/owner";
import { isUsPhone } from "@/lib/phone";

const SITE = (process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "") || "https://pickitupe.com");

const lockInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(200),
  extraAddresses: z.array(z.string().trim().max(200)).max(8).optional(),
  service: z.enum([
    "leaf-cleanup",
    "junk-removal",
    "furniture-appliances",
    "gutter-cleaning",
    "other",
  ]),
  jobSize: z.string().trim().max(40).optional().or(z.literal("")),
  preferredDate: z.string().trim().max(40).optional().or(z.literal("")),
  asap: z.boolean().optional(),
  notes: z.string().trim().max(800).optional().or(z.literal("")),
  estimateLow: z.number().int().min(0).max(100_000).optional(),
  estimateHigh: z.number().int().min(0).max(100_000).optional(),
  pack: z.enum(["turns", "leaves", "combo"]).optional(),
  stops: z.number().int().min(1).max(8).optional(),
});

function depositDollars(pack: LandlordPack | undefined, stops: number) {
  return pack ? landlordDeposit(stops, pack) : DEPOSIT;
}

async function stripeClient() {
  const { getStripe, stripeConfigured } = await import("@/lib/stripe.server");
  return { getStripe, stripeConfigured };
}

export const lockWithDeposit = createServerFn({ method: "POST" })
  .validator((input: unknown) => lockInput.parse(input))
  .handler(async ({ data }) => {
    if (!isUsPhone(data.phone)) {
      return { ok: false as const, error: "Ten-digit phone so we can text the morning of." };
    }
    const { getStripe, stripeConfigured } = await stripeClient();
    if (!stripeConfigured()) {
      return {
        ok: false as const,
        error: "Card checkout isn't live yet. Text 701-213-3969 and we'll hold the day.",
      };
    }

    const { getSql } = await import("@/lib/db");
    const { ensurePayColumns, BOOKING_SELECT } = await import("@/lib/pay-columns");
    const { loadFill } = await import("@/lib/bookings");
    const sql = await getSql();
    await ensurePayColumns(sql);
    const pack = data.pack;
    const stops = Math.min(8, Math.max(1, data.stops ?? 1));
    const extras = (data.extraAddresses ?? []).map((a) => a.trim()).filter(Boolean);
    if (pack && stops > 1 && extras.length < stops - 1) {
      return { ok: false as const, error: `Street for each of the ${stops} stops.` };
    }

    const earlyBird = isPromoActive();
    const priced = estimate({
      service: data.service as ServiceKey,
      size: data.jobSize || "",
      addOns: [] as AddOnKey[],
      earlyBird,
      notes: data.notes || "",
      pack,
      stops: pack ? stops : 1,
    });
    const deposit = depositDollars(pack, stops);
    const need = slotsFor(data.service as ServiceKey, data.jobSize || "single");
    const fill = await loadFill();
    let preferredDate = data.preferredDate || null;
    if (data.asap || preferredDate === "asap") {
      preferredDate = firstOpenDay(fill, need);
    }

    const extraText = extras.length ? extras.join("\n") : null;
    const inserted = await sql.query<{ id: number }>(
      `insert into bookings
        (name, phone, email, address, service, notes, preferred_date, early_bird, status,
         job_size, estimate_low, estimate_high, deposit_cents, deposit_paid, extra_addresses, pack, stops)
       values ($1,$2,$3,$4,$5,$6,$7,$8,'hold',$9,$10,$11,$12,false,$13,$14,$15)
       returning id`,
      [
        data.name,
        data.phone,
        data.email || null,
        data.address,
        data.service,
        data.notes || null,
        preferredDate,
        earlyBird,
        data.jobSize || null,
        priced.range?.low ?? data.estimateLow ?? null,
        priced.range?.high ?? data.estimateHigh ?? null,
        deposit * 100,
        extraText,
        pack ?? null,
        pack ? stops : 1,
      ],
    );
    const id = inserted[0]?.id ?? 0;
    const stripe = getStripe();
    const dayLabel = preferredDate || "first open day";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: deposit * 100,
            product_data: {
              name: `Deposit — Pick It Up E job #${id}`,
              description: `${data.service.replaceAll("-", " ")} · ${dayLabel}. Comes off the invoice.`,
            },
          },
        },
      ],
      success_url: `${SITE}/call?held=1&job=${id}&day=${encodeURIComponent(preferredDate || "")}&code=${encodeURIComponent(`#${id}`)}`,
      cancel_url: `${SITE}/call?cancelled=1`,
      customer_email: data.email || undefined,
      phone_number_collection: { enabled: true },
      metadata: {
        app: "pickitupe",
        kind: "deposit",
        bookingId: String(id),
      },
      custom_text: {
        submit: {
          message: `$${deposit} holds the day and comes off the final invoice. No hold without the card.`,
        },
      },
    });
    if (!session.url) {
      return { ok: false as const, error: "Couldn't open card checkout. Text 701-213-3969." };
    }
    await sql.query(`update bookings set deposit_session_id = $2 where id = $1`, [id, session.id]);
    return { ok: true as const, id, url: session.url, deposit, preferredDate };
  });

export const startBalanceInvoice = createServerFn({ method: "POST" })
  .middleware([sessionEmail])
  .validator((input: unknown) => z.object({ id: z.number().int() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!isOwnerEmail(context.email)) {
      return { ok: false as const, error: "Forbidden" };
    }
    const { getStripe, stripeConfigured } = await stripeClient();
    if (!stripeConfigured()) {
      return { ok: false as const, error: "Stripe isn't configured." };
    }
    const { getSql } = await import("@/lib/db");
    const { ensurePayColumns } = await import("@/lib/pay-columns");
    const sql = await getSql();
    await ensurePayColumns(sql);
    const rows = await sql.query<{
      id: number;
      email: string | null;
      estimate_high: number | null;
      estimate_low: number | null;
      deposit_cents: number;
      deposit_paid: boolean;
      balance_paid: boolean;
    }>(
      `select id, email, estimate_high, estimate_low, deposit_cents, deposit_paid, balance_paid from bookings where id = $1`,
      [data.id],
    );
    const row = rows[0];
    if (!row) return { ok: false as const, error: "No job." };
    if (row.balance_paid) return { ok: false as const, error: "Already invoiced." };
    const high = row.estimate_high ?? row.estimate_low ?? 0;
    const deposit = Math.round((row.deposit_cents || 0) / 100);
    const rest = Math.max(0, high - (row.deposit_paid ? deposit : 0));
    if (rest < 1) return { ok: false as const, error: "Nothing left on the high end." };
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: rest * 100,
            product_data: {
              name: `Balance — Pick It Up E job #${row.id}`,
              description: `Quoted high $${high} less $${deposit} deposit.`,
            },
          },
        },
      ],
      success_url: `${SITE}/jobs?invoiced=${row.id}`,
      cancel_url: `${SITE}/jobs`,
      customer_email: row.email || undefined,
      metadata: { app: "pickitupe", kind: "balance", bookingId: String(row.id) },
    });
    if (!session.url) return { ok: false as const, error: "Couldn't make the invoice link." };
    await sql.query(`update bookings set invoice_session_id = $2 where id = $1`, [row.id, session.id]);
    return { ok: true as const, url: session.url, amount: rest };
  });

export const startSpringHold = createServerFn({ method: "POST" })
  .validator((input: unknown) =>
    z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(7).max(24),
        email: z.string().trim().email().optional().or(z.literal("")),
        address: z.string().trim().min(5).max(200),
        tier: z.enum(["small", "standard", "large"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!isUsPhone(data.phone)) {
      return { ok: false as const, error: "Ten-digit phone." };
    }
    const { getStripe, stripeConfigured } = await stripeClient();
    if (!stripeConfigured()) {
      return { ok: false as const, error: "Text 701-213-3969 and we'll hold spring at this year's rate." };
    }
    const { getSql } = await import("@/lib/db");
    const { ensurePayColumns } = await import("@/lib/pay-columns");
    const sql = await getSql();
    await ensurePayColumns(sql);
    const size = data.tier === "small" ? "small" : data.tier === "large" ? "large" : "medium";
    const inserted = await sql.query<{ id: number }>(
      `insert into bookings
        (name, phone, email, address, service, notes, preferred_date, early_bird, status,
         job_size, deposit_cents, deposit_paid, pack, stops)
       values ($1,$2,$3,$4,'leaf-cleanup',$5,null,false,'hold',$6,5000,false,null,1)
       returning id`,
      [
        data.name,
        data.phone,
        data.email || null,
        data.address,
        "Spring plan hold — $50 at this year's rate, two visits once the plan is on the card.",
        size,
      ],
    );
    const id = inserted[0]?.id ?? 0;
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: 5000,
            product_data: {
              name: `Spring hold — Pick It Up E`,
              description: `${data.tier} lot. $50 holds the spring slot at this year's rate and comes off the plan.`,
            },
          },
        },
      ],
      success_url: `${SITE}/plan?held=1`,
      cancel_url: `${SITE}/plan?cancelled=1`,
      customer_email: data.email || undefined,
      phone_number_collection: { enabled: true },
      metadata: { app: "pickitupe", kind: "deposit", bookingId: String(id) },
    });
    if (!session.url) return { ok: false as const, error: "Couldn't open checkout." };
    return { ok: true as const, url: session.url };
  });

export const stripeReady = createServerFn({ method: "GET" }).handler(async () => {
  const { stripeConfigured } = await stripeClient();
  return { ready: stripeConfigured() };
});
