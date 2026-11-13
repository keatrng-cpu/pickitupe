import type { ServiceKey } from "@/lib/pricebook";
import { hasGutterBundle, normalizeAddOns } from "@/lib/pricebook";

/**
 * One truck, one crew. Four two-hour slots is a full weekday.
 *
 * Truck hours (owner, 2026-11-13): weekdays 9:30am–5:30pm (trading runs
 * 8:00–9:30, so nothing books before 9:30), Saturday 12–4pm, closed Sunday.
 *
 * The hours are built around the Grand Forks landfill (2701 N 69th St),
 * which is open Mon–Fri 8–4 and Sat 8–11 per the city's landfill page. So:
 *   - Weekday slots: A 9:30–11:30, B 11:30–1:30, C 1:30–3:30, D 3:30–5:30.
 *     Landfill-bound loads use A–C only — loading is done by ~2:30 and the
 *     last load is tipped before the 4:00 close. D takes light work only.
 *   - Saturday: two slots, 12–2 and 2–4, light work only. The landfill
 *     closes at 11, so nothing that needs it books on a Saturday.
 * "Light" = a job that doesn't need a landfill run that day: one piece or
 * bags (rides to the next morning's first dump), gutters, and later estate
 * walkthroughs and roll-off loading.
 *
 * DAILY_SLOTS stays the weekday maximum for meters that need one number;
 * use capacityFor(day) wherever the day is known. Public hours live in
 * BUSINESS.hoursLine (seo.ts) and the schema's OPENING_HOURS.
 */
export const DAILY_SLOTS = 4;
export const SATURDAY_SLOTS = 2;
/** Landfill-bound slots on a weekday (A–C). Saturday has none. */
export const WEEKDAY_LANDFILL_SLOTS = 3;
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

export function slotsFor(service: ServiceKey, size: string, addOns: string[] = []): number {
  let n = 1;
  if (service === "leaf-cleanup") {
    if (size === "small") n = 2;
    else if (size === "large" || size === "acreage") n = 4;
    else n = 3;
  } else if (service === "gutter-cleaning") {
    n = size === "complex" ? 3 : 2;
  } else if (size === "overflow") {
    // Two trips: the whole landfill window (A–C), first load tipped midday.
    n = 3;
  } else if (size === "full" || size === "half" || size === "three") {
    // A heaped bed is ~2 hours with the dump run, not a whole day.
    n = 2;
  } else if (size === "quarter" || size === "two") {
    n = 1;
  } else {
    n = 1;
  }
  const extras = normalizeAddOns(addOns);
  if (hasGutterBundle(extras)) n = Math.min(DAILY_SLOTS, n + 1);
  if (extras.includes("porch-piece")) n = Math.min(DAILY_SLOTS, n + 1);
  return n;
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

/** `landfill` = landfill-bound slots already booked that day (0 if unknown). */
export type DayFill = { day: string; used: number; landfill?: number };

/** What a job asks of the calendar: how many slots, and whether it needs the landfill that day. */
export type Need = { slots: number; landfill: boolean };

/**
 * Does this job need a landfill run the same day? Junk loads bigger than one
 * piece do. One piece / bags ride to the next morning's first dump, gutter
 * debris is a few bags, and leaf loads go to the yard-waste site (its winter
 * and Saturday hours are unverified — revisit before spring leaves).
 */
export function needsLandfill(service: ServiceKey, size: string): boolean {
  if (service !== "junk-removal" && service !== "furniture-appliances") return false;
  return !SINGLE_ITEM.has(size);
}

export function needFor(service: ServiceKey, size: string, addOns: string[] = []): Need {
  return { slots: slotsFor(service, size, addOns), landfill: needsLandfill(service, size) };
}

function asNeed(need: number | Need): Need {
  return typeof need === "number" ? { slots: need, landfill: false } : need;
}

/** Total slots the truck runs that day: 4 on weekdays, 2 on Saturday, 0 on Sunday. */
export function capacityFor(iso: string): number {
  const wd = weekday(iso);
  if (wd === 0) return 0;
  if (wd === 6) return SATURDAY_SLOTS;
  return DAILY_SLOTS;
}

/** Slots that can hold landfill-bound work that day: 3 on weekdays (A–C), none on Saturday or Sunday. */
export function landfillCapacityFor(iso: string): number {
  const wd = weekday(iso);
  return wd === 0 || wd === 6 ? 0 : WEEKDAY_LANDFILL_SLOTS;
}

/** True if `need` still fits on `day` given what's already booked. */
export function fitsDay(day: string, used: number, landfillUsed: number, need: number | Need): boolean {
  const n = asNeed(need);
  if (capacityFor(day) - used < n.slots) return false;
  if (n.landfill && landfillCapacityFor(day) - landfillUsed < n.slots) return false;
  return true;
}

/** True if the day is already past either limit (used to catch a double-booking race). */
export function overCapacity(f: DayFill): boolean {
  return f.used > capacityFor(f.day) || (f.landfill ?? 0) > landfillCapacityFor(f.day);
}

/** Back-compat: weekday check with no landfill rule. Prefer fitsDay. */
export function remaining(used: number, need: number) {
  return DAILY_SLOTS - used >= need;
}

export function firstOpenDay(fill: DayFill[], need: number | Need, from = todayISO()): string | null {
  const byDay = new Map(fill.map((f) => [f.day, f]));
  const start = shiftISO(from, 0);
  // Same-day only if we still have morning — skip today, start tomorrow.
  const days = workdaysFrom(shiftISO(start, 1), HORIZON_DAYS);
  return (
    days.find((d) => {
      const f = byDay.get(d);
      return fitsDay(d, f?.used ?? 0, f?.landfill ?? 0, need);
    }) ?? null
  );
}

export function dayOptions(fill: DayFill[], need: number | Need, from = todayISO()) {
  const byDay = new Map(fill.map((f) => [f.day, f]));
  return workdaysFrom(shiftISO(from, 1), HORIZON_DAYS).map((day) => {
    const f = byDay.get(day);
    const taken = f?.used ?? 0;
    return {
      day,
      used: taken,
      capacity: capacityFor(day),
      open: fitsDay(day, taken, f?.landfill ?? 0, need),
      label: formatDay(day),
    };
  });
}

/** Sum booked slots per day from rows that carry service / size / add-ons. */
export function fillFromRows(
  rows: { day: string; service: ServiceKey; size: string; addOns: string[] }[],
): DayFill[] {
  const byDay = new Map<string, DayFill>();
  for (const r of rows) {
    const n = needFor(r.service, r.size, r.addOns);
    const f = byDay.get(r.day) ?? { day: r.day, used: 0, landfill: 0 };
    f.used += n.slots;
    if (n.landfill) f.landfill = (f.landfill ?? 0) + n.slots;
    byDay.set(r.day, f);
  }
  return [...byDay.values()];
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
