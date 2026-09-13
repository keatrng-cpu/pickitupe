// Render the business plan to PDF:  node scripts/make-plan-pdf.mjs
//   in:  print/business-plan.html   (the plan; <!--MODEL:xyz--> markers are filled from scripts/plan-model.mjs)
//   out: print/business-plan.pdf    (US Letter, page numbers, the site's palette on paper)
// Uses the same Playwright Chromium as make-door-hanger-pdf.mjs.
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { tables, ASSUMPTIONS, MIX, TICKETS } from "./plan-model.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const printDir = resolve(here, "..", "print");
const src = resolve(printDir, "business-plan.html");
const t = tables();
const usd = (n) => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");
const pct = (n) => `${Math.round(n * 100)}%`;

function table(head, rows, opts = {}) {
  const th = head.map((h, i) => `<th${i && !opts.leftAll ? ' class="num"' : ""}>${h}</th>`).join("");
  const tr = rows.map((r) => `<tr>${r.map((c, i) => `<td${i && !opts.leftAll ? ' class="num"' : ""}>${c}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

const MODEL = {
  fixed: usd(t.fixed),
  fixedRows: table(["Monthly obligation", "Per month"], ASSUMPTIONS.fixedMonthly.map((f) => [f.label, usd(f.cents / 100)]).concat([["<b>Total the business must clear</b>", `<b>${usd(t.fixed)}</b>`]])),
  perService: table(
    ["Service", "Ticket*", "Dump", "Truck", "Card", "Bags", "Keeps", "Hours", "Keeps / hour"],
    t.perService.map((r) => [r.label, usd(r.ticket), usd(r.dump), usd(r.vehicle), usd(r.card), usd(r.consumables), `<b>${usd(r.contribution)}</b>`, r.hours, usd(r.perHour)]),
  ),
  blended: `${usd(t.solo.ticket)} ticket · ${usd(t.solo.variable)} variable cost · <b>${usd(t.solo.contribution)} kept per job</b> · ${t.solo.hours} h per job including drive and dump`,
  blendedHelper: `${usd(t.helper.ticket)} ticket · ${usd(t.helper.variable)} variable cost (incl. ${usd(t.helper.helper)} helper) · <b>${usd(t.helper.contribution)} kept</b> · ${t.helper.hours} h per job`,
  breakEven: String(t.breakEven),
  breakEvenHelper: String(t.breakEvenHelper),
  ladder: table(
    ["Jobs / month", "Revenue", "Variable", "Fixed nut", "Pre-tax profit", "Margin", "After 30% tax", "Hours", "After-tax $/h"],
    t.ladder.map((m) => [m.jobs, usd(m.revenue), usd(m.variable), usd(m.fixed), `<b>${usd(m.pretax)}</b>`, pct(m.marginPretax), usd(m.net), m.hours, usd(m.netPerHour)]),
  ),
  ladderHelper: table(
    ["Jobs / month", "Revenue", "Variable (incl. helper)", "Pre-tax profit", "After tax", "Your hours", "After-tax $/h"],
    t.ladderHelper.map((m) => [m.jobs, usd(m.revenue), usd(m.variable), `<b>${usd(m.pretax)}</b>`, usd(m.net), m.hours, usd(m.netPerHour)]),
  ),
  fall: table(
    ["Jobs / week", "Jobs (9 wks)", "Revenue", "Fixed (2.1 mo)", "Pre-tax", "After tax", "Hours", "After-tax $/h"],
    t.fall.map((s) => [s.jobsPerWeek, s.jobs, usd(s.revenue), usd(s.fixed), usd(s.pretax), `<b>${usd(s.net)}</b>`, s.hours, usd(s.netPerHour)]),
  ),
  fallHelper: table(
    ["Jobs / week", "Jobs (9 wks)", "Revenue", "Pre-tax", "After tax", "Your hours", "After-tax $/h"],
    t.fallHelper.map((s) => [s.jobsPerWeek, s.jobs, usd(s.revenue), usd(s.pretax), `<b>${usd(s.net)}</b>`, s.hours, usd(s.netPerHour)]),
  ),
  mix: table(["Job type", "Share of fall jobs"], Object.entries(MIX).map(([k, w]) => [TICKETS[k].label, pct(w)])),
  assumptions: `<ul>
    <li>Tickets are the midpoints of the pricebook ranges, less ${pct(ASSUMPTIONS.promoShare)} of jobs at the ${pct(ASSUMPTIONS.promoPct)}-off promo (cap $${ASSUMPTIONS.promoCap}) and ${pct(ASSUMPTIONS.blockShare)} of jobs with the $${ASSUMPTIONS.blockCredit} block credit.</li>
    <li>Truck cost = ${ASSUMPTIONS.milesPerJob} miles a job × the IRS ${Math.round(ASSUMPTIONS.vehicleCostPerMile * 100)}¢ rate — that rate is what a pickup mile really costs (fuel, tires, wear, depreciation), and it's also the deduction.</li>
    <li>Dump: landfill $${ASSUMPTIONS.dumpFee.landfill} a junk load (the $23 minimum plus weight), $${ASSUMPTIONS.dumpFee.compost} a leaf load at the yard-waste site, $${ASSUMPTIONS.dumpFee["landfill-shared"]} for gutter muck that rides with another load. Confirm the commercial yard-waste rate at 724 N 47th St on the first drop.</li>
    <li>Card fees: the $50 deposit is always by card; ${pct(ASSUMPTIONS.balanceByCardShare)} of balances are by card (Stripe ${ASSUMPTIONS.stripePct * 100}% + 30¢). Cash and check balances cost nothing.</li>
    <li>Helper: $${ASSUMPTIONS.helperWage}/h plus ${pct(ASSUMPTIONS.helperBurden)} payroll burden, paid for every hour of the job including the drive.</li>
    <li>Tax: ${pct(ASSUMPTIONS.taxRateOnNet)} of pre-tax profit — self-employment tax plus your federal and ND marginal rates on top of a $55k W-2, net of the half-SE and QBI deductions. The app's 25%-of-collected set-aside covers it.</li>
    <li>Fall season = ${ASSUMPTIONS.fallWeeks} weeks (mid-Sept to mid-Nov); spring = ${ASSUMPTIONS.springWeeks} weeks. Winter carries the nut with no revenue — that's why the fall number has to be big.</li>
  </ul>`,
};

let html = readFileSync(src, "utf8");
html = html.replace(/<!--MODEL:([a-zA-Z]+)-->/g, (_, k) => (k in MODEL ? MODEL[k] : `<span style="color:red">MISSING ${k}</span>`));
const built = resolve(printDir, ".business-plan.built.html");
writeFileSync(built, html);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(built).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
const out = resolve(printDir, "business-plan.pdf");
await page.pdf({
  path: out,
  format: "Letter",
  printBackground: true,
  margin: { top: "0.62in", bottom: "0.7in", left: "0.6in", right: "0.6in" },
  displayHeaderFooter: true,
  headerTemplate: `<div style="width:100%;font-size:8px;color:#7a5a4a;padding:0 0.6in;display:flex;justify-content:space-between;font-family:Georgia,serif"><span>Pick It Up E — Business Plan · Fall 2026 → Spring 2027</span><span>pickitupe.com</span></div>`,
  footerTemplate: `<div style="width:100%;font-size:8px;color:#7a5a4a;padding:0 0.6in;display:flex;justify-content:space-between;font-family:Georgia,serif"><span>Confidential — owner copy</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>`,
});
await browser.close();
console.log("wrote", out);

// Owner's OneDrive ops folder, if it exists on this machine.
const ops = "C:/Users/Luxef/OneDrive/Desktop/Pick It Up E - Ops";
if (existsSync(ops)) {
  mkdirSync(resolve(ops, "plan"), { recursive: true });
  copyFileSync(out, resolve(ops, "plan", "Pick It Up E - Business Plan 2026-27.pdf"));
  console.log("copied to", resolve(ops, "plan"));
}
