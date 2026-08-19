import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  isPromoActive,
  PROMO_CAP,
  PROMO_DEADLINE_LABEL,
  PROMO_PERCENT,
} from "@/lib/pricebook";
import { z } from "zod";

const bookingInput = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(24),
  email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(200),
  service: z.enum([
    "leaf-cleanup",
    "junk-removal",
    "garage-basement",
    "furniture-appliances",
    "single-item",
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
};

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

export const submitBooking = createServerFn({ method: "POST" })
  .validator((input: unknown) => bookingInput.parse(input))
  .handler(async ({ data }) => {
    const sql = await getSql();
    // Recomputed server-side from the server clock — never trust a
    // client-supplied flag for something that changes the price.
    const earlyBird = isPromoActive();

    const inserted = await sql<{ id: number }>`
      insert into bookings
        (name, phone, email, address, service, notes, preferred_date, early_bird, status,
         urgency, job_size, add_ons, estimate_low, estimate_high, lat, lon, area_tier, neighbor_of)
      values
        (
          ${data.name},
          ${data.phone},
          ${data.email || null},
          ${data.address},
          ${data.service},
          ${data.notes || null},
          ${data.preferredDate || null},
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
          ${data.neighborOf || null}
        )
      returning id
    `;

    return {
      ok: true as const,
      id: inserted[0]?.id ?? 0,
      earlyBird,
    };
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const sql = await getSql();
    return sql<BookingRow>`
      select id, name, phone, email, address, service, notes,
             preferred_date, early_bird, status, created_at,
             urgency, job_size, add_ons, estimate_low, estimate_high,
             lat, lon, area_tier, neighbor_of
      from bookings
      order by created_at desc
      limit 200
    `;
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) =>
    z
      .object({
        id: z.number(),
        status: z.enum(["new", "quoted", "scheduled", "done", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const sql = await getSql();
    await sql`
      update bookings set status = ${data.status} where id = ${data.id}
    `;
    return { ok: true as const };
  });

const estimateInput = z.object({
  service: z.string().min(1).max(40),
  notes: z.string().max(400).optional().or(z.literal("")),
  photoDataUrl: z.string().max(2_000_000).optional().or(z.literal("")),
});

export const estimateJob = createServerFn({ method: "POST" })
  .validator((input: unknown) => estimateInput.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) {
      return {
        ok: false as const,
        error: "Photo estimates are not available in this environment yet.",
      };
    }

    const userText = `You are quoting for Pick It Up E, a Grand Forks ND leaf cleanup and junk removal company.
Give a short, friendly estimate range in USD for a typical local job. Be conservative.
Service: ${data.service}
Notes: ${data.notes || "none"}
If a photo is attached, use it. Reply with 2-4 sentences and a $low–$high range. No markdown.`;

    const content: unknown[] = [{ type: "text", text: userText }];
    if (data.photoDataUrl?.startsWith("data:image")) {
      content.push({
        type: "image_url",
        image_url: { url: data.photoDataUrl },
      });
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 220,
        messages: [{ role: "user", content }],
      }),
    });

    if (!res.ok) {
      return { ok: false as const, error: `Could not estimate (${res.status}).` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return {
      ok: true as const,
      text: body.choices?.[0]?.message?.content ?? "Call or text for a quote.",
    };
  });
