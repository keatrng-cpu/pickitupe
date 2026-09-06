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

export function parseSpokenDay(
  text: string,
  from = todayISO(),
): { day?: string; asap?: boolean } | null {
  const t = text.toLowerCase();
  if (/\basap\b|soonest|as soon as|first open/.test(t)) return { asap: true };
  if (/\btoday\b/.test(t)) {
    if (isWorkday(from)) return { day: from, asap: false };
    const next = workdaysFrom(shiftISO(from, 1), 1)[0];
    return next ? { day: next, asap: false } : { asap: true };
  }
  if (/\btomorrow\b/.test(t)) {
    const next = workdaysFrom(shiftISO(from, 1), 1)[0];
    return next ? { day: next, asap: false } : { asap: true };
  }
  const iso = t.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return { day: iso[1], asap: false };

  const monthHit = t.match(
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  );
  if (monthHit) {
    const MONTHS: Record<string, string> = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12",
    };
    const mm = MONTHS[monthHit[1].slice(0, 3)];
    const n = Number(monthHit[2]);
    if (mm && n >= 1 && n <= 31) {
      const year = Number(from.slice(0, 4));
      const dd = String(n).padStart(2, "0");
      let day = `${year}-${mm}-${dd}`;
      if (day < from) day = `${year + 1}-${mm}-${dd}`;
      return { day, asap: false };
    }
  }

  const weekdays = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const wd = t.match(
    /\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/,
  );
  if (wd) {
    const want = weekdays.indexOf(wd[1]);
    if (want === 0) {
      const monday = workdaysFrom(shiftISO(from, 1), 7).find((d) => weekday(d) === 1);
      return monday ? { day: monday, asap: false } : { asap: true };
    }
    const hit = workdaysFrom(shiftISO(from, 1), 14).find((d) => weekday(d) === want);
    if (hit) return { day: hit, asap: false };
  }
  return null;
}
