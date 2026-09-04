import type { ServiceKey } from "@/lib/pricebook";

export const LAST_BOOKING_KEY = "piu-bookings";

export type SavedBooking = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  service: ServiceKey | string;
  size: string;
  at: string;
};

export function readLastBooking(): SavedBooking | null {
  try {
    const raw = localStorage.getItem(LAST_BOOKING_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as SavedBooking[];
    return Array.isArray(list) && list[0]?.phone ? list[0] : null;
  } catch {
    return null;
  }
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
}
