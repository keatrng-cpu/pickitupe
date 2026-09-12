/**
 * Hours and pay arithmetic for the crew portal — pure, tested in
 * scripts/crew.test.mjs. Wage is cents per hour; hours are decimal to the
 * hundredth. Pay is rounded to the cent per entry, then summed, so what the
 * crew member sees per shift adds up to what the owner books.
 */
export type TimeSpan = { started_at: string; ended_at: string | null };

export function hoursBetween(startIso: string, endIso: string | null, now: Date = new Date()): number {
  const start = Date.parse(startIso);
  const end = endIso ? Date.parse(endIso) : now.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round(((end - start) / 3_600_000) * 100) / 100;
}

export function payCents(hours: number, wageCents: number): number {
  return Math.round(hours * wageCents);
}

export function totals(entries: TimeSpan[], wageCents: number, now: Date = new Date()) {
  let hours = 0;
  let cents = 0;
  for (const e of entries) {
    const h = hoursBetween(e.started_at, e.ended_at, now);
    hours += h;
    cents += payCents(h, wageCents);
  }
  return { hours: Math.round(hours * 100) / 100, cents };
}

/** Monday-start week containing `iso` (YYYY-MM-DD), as [fromISO, toISO] inclusive. */
export function weekOf(iso: string): [string, string] {
  const d = new Date(`${iso}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  const from = new Date(d);
  from.setUTCDate(d.getUTCDate() - dow);
  const to = new Date(from);
  to.setUTCDate(from.getUTCDate() + 6);
  return [from.toISOString().slice(0, 10), to.toISOString().slice(0, 10)];
}
