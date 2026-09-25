import { PHONE } from "@/lib/messages";

/**
 * Google Calendar "add event" link for a job day — all-day, because the crew
 * texts the arrival window the morning of. Client-safe (no server imports).
 */
export function googleCalendarUrl(input: { day: string; jobId: number; service: string; address?: string | null }) {
  const start = input.day.replaceAll("-", "");
  const next = new Date(`${input.day}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const end = next.toISOString().slice(0, 10).replaceAll("-", "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: `Pick It Up E — ${input.service}`,
    dates: `${start}/${end}`,
    details: `Job #${input.jobId}. Keaton texts a window the morning of. ${PHONE}`,
    location: input.address || "",
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}
