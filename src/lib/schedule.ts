import type { ServiceKey } from "@/lib/pricebook";

/** One truck, one crew. Four slots is a full day. */
export const DAILY_SLOTS = 4;
export const HORIZON_DAYS = 21;
export const TZ = "America/Chicago";

const SINGLE_ITEM = new Set([
  "bags",
  "small-item",
  "single",
  "dresser",
  "sofa",
  "appliance",
  "fridge",
]);

export function isSingleItem(service: ServiceKey, size: string) {
  return service === "junk-removal" || service === "furniture-appliances"
    ? SINGLE_ITEM.has(size)
    : false;
}

export function slotsFor(service: ServiceKey, size: string): number {
  if (service === "leaf-cleanup") {
    if (size === "small") return 2;
    if (size === "large") return 4;
    if (size === "acreage") return 4;
    return 3;
  }
  if (service === "gutter-cleaning") {
    return size === "complex" ? 3 : 2;
  }
  if (size === "overflow" || size === "full") return 4;
  if (size === "half" || size === "three") return 3;
  if (size === "quarter" || size === "two") return 2;
  return 1;
}

export function todayISO(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function shiftISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

function weekday(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Closed Sunday — one-truck crew. */
export function isWorkday(iso: string): boolean {
  return weekday(iso) !== 0;
}

export function workdaysFrom(startISO: string, count: number): string[] {
  const out: string[] = [];
  let iso = startISO;
  for (let i = 0; i < 60 && out.length < count; i += 1) {
    if (isWorkday(iso)) out.push(iso);
    iso = shiftISO(iso, 1);
  }
  return out;
}

export function formatDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export function formatDayLong(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(dt);
}

export type DayFill = { day: string; used: number };

export function remaining(used: number, need: number) {
  return DAILY_SLOTS - used >= need;
}

export function firstOpenDay(fill: DayFill[], need: number, from = todayISO()): string | null {
  const used = new Map(fill.map((f) => [f.day, f.used]));
  const start = shiftISO(from, 0);
  // Same-day only if we still have morning — skip today, start tomorrow.
  const days = workdaysFrom(shiftISO(start, 1), HORIZON_DAYS);
  return days.find((d) => remaining(used.get(d) ?? 0, need)) ?? null;
}

export function dayOptions(fill: DayFill[], need: number, from = todayISO()) {
  const used = new Map(fill.map((f) => [f.day, f.used]));
  return workdaysFrom(shiftISO(from, 1), HORIZON_DAYS).map((day) => {
    const taken = used.get(day) ?? 0;
    return {
      day,
      used: taken,
      open: remaining(taken, need),
      label: formatDay(day),
    };
  });
}
