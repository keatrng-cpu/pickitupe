/**
 * Winter print set, built from the site's own numbers:
 *   node scripts/make-winter-print.mjs
 *
 * Writes print/winter/:
 *   card.html, card-front.png, card-back.png, card.pdf          (business card, ?s=bcg)
 *   hanger-canvass.html, -front.png, -back.png, .pdf           (cold canvass, ?s=dhc)
 *   hanger-neighbor.html, -front.png, -back.png, .pdf          (after a job, ?s=dhn)
 *
 * Every price comes from src/lib/pricebook.ts, the truck from
 * src/lib/truck-art.ts and the phone from NEW_LINE_DIGITS in
 * src/lib/site-phone.ts — so print can't disagree with the site.
 *
 * PHONE: 701-213-3969 is being retired (owner, Nov 13). Until NEW_LINE_DIGITS
 * holds the Twilio number, every piece shows "NEW NUMBER" and is stamped
 * PROOF so nobody uploads it. Set the number, rerun, then order.
 *
 * Readability (owner: "easy to read for older folks"): nothing on the card
 * under 7.5 pt, nothing on the hanger under 8 pt, phone and prices largest,
 * sentence case over tiny tracked caps, and no snow texture behind text.
 *
 * Sizes are VistaPrint's (print/DOOR-HANGER.md has the hanger lessons):
 *   card   — 3.61 × 2.11 in full bleed, 3.5 × 2 trim, 3.36 × 1.86 safe
 *   hanger — 4.72 × 11.22 in full bleed ("4.5 × 11"), knob hole Ø1.1 in at
 *            (2.36, 1.42); nothing but the mahogany field above y = 2.25 in.
 *            Rendered 0.04 in taller so fit-to-width never leaves a hairline.
 * Upload the PNGs (300 dpi), not the PDF — VistaPrint rejects Chromium PDFs
 * for un-embedded fonts. The PDFs are proofs.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import QRCode from "qrcode";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "print", "winter");
register("./ts-strip-loader.mjs", pathToFileURL(join(ROOT, "scripts") + "/"));
const load = (rel) => import(pathToFileURL(join(ROOT, rel)).href);

const pb = await load("src/lib/pricebook.ts");
const { NEW_LINE_DIGITS, formatPhone } = await load("src/lib/site-phone.ts");
const { truckArt } = await load("src/lib/truck-art.ts");
const egf = await readFile(join(ROOT, "src/routes/east-grand-forks.tsx"), "utf8");
const MN_TAX = egf.match(/const MN_SWM_TAX = "([\d.]+%)"/)?.[1];
if (!MN_TAX) throw new Error("MN_SWM_TAX not found in east-grand-forks.tsx");

const READY = typeof NEW_LINE_DIGITS === "string" && /^\d{10}$/.test(NEW_LINE_DIGITS);
const PHONE = READY ? formatPhone(NEW_LINE_DIGITS) : "NEW NUMBER";
const SITE = "https://pickitupe.com";
const SITE_SHORT = "pickitupe.com";

// ---------------------------------------------------------------- numbers --
const money = (n) => `$${n.toLocaleString("en-US")}`;
const range = (r) => `${money(r.low)}–${money(r.high)}`;
const junk = Object.fromEntries(pb.listedSizesFor("junk-removal").map((s) => [s.value, s]));
for (const k of ["single", "quarter", "half", "full", "overflow", "bags"]) {
  if (!junk[k]) throw new Error(`pricebook has no junk size "${k}"`);
}
if (junk.bags.range.low !== junk.single.range.low || junk.bags.range.high !== junk.single.range.high) {
  throw new Error("Bags and One piece no longer share a price; split the print row");
}
const addOn = (key) => {
  const a = pb.ADD_ONS.find((x) => x.key === key && x.appliesTo.includes("junk-removal"));
  if (!a) throw new Error(`junk add-on "${key}" missing from pricebook`);
  return a;
};
const STAIRS = addOn("stairs");
const FRIDGE = addOn("appliance-freon");
const CLEANOUT = addOn("cleanout");
const [BLOCK2, BLOCK3] = pb.BLOCK_TIERS;
const ESTATE_LOW = pb.ESTATE_TIERS[0].range.low;
const ESTATE_HIGH = pb.ESTATE_TIERS.at(-1).range.high;
const REFUSED = `${pb.REFUSED.slice(0, -1).join(", ")} or ${pb.REFUSED.at(-1)}`;
const DEPOSIT = money(pb.DEPOSIT);
const PRICED_ON = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

/** Price ladder: label, range, how full the bed is (0–1), trips. */
const ROWS = [
  { label: "Bags or one piece", r: junk.single.range, fill: 0.12 },
  { label: junk.quarter.label, r: junk.quarter.range, fill: 0.25 },
  { label: junk.half.label, r: junk.half.range, fill: 0.5 },
  { label: junk.full.label, r: junk.full.range, fill: 1 },
  { label: junk.overflow.label, r: junk.overflow.range, fill: 1, trips: 2 },
];

// --------------------------------------------------------------- palette --
const C = {
  mahogany: "#3c1e14",
  deep: "#2f1610",
  paper: "#f3ead6",
  cream: "#ede3d0",
  gold: "#d4c4a0",
  rust: "#8f3f22",
};

// ------------------------------------------------------------------- art --
/** The brand truck (truck-art.ts) on a soft snow drift, for a mahogany field. */
function truck(width) {
  return `<svg viewBox="0 0 320 168" width="${width}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M0 152 C44 141 110 149 160 145 C214 141 274 143 320 152 C248 160 74 161 0 152 Z" fill="${C.paper}" opacity="0.92"/>
  ${truckArt({ glass: C.deep, snow: true, shadow: true })}
</svg>`;
}

/** Small cutaway bed, cab end on the right, filled to `fill` — the site's gauge in ink. */
function bedIcon(fill, trips) {
  const w = 44;
  const x0 = 2;
  return `<svg viewBox="0 0 66 22" width="0.66in" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="${x0}" y="6" width="${w}" height="11" rx="1.5" fill="none" stroke="${C.mahogany}" stroke-width="1.4"/>
  <rect x="${x0 + w - w * fill}" y="6" width="${w * fill}" height="11" rx="1.5" fill="${C.mahogany}"/>
  <path d="M${x0 + w} 17 V8 q0-3 3-3 h6 q2 0 3 2 l3 6 v4 z" fill="${C.mahogany}"/>
  <circle cx="12" cy="18.5" r="3" fill="${C.paper}" stroke="${C.mahogany}" stroke-width="1.4"/>
  <circle cx="52" cy="18.5" r="3" fill="${C.paper}" stroke="${C.mahogany}" stroke-width="1.4"/>
  ${trips ? `<text x="64" y="7" text-anchor="end" font-family="Outfit, sans-serif" font-weight="700" font-size="8.5" fill="${C.rust}">×${trips}</text>` : ""}
</svg>`;
}

/** Seeded snowfall inside one band (in inches from the top) — never behind text. */
function snowBand(widthIn, topIn, bottomIn, count, seed) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const h = bottomIn - topIn;
  const dots = Array.from({ length: count }, () => {
    const x = (rnd() * widthIn * 100).toFixed(1);
    const y = (rnd() * h * 100).toFixed(1);
    return `<circle cx="${x}" cy="${y}" r="${(0.7 + rnd() * 1.6).toFixed(2)}" fill="${C.paper}" opacity="${(0.18 + rnd() * 0.3).toFixed(2)}"/>`;
  });
  return `<svg class="snow" style="top:${topIn}in;height:${h}in" viewBox="0 0 ${widthIn * 100} ${h * 100}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${dots.join("")}</svg>`;
}

async function qr(tag) {
  const url = `${SITE}/?s=${tag}`;
  const svg = await QRCode.toString(url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4,
    color: { dark: C.mahogany, light: C.paper },
  });
  return { url, svg: svg.replace("<svg ", '<svg class="qr-svg" ') };
}

const phoneHtml = READY ? PHONE : `<span class="tbd">${PHONE}</span>`;
const proofStamp = READY ? "" : `<div class="proof">PROOF · phone number not set · do not print</div>`;

// ------------------------------------------------------------------- css --
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@400;500;600;700&display=block" rel="stylesheet" />`;

const BASE_CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #777; }
:root { --display: "Playfair Display", Georgia, serif; --sans: "Outfit", "Segoe UI", sans-serif; }
.page { position: relative; overflow: hidden; font-family: var(--sans); font-weight: 500; page-break-after: always;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page:last-child { page-break-after: auto; }
.mahogany { background: ${C.mahogany}; color: ${C.paper}; }
.paper { background: ${C.paper}; color: ${C.mahogany}; }
.snow { position: absolute; left: 0; width: 100%; pointer-events: none; }
.display { font-family: var(--display); font-weight: 900; line-height: 1; letter-spacing: -0.005em; }
.label { font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.qr-svg { display: block; width: 100%; height: 100%; }
.tab { font-variant-numeric: tabular-nums lining-nums; }
.tbd { display: inline-block; border: 1.5pt dashed currentColor; padding: 0 0.08in; border-radius: 0.05in; letter-spacing: 0.04em; }
.proof { position: absolute; left: 0; right: 0; top: 0; text-align: center; background: #c81e1e; color: #fff;
  font: 700 7pt/1.7 var(--sans); letter-spacing: 0.06em; z-index: 9; }
.page.hanger .proof { top: 0.45in; font-size: 12pt; line-height: 2.2; }
`;

// ------------------------------------------------------------------ card --
async function card() {
  const code = await qr("bcg");
  const W = "3.61in";
  const H = "2.11in";
  const rows = [
    ["One piece", junk.single.range],
    [junk.half.label, junk.half.range],
    [junk.full.label, junk.full.range],
    ["Fridge or freezer", FRIDGE.range, "+"],
  ];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>Pick It Up E — business card (VistaPrint 3.5×2, full bleed 3.61×2.11)</title>
<!-- Built by scripts/make-winter-print.mjs from pricebook.ts, truck-art.ts, site-phone.ts. Do not hand-edit. -->
${FONTS}
<style>${BASE_CSS}
@page { size: ${W} ${H}; margin: 0; }
.page { width: ${W}; height: ${H}; }
.safe { position: absolute; inset: 0.125in; }
/* Frame 0.19in in from the bleed edge (~0.135in inside trim) so cutter drift
   can't make one side visibly thinner. */
.frame { position: absolute; inset: 0.19in; border: 0.7pt solid ${C.gold}; border-radius: 0.04in; }
/* Front content lives inside the frame, so the overflow check guards the frame too. */
.front .safe { inset: 0.25in; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.front .name { font-size: 19pt; letter-spacing: 0.04em; margin-top: 0.01in; }
.front .tag { font-family: var(--display); font-style: italic; font-weight: 700; font-size: 9.5pt; color: ${C.gold}; margin-top: 0.02in; }
.front .svc { font-size: 8pt; color: ${C.cream}; margin-top: 0.03in; }
.front .phone { font-family: var(--display); font-weight: 900; font-size: 13pt; margin-top: 0.04in; letter-spacing: 0.01em; }
.front .phone .tbd { font-size: 10pt; padding: 0 0.06in; }
.front .url { font-size: 8.5pt; color: ${C.gold}; margin-top: 0.01in; }
.back .safe { display: grid; grid-template-columns: 1fr 0.98in; column-gap: 0.13in; grid-template-rows: auto 1fr auto; padding: 0.02in 0.02in 0; }
.back h2 { grid-column: 1; font-size: 12.5pt; line-height: 1.02; }
.back table { grid-column: 1; align-self: center; width: 100%; border-collapse: collapse; font-size: 9pt; }
.back td { padding: 0.025in 0; border-bottom: 0.5pt solid ${C.gold}; }
.back td + td { text-align: right; font-weight: 700; white-space: nowrap; }
.back .qr { grid-column: 2; grid-row: 1 / 3; align-self: start; }
.back .qr .box { width: 0.98in; height: 0.98in; }
.back .qr p { font-size: 7.5pt; text-align: center; margin-top: 0.02in; font-weight: 700; line-height: 1.15; }
.back .foot { grid-column: 1 / 3; font-size: 7.6pt; line-height: 1.3; margin-top: 0.05in; }
.back .foot b { font-weight: 700; }
</style></head><body>
<section class="page mahogany front">
  <div class="frame"></div>
  <div class="safe">
    ${truck("1.02in")}
    <p class="display name">PICK IT UP E</p>
    <p class="tag">We haul it. You don’t.</p>
    <p class="svc">Junk · Appliances · Cleanouts</p>
    <p class="phone tab">${phoneHtml}</p>
    <p class="url">${SITE_SHORT}</p>
  </div>
  ${proofStamp}
</section>
<section class="page paper back">
  <div class="safe">
    <h2 class="display">Out of the house.<br />Not on the curb.</h2>
    <table class="tab">${rows.map(([l, r, plus]) => `<tr><td>${l}</td><td>${plus ?? ""}${range(r)}</td></tr>`).join("")}</table>
    <div class="qr"><div class="box">${code.svg}</div><p>Scan for<br />your price</p></div>
    <p class="foot"><b>Text a photo for a price.</b> ${DEPOSIT} holds the day and comes off the bill.</p>
  </div>
  ${proofStamp}
</section>
</body></html>`;
  return { name: "card", html, w: W, h: H, qr: code.url };
}

// ---------------------------------------------------------------- hanger --
async function hanger(variant) {
  const tag = variant === "neighbor" ? "dhn" : "dhc";
  const code = await qr(tag);
  const W = "4.72in";
  const H = "11.26in"; // 11.22 artboard + 0.04 (see header)
  const front =
    variant === "neighbor"
      ? {
          kicker: "We were on your street today",
          head: "Your neighbor’s junk is gone. Yours can be next.",
          sub: "Same street, same day costs you less.",
          ticketKicker: "Neighbor deal",
          ticketHead: `${money(BLOCK2.credit)} off each house`,
          ticketBody: `when ${BLOCK2.households} houses on this street book the same day. ${BLOCK3.households}&nbsp;or more houses: ${money(BLOCK3.credit)} off each.`,
          ticketFine: `On jobs of ${money(pb.BLOCK_MIN_JOB_LOW)} and up. One offer per job.`,
          leftBy: true,
          truckW: "3.3in",
        }
      : {
          kicker: "Winter in Grand Forks",
          head: "Get the garage back before January.",
          sub: "Old couch, dead fridge, a basement you stopped going into. We carry it out. You point.",
          ticketKicker: "December cleanouts",
          ticketHead: "Free bag of ice melt",
          ticketBody: "with any garage or basement cleanout.",
          ticketFine: "Booked and done by December 31, 2026. One bag per address.",
          leftBy: false,
          truckW: "3.95in",
        };
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8" />
<title>Pick It Up E — ${variant} door hanger (VistaPrint 4.5×11, full bleed 4.72×11.22)</title>
<!-- Built by scripts/make-winter-print.mjs from pricebook.ts, truck-art.ts, site-phone.ts. Do not hand-edit.
     Knob hole Ø1.1in at (2.36in, 1.42in). Nothing above y = 2.25in but the mahogany field. -->
${FONTS}
<style>${BASE_CSS}
@page { size: ${W} ${H}; margin: 0; }
.page { width: ${W}; height: ${H}; }
.content { position: absolute; left: 0.34in; right: 0.34in; top: 2.3in; bottom: 0.36in; display: flex; flex-direction: column; }
.center { align-items: center; text-align: center; }
/* front */
.front .kicker { font-size: 9.5pt; color: ${C.gold}; }
.front .name { font-size: 34pt; letter-spacing: 0.035em; margin-top: 0.07in; }
.front .tag { font-family: var(--display); font-style: italic; font-weight: 700; font-size: 13pt; color: ${C.gold}; margin-top: 0.05in; }
.front .truck { margin-top: auto; }
.front h2 { font-size: 29pt; line-height: 1.04; margin-top: auto; max-width: 3.9in; }
.front .sub { font-size: 12.5pt; line-height: 1.4; margin-top: 0.12in; max-width: 3.8in; color: ${C.cream}; }
.ticket { position: relative; width: 100%; margin-top: auto; background: ${C.paper}; color: ${C.mahogany};
  border-radius: 0.09in; padding: 0.15in 0.2in 0.14in; text-align: center;
  -webkit-mask: radial-gradient(circle 0.07in at 0 50%, transparent 98%, #000) left / 51% 100% no-repeat,
                radial-gradient(circle 0.07in at 100% 50%, transparent 98%, #000) right / 51% 100% no-repeat; }
.ticket::before { content: ""; position: absolute; inset: 0.06in; border: 0.8pt dashed ${C.rust}; border-radius: 0.06in; opacity: 0.5; }
.ticket .label { font-size: 9pt; color: ${C.rust}; }
.ticket .head { font-size: 24pt; margin-top: 0.05in; }
.ticket .body { font-size: 11.5pt; line-height: 1.35; margin-top: 0.05in; }
.ticket .fine { font-size: 8.5pt; margin-top: 0.06in; }
.leftby { display: flex; gap: 0.2in; width: 100%; margin-top: 0.16in; font-size: 9pt; color: ${C.gold}; font-weight: 600; }
.leftby span { flex: 1; border-bottom: 0.8pt solid ${C.gold}; padding-bottom: 0.03in; text-align: left; }
.contact { margin-top: auto; padding-top: 0.2in; display: grid; grid-template-columns: 1fr 1.28in; column-gap: 0.16in; align-items: end; width: 100%; text-align: left; }
.contact .lead { font-size: 11pt; font-weight: 600; color: ${C.gold}; }
.contact .phone { font-family: var(--display); font-weight: 900; font-size: 28pt; line-height: 1; margin-top: 0.06in; letter-spacing: 0.01em; }
.contact .url { font-size: 13pt; font-weight: 600; margin-top: 0.06in; }
.contact .dep { font-size: 9.5pt; color: ${C.cream}; margin-top: 0.05in; }
.qrpanel { background: ${C.paper}; border-radius: 0.06in; padding: 0.04in; }
.qrpanel .box { width: 1.2in; height: 1.2in; }
.qrpanel p { color: ${C.mahogany}; font-size: 8.5pt; font-weight: 700; text-align: center; padding: 0.01in 0 0.03in; }
.towns { margin-top: 0.16in; font-size: 9pt; color: ${C.gold}; text-align: center; width: 100%; font-weight: 600; }
/* back */
.back .band { position: absolute; left: 0; right: 0; top: 0; height: 2.25in; background: ${C.mahogany}; }
.back h2 { font-size: 26pt; }
.back .lede { font-size: 11pt; line-height: 1.35; margin-top: 0.06in; }
.prices { width: 100%; border-collapse: collapse; margin-top: 0.1in; }
.prices td { padding: 0.06in 0; border-bottom: 0.6pt solid ${C.gold}; font-size: 12.5pt; vertical-align: middle; }
.prices td.icon { width: 0.76in; }
.prices td.amt { text-align: right; font-weight: 700; white-space: nowrap; }
.section-label { font-size: 9pt; color: ${C.rust}; margin-top: auto; padding-top: 0.14in; }
.addons { width: 100%; border-collapse: collapse; margin-top: 0.04in; }
.addons td { padding: 0.03in 0; font-size: 11pt; }
.addons td + td { text-align: right; font-weight: 700; white-space: nowrap; }
.steps { list-style: none; margin-top: 0.05in; display: grid; gap: 0.06in; }
.steps li { display: grid; grid-template-columns: 0.3in 1fr; align-items: start; font-size: 11pt; line-height: 1.3; }
.steps b { display: inline-grid; place-items: center; width: 0.22in; height: 0.22in; border-radius: 50%; background: ${C.mahogany}; color: ${C.paper}; font-size: 9pt; }
.estate { margin-top: auto; border: 1pt solid ${C.mahogany}; border-radius: 0.08in; padding: 0.11in 0.16in; text-align: center; font-size: 11pt; line-height: 1.38; }
.estate .display { font-size: 16pt; margin-bottom: 0.04in; }
.curb { margin-top: 0.15in; background: ${C.mahogany}; color: ${C.paper}; border-radius: 0.08in; padding: 0.12in 0.16in; text-align: center; }
.curb p:first-child { font-size: 11pt; color: ${C.gold}; }
.curb .display { font-size: 17pt; margin-top: 0.04in; }
.back .fine { margin-top: 0.16in; font-size: 8pt; line-height: 1.38; }
</style></head><body>
<section class="page hanger mahogany front">
  ${snowBand(4.72, 3.2, 5.2, 70, variant === "neighbor" ? 23 : 5)}
  <div class="content center">
    <p class="label kicker">${front.kicker}</p>
    <p class="display name">PICK IT UP E</p>
    <p class="tag">We haul it. You don’t.</p>
    <div class="truck">${truck(front.truckW)}</div>
    <h2 class="display">${front.head}</h2>
    <p class="sub">${front.sub}</p>
    <div class="ticket">
      <p class="label">${front.ticketKicker}</p>
      <p class="display head">${front.ticketHead}</p>
      <p class="body">${front.ticketBody}</p>
      <p class="fine">${front.ticketFine}</p>
    </div>
    ${front.leftBy ? `<div class="leftby"><span>Street</span><span>Date</span></div>` : ""}
    <div class="contact">
      <div>
        <p class="lead">Text a photo, get a price</p>
        <p class="phone tab">${phoneHtml}</p>
        <p class="url">${SITE_SHORT}</p>
        <p class="dep">${DEPOSIT} on a card holds the day.</p>
      </div>
      <div class="qrpanel"><div class="box">${code.svg}</div><p>Scan for a price</p></div>
    </div>
    <p class="towns">Grand Forks · East Grand Forks · Thompson · Manvel</p>
  </div>
  ${proofStamp}
</section>
<section class="page hanger paper back">
  <div class="band"></div>
  <div class="content">
    <h2 class="display">Priced by the truck bed.</h2>
    <p class="lede">We carry it out of your house and haul it away. The bar shows how much of the truck it fills.</p>
    <table class="prices tab">${ROWS.map(
      (r) => `<tr><td class="icon">${bedIcon(r.fill, r.trips)}</td><td>${r.label}</td><td class="amt">${range(r.r)}</td></tr>`,
    ).join("")}</table>
    <p class="label section-label">Add-ons</p>
    <table class="addons tab">${[STAIRS, FRIDGE, CLEANOUT]
      .map((a) => `<tr><td>${a.label}</td><td>+${range(a.range)}</td></tr>`)
      .join("")}</table>
    <p class="label section-label">How it works</p>
    <ol class="steps"><li><b>1</b><span>Text a photo, or get a price at ${SITE_SHORT}.</span></li><li><b>2</b><span>Pick a day. ${DEPOSIT} on a card holds it and comes off the bill.</span></li><li><b>3</b><span>We carry it out. You don’t lift a thing.</span></li></ol>
    <div class="estate"><p class="display">Clearing a whole house?</p><p>Free walkthrough, then one written price. Most run ${money(ESTATE_LOW)}–${money(ESTATE_HIGH)}. Text photos to <b class="tab">${phoneHtml}</b>.</p></div>
    <div class="curb"><p>The city truck takes it from the curb.</p><p class="display">We take it from the basement.</p></div>
    <p class="fine">We don’t take ${REFUSED}. East Grand Forks jobs add Minnesota’s ${MN_TAX} solid waste tax. Prices from ${SITE_SHORT}, ${PRICED_ON}. The price on the site is the one that counts.</p>
  </div>
  ${proofStamp}
</section>
</body></html>`;
  return { name: `hanger-${variant}`, html, w: W, h: H, qr: code.url };
}

// ---------------------------------------------------------------- render --
await mkdir(OUT, { recursive: true });
const jobs = [await card(), await hanger("canvass"), await hanger("neighbor")];
const browser = await chromium.launch();
try {
  for (const job of jobs) {
    const htmlPath = join(OUT, `${job.name}.html`);
    await writeFile(htmlPath, job.html, "utf8");
    const page = await browser.newPage({ deviceScaleFactor: 300 / 96 });
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    // Faces only download when something uses them, so ask for each one first.
    const missing = await page.evaluate(async () => {
      const faces = ["900 20px 'Playfair Display'", "italic 700 20px 'Playfair Display'", "500 12px Outfit", "700 12px Outfit"];
      await Promise.all(faces.map((f) => document.fonts.load(f)));
      return faces.filter((f) => !document.fonts.check(f));
    });
    if (missing.length) throw new Error(`fonts not loaded: ${missing.join(", ")} (offline?)`);
    // Anything spilling past its box is a layout bug at print size.
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll(".content, .safe")]
        .filter((el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1)
        .map((el) => el.closest("section")?.className),
    );
    if (overflow.length) throw new Error(`${job.name}: content overflows its safe area (${overflow.join("; ")})`);
    await page.pdf({ path: join(OUT, `${job.name}.pdf`), width: job.w, height: job.h, printBackground: true, preferCSSPageSize: true });
    const sides = await page.$$("section.page");
    for (const [i, side] of sides.entries()) {
      // One side at a time on its own colour, so no neighbour sliver bleeds into the edge.
      await page.evaluate((keep) => {
        const all = [...document.querySelectorAll("section.page")];
        all.forEach((el, j) => (el.style.display = j === keep ? "" : "none"));
        document.body.style.background = getComputedStyle(all[keep]).backgroundColor;
      }, i);
      await side.screenshot({ path: join(OUT, `${job.name}-${i === 0 ? "front" : "back"}.png`) });
    }
    await page.close();
    console.log(`${job.name.padEnd(16)} QR ${job.qr}`);
  }
} finally {
  await browser.close();
}
console.log(
  READY
    ? `PRINT-READY · phone ${PHONE} · prices from pricebook.ts · wrote print/winter/`
    : "PROOFS ONLY · NEW_LINE_DIGITS is not set in src/lib/site-phone.ts, so every piece says NEW NUMBER and is stamped PROOF. Set it, rerun, then order.",
);
