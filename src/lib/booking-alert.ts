import { formatRange } from "@/lib/pricebook";

/**
 * The owner's "you have a lead" message, as plain text.
 *
 * Pure: no env, no I/O, so it is unit-testable and cannot be the thing that
 * breaks a booking. The sender lives in `booking-alert.server.ts`.
 *
 * Why this exists at all: `submitBooking` used to insert a row and stop. The
 * only way to learn a lead had arrived was to sign in to /jobs and look. For a
 * one-person business that answers the phone from the truck, a lead nobody
 * sees for two days is a lead that booked someone else.
 */

export type BookingAlertInput = {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address: string;
  service: string;
  jobSize?: string | null;
  addOns?: string[] | null;
  estimateLow?: number | null;
  estimateHigh?: number | null;
  urgency?: string | null;
  preferredDate?: string | null;
  notes?: string | null;
  neighborOf?: string | null;
  households?: number | null;
  appliedDiscount?: string | null;
  discount?: number | null;
  areaTier?: string | null;
};

const SERVICE_LABEL: Record<string, string> = {
  "leaf-cleanup": "Fall leaf & yard cleanup",
  "junk-removal": "Junk & furniture",
  "furniture-appliances": "Junk & furniture",
  "gutter-cleaning": "Gutter cleaning",
  other: "Something else",
};

const URGENCY_LABEL: Record<string, string> = {
  "before-vacuum": "Before city vacuum",
  "this-week": "THIS WEEK (rush)",
  flexible: "Flexible",
};

export function serviceLabel(key: string): string {
  return SERVICE_LABEL[key] ?? key;
}

export function bookingAlertSubject(b: BookingAlertInput): string {
  const rush = b.urgency === "this-week" ? "RUSH — " : "";
  return `${rush}New booking #${b.id} — ${serviceLabel(b.service)} — ${b.address}`;
}

export function bookingAlertText(b: BookingAlertInput, jobsUrl: string): string {
  const lines: string[] = [];
  const estimate =
    typeof b.estimateLow === "number" && typeof b.estimateHigh === "number"
      ? formatRange({ low: b.estimateLow, high: b.estimateHigh })
      : "no instant estimate (needs a quote)";

  lines.push(`${b.name} — ${b.phone}`);
  if (b.email) lines.push(b.email);
  lines.push(b.address + (b.areaTier && b.areaTier !== "unknown" ? `  [${b.areaTier}]` : ""));
  lines.push("");
  lines.push(`Service:   ${serviceLabel(b.service)}`);
  if (b.jobSize) lines.push(`Size:      ${b.jobSize}`);
  if (b.addOns && b.addOns.length > 0) lines.push(`Add-ons:   ${b.addOns.join(", ")}`);
  lines.push(`Estimate:  ${estimate}`);
  if (b.appliedDiscount && b.appliedDiscount !== "none") {
    lines.push(`Discount:  ${b.appliedDiscount}${b.discount ? ` (up to $${b.discount})` : ""}`);
  }
  if (b.urgency) lines.push(`When:      ${URGENCY_LABEL[b.urgency] ?? b.urgency}`);
  if (b.preferredDate) lines.push(`Preferred: ${b.preferredDate}`);
  if ((b.households ?? 1) >= 2) {
    lines.push(`Block:     ${b.households} houses${b.neighborOf ? ` — neighbour at ${b.neighborOf}` : ""}`);
  }
  if (b.notes?.trim()) {
    lines.push("");
    lines.push("Notes:");
    lines.push(b.notes.trim());
  }
  lines.push("");
  lines.push(`Text them back: sms:${b.phone.replace(/\D/g, "")}`);
  lines.push(`Board: ${jobsUrl}`);
  return lines.join("\n");
}
