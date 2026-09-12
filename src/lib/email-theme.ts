import { serviceLabel } from "@/lib/booking-alert";
import { PHONE, REVIEW_URL } from "@/lib/messages";
import { formatAddOns, formatRange, sizeOptionsFor, type ServiceKey } from "@/lib/pricebook";
import { formatDayLong } from "@/lib/schedule";

/**
 * Customer emails in the site's own clothes: deep Sioux green ground, a paper
 * card with mahogany type (the door hanger's palette), gold rules, one green
 * button. Table layout + inline styles because that is what Gmail, Outlook and
 * Apple Mail actually render; no web fonts (Georgia stands in for Playfair).
 *
 * Pure: no env, no fetch. `customer-notify.server.ts` sends what this builds.
 * Every message also ships a plain-text twin — that's what the SMS carries and
 * what a text-only client shows.
 */

const SITE = "https://pickitupe.com";
const LOGO = `${SITE}/logo.png`;

const C = {
  ground: "#04351c",
  green: "#064e2a",
  sioux: "#009a44",
  cream: "#ede3d0",
  gold: "#d4c4a0",
  paper: "#f3ead6",
  print: "#3c1e14",
  mahogany: "#4a2418",
  muted: "#7a5a4a",
} as const;

export type EmailDoc = { subject: string; html: string; text: string };

function esc(s: string) {
  return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** "medium" → "Medium lot"; unknown keys pass through untouched. */
export function sizeLabel(service: string, size: string | null | undefined) {
  if (!size) return "";
  const opts = sizeOptionsFor(service as ServiceKey);
  return opts.find((o) => o.value === size)?.label ?? size;
}

export function firstName(name: string | null | undefined) {
  return (name || "there").trim().split(/\s+/)[0];
}

/** Google Calendar "add event" link for an all-day job. */
export function calendarLink(input: { day: string; title: string; details: string; location: string }) {
  const d = input.day.replaceAll("-", "");
  const next = new Date(`${input.day}T12:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  const d2 = next.toISOString().slice(0, 10).replaceAll("-", "");
  const q = new URLSearchParams({ action: "TEMPLATE", text: input.title, dates: `${d}/${d2}`, details: input.details, location: input.location });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

type ShellInput = {
  preheader: string;
  kicker: string;
  title: string;
  /** Already-escaped HTML for the card body. */
  body: string;
  cta?: { label: string; url: string };
  /** Small line under the button. */
  aside?: string;
};

function shell(i: ShellInput) {
  const button = i.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:28px auto 0"><tr>
         <td style="border-radius:999px;background:${C.sioux}">
           <a href="${esc(i.cta.url)}" style="display:inline-block;padding:14px 28px;font:600 16px/1 'Outfit',Arial,sans-serif;color:${C.cream};text-decoration:none;border-radius:999px">${esc(i.cta.label)}</a>
         </td></tr></table>`
    : "";
  const aside = i.aside ? `<p style="margin:14px 0 0;text-align:center;font:14px/1.5 'Outfit',Arial,sans-serif;color:${C.muted}">${i.aside}</p>` : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light only"><title>${esc(i.title)}</title></head>
<body style="margin:0;padding:0;background:${C.ground}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(i.preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${C.ground}">
<tr><td align="center" style="padding:28px 12px 40px">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px">
    <tr><td style="padding:0 8px 18px">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
        <td style="padding-right:12px"><img src="${LOGO}" width="44" height="44" alt="" style="display:block;border-radius:12px"></td>
        <td style="font:700 22px/1 Georgia,'Playfair Display',serif;color:${C.cream};letter-spacing:0.01em">Pick It Up E<br><span style="font:12px/1.6 'Outfit',Arial,sans-serif;color:${C.gold};letter-spacing:0.22em;text-transform:uppercase">Grand Forks · East Grand Forks</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${C.paper};border-radius:20px;padding:34px 30px 30px;border-top:6px solid ${C.gold}">
      <p style="margin:0;font:12px/1 'Outfit',Arial,sans-serif;color:${C.sioux};letter-spacing:0.28em;text-transform:uppercase">${esc(i.kicker)}</p>
      <h1 style="margin:12px 0 0;font:700 32px/1.15 Georgia,'Playfair Display',serif;color:${C.print}">${esc(i.title)}</h1>
      <div style="font:16px/1.55 'Outfit',Arial,sans-serif;color:${C.print}">${i.body}</div>
      ${button}${aside}
    </td></tr>
    <tr><td style="padding:22px 10px 0;text-align:center;font:13px/1.7 'Outfit',Arial,sans-serif;color:${C.gold}">
      Questions? Reply to this email or text <a href="tel:${PHONE.replaceAll("-", "")}" style="color:${C.cream};text-decoration:none;font-weight:600">${PHONE}</a><br>
      <a href="${SITE}" style="color:${C.gold};text-decoration:underline">pickitupe.com</a> · Leaves, junk, single-story gutters · The cream truck with the maple leaf
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}

/** The mahogany "ticket" block — job facts, cream on dark. */
function ticket(rows: [string, string][]) {
  const tr = rows
    .filter(([, v]) => v)
    .map(
      ([k, v]) => `<tr>
        <td style="padding:7px 0;font:12px/1.4 'Outfit',Arial,sans-serif;color:${C.gold};letter-spacing:0.16em;text-transform:uppercase;vertical-align:top;width:34%">${esc(k)}</td>
        <td style="padding:7px 0 7px 12px;font:16px/1.4 'Outfit',Arial,sans-serif;color:${C.cream};vertical-align:top">${esc(v)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:22px 0 0;background:${C.mahogany};border-radius:14px"><tr><td style="padding:16px 20px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${tr}</table></td></tr></table>`;
}

function steps(items: string[]) {
  return `<ol style="margin:18px 0 0;padding:0 0 0 22px;font:16px/1.6 'Outfit',Arial,sans-serif;color:${C.print}">${items.map((s) => `<li style="margin:0 0 8px">${s}</li>`).join("")}</ol>`;
}

export type BookedInput = {
  id: number;
  name: string;
  service: string;
  jobSize?: string | null;
  addOns?: string | string[] | null;
  address: string;
  extraAddresses?: string | null;
  day: string | null;
  range?: { low: number; high: number } | null;
  deposit: number;
  notes?: string | null;
};

/** "You're booked" — sent the moment the deposit clears. */
export function bookedEmail(b: BookedInput): EmailDoc {
  const first = firstName(b.name);
  const when = b.day ? formatDayLong(b.day) : "the first open day — we'll text you which";
  const range = b.range ? formatRange(b.range) : null;
  const svc = serviceLabel(b.service);
  const addOns = b.addOns ? formatAddOns(b.addOns) : "";
  const where = [b.address, b.extraAddresses].filter(Boolean).join(" · ");
  const isLeaves = b.service === "leaf-cleanup";
  const isGutters = b.service === "gutter-cleaning";

  const opener = isLeaves
    ? `Your leaves have a date with a truck. We'll show up ${b.day ? `on <b>${esc(when)}</b>` : "on the first open day"}, rake, tarp and haul every last one, and leave you a yard the neighbors will ask about.`
    : isGutters
      ? `Your gutters are on the calendar for ${b.day ? `<b>${esc(when)}</b>` : "the first open day"}. Ground vacuum, no ladders on your siding, downspouts checked — done before the freeze.`
      : `Consider it gone. We're coming ${b.day ? `on <b>${esc(when)}</b>` : "on the first open day"} to load it up and drive it off — you don't lift a thing.`;

  const body = `
    <p style="margin:18px 0 0">Hey ${esc(first)} — ${opener}</p>
    ${ticket([
      ["Job", `#${b.id}`],
      ["Day", when],
      ["Address", where],
      ["Service", svc],
      ["Size", [sizeLabel(b.service, b.jobSize), addOns].filter(Boolean).join(" · ")],
      ["Estimate", range ? `${range} — final number on the day, before we start` : ""],
      ["Deposit", `$${b.deposit} on the card — comes right off the invoice`],
    ])}
    <h2 style="margin:26px 0 0;font:700 20px/1.2 Georgia,'Playfair Display',serif;color:${C.print}">What happens next</h2>
    ${steps([
      `<b>The morning of</b> — Keaton texts you a window. Nothing to prep${isLeaves ? "; leave the gate unlocked if the back yard is on the list" : isGutters ? "; we bring the power cord, an outside outlet helps" : "; just point at the pile"}.`,
      `<b>We work</b> — ${isLeaves ? "rake, tarp, load, sweep the walk" : isGutters ? "vacuum, flush the downspouts, bag the muck" : "load, sweep, gone"}. ${isLeaves || isGutters ? "You don't need to be home." : "If it's inside, someone 18+ lets us in."}`,
      `<b>You pay the balance</b> — card, cash or check, ${range ? `the estimate less your $${b.deposit}` : `your quote less the $${b.deposit}`}. Receipt by text and email.`,
    ])}
    <p style="margin:22px 0 0;padding:14px 16px;background:#fff8ea;border-left:4px solid ${C.gold};border-radius:8px;font-size:15px">Need a different day? Reply to this email or text <b>${PHONE}</b> — moving it is free, no questions.</p>
    ${b.notes ? `<p style="margin:16px 0 0;font-size:14px;color:${C.muted}"><b>Your note:</b> ${esc(b.notes)}</p>` : ""}`;

  const cta = b.day
    ? {
        label: "Add it to my calendar",
        url: calendarLink({
          day: b.day,
          title: `Pick It Up E — ${svc}`,
          details: `Job #${b.id}. ${range ? `Estimate ${range}, ` : ""}$${b.deposit} deposit paid. Keaton texts a window the morning of. ${PHONE}`,
          location: b.address,
        }),
      }
    : { label: "See your booking", url: `${SITE}/call` };

  const subject = isLeaves ? `You're booked, ${first} — leaves out ${b.day ? formatDayLong(b.day) : "soon"} 🍁` : `You're booked, ${first} — job #${b.id}`;
  const text = [
    `You're booked, ${first}. Job #${b.id}.`,
    `${when}. ${svc}${addOns ? ` · ${addOns}` : ""}.`,
    where,
    range ? `Estimate ${range} — final number on the day, before we start.` : "",
    `$${b.deposit} deposit is on the card and comes off the invoice.`,
    `Keaton texts a window the morning of. Need a different day? Text ${PHONE}.`,
    `— Pick It Up E, ${SITE}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    text,
    html: shell({
      preheader: `${when} · ${svc} · $${b.deposit} deposit received`,
      kicker: "You're booked",
      title: isLeaves ? "The leaves are as good as gone." : isGutters ? "Gutters: handled." : "Consider it hauled.",
      body,
      cta,
      aside: `Job #${b.id} · ${esc(when)}`,
    }),
  };
}

export type DoneInput = { id: number; name: string; service: string; estimate?: string | null };

/** "All done" with the review ask — sent when the owner marks the job done. */
export function doneEmail(d: DoneInput): EmailDoc {
  const first = firstName(d.name);
  const svc = serviceLabel(d.service);
  const isLeaves = d.service === "leaf-cleanup";
  const body = `
    <p style="margin:18px 0 0">${esc(first)} — ${isLeaves ? "the yard's clear and the leaves are on their way to the compost site" : "the load is gone and the spot's swept"}. Thanks for having us out.</p>
    ${d.estimate ? `<p style="margin:14px 0 0">Your invoice is <b>${esc(d.estimate)}</b> less the deposit you already put down. If you haven't settled up on the spot, Keaton will text a card link.</p>` : ""}
    <p style="margin:14px 0 0">One ask: if we did right by you, a Google review is how the next neighbor finds a truck that shows up. Thirty seconds, and it means more to a two-man outfit than you'd think.</p>
    <p style="margin:14px 0 0;font-size:15px;color:${C.muted}">Anything not right? Reply here or text ${PHONE} and we'll come back and fix it — no charge.</p>`;
  return {
    subject: `All done, ${first} — ${isLeaves ? "yard's clear" : "load's gone"} (job #${d.id})`,
    text: `All done, ${first} — ${isLeaves ? "yard's clear" : "load's gone"}.${d.estimate ? ` Invoice is ${d.estimate} less your deposit.` : ""} If we did right by you, tap this and leave a Google review — takes 30 seconds. ${REVIEW_URL} — Pick It Up E`,
    html: shell({
      preheader: `Job #${d.id} finished · ${svc}`,
      kicker: "All done",
      title: isLeaves ? "Yard's clear." : "It's gone.",
      body,
      cta: { label: "Leave a Google review", url: REVIEW_URL },
      aside: `Job #${d.id} · ${esc(svc)}`,
    }),
  };
}

export type LeadEmailInput = {
  /** Where the lead came from — "Missed call", "Voicemail", "Text". */
  channel: string;
  phone: string;
  when: string;
  transcript?: string | null;
  recordingUrl?: string | null;
  bookingId?: number | null;
  jobsUrl: string;
  /** False while toll-free texting is unverified — the copy stops claiming a text went out. */
  textedBack?: boolean;
};

/** Owner alert for a call that went to the machine. Plain shell, one button. */
export function leadEmail(l: LeadEmailInput): EmailDoc {
  const body = `
    <p style="margin:18px 0 0">${esc(l.channel)} from <b>${esc(l.phone)}</b> at ${esc(l.when)}.</p>
    ${l.transcript ? `<p style="margin:14px 0 0;padding:14px 16px;background:#fff8ea;border-left:4px solid ${C.gold};border-radius:8px;font-size:15px;white-space:pre-wrap">${esc(l.transcript)}</p>` : `<p style="margin:14px 0 0;color:${C.muted}">No message left.${l.textedBack === false ? " They heard the website in the greeting." : " They got the text with the booking link."}</p>`}
    ${l.recordingUrl ? `<p style="margin:14px 0 0;font-size:14px"><a href="${esc(l.recordingUrl)}" style="color:${C.sioux}">Play the voicemail</a></p>` : ""}
    <p style="margin:14px 0 0;font-size:15px">Call back within the hour — the ${l.textedBack === false ? "greeting" : "text"} told them you would.</p>`;
  return {
    subject: `${l.channel}: ${l.phone}${l.transcript ? ` — "${l.transcript.slice(0, 60)}${l.transcript.length > 60 ? "…" : ""}"` : ""}`,
    text: `${l.channel} from ${l.phone} at ${l.when}.\n${l.transcript ?? "No message left."}\n${l.recordingUrl ?? ""}\n${l.jobsUrl}`.trim(),
    html: shell({
      preheader: `${l.channel} from ${l.phone}`,
      kicker: "Owner alert",
      title: `${l.channel} — ${l.phone}`,
      body,
      cta: { label: l.bookingId ? `Open lead #${l.bookingId}` : "Open the board", url: l.jobsUrl },
      aside: `<a href="tel:${esc(l.phone.replace(/\D/g, ""))}" style="color:${C.sioux};font-weight:600;text-decoration:none">Tap to call ${esc(l.phone)} back</a>`,
    }),
  };
}
