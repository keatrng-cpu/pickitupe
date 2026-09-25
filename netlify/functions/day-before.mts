import type { Config } from "@netlify/functions";

/**
 * Day-before reminders, 22:00 UTC = 5 pm CDT (4 pm CST after Nov 1).
 * Netlify runs scheduled functions on the published production deploy only.
 * Needs CRON_SECRET set in Netlify (any long random string) — the site's
 * /api/cron/reminders endpoint refuses calls without it.
 */
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.warn("[day-before] URL or CRON_SECRET missing — no reminders sent");
    return;
  }
  const res = await fetch(`${base}/api/cron/reminders`, { method: "POST", headers: { "x-cron-secret": secret } });
  console.log(`[day-before] ${res.status} ${await res.text()}`);
};

export const config: Config = { schedule: "0 22 * * *" };
