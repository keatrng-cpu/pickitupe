// Jobs → profit model for the business plan. Deterministic: every input is a
// named assumption below, sourced from src/lib/pricebook.ts, the Grand Forks
// 2026 sanitation rates, and the Books "monthly obligations" list.
//   node scripts/plan-model.mjs            → prints the tables
//   node scripts/plan-model.mjs --json     → JSON for the PDF builder
//
// Rule of the house: compute, don't estimate. Change an input here, never a
// number in the plan text.

export const TICKETS = {
  // midpoints of the pricebook ranges (LEAF_KSF city band on chip lots; LOAD_SIZES; GUTTER_SIZES)
  "leaf-small":    { label: "Leaf cleanup · small city lot (5,000 sf)",   low: 160, high: 230, hoursSolo: 2.0, hoursHelper: 1.25, drive: 0.75, drop: "compost" },
  "leaf-standard": { label: "Leaf cleanup · standard lot (7,500 sf)",     low: 240, high: 345, hoursSolo: 2.75, hoursHelper: 1.6, drive: 0.75, drop: "compost" },
  "leaf-large":    { label: "Leaf cleanup · large / corner (12,000 sf)",  low: 335, high: 490, hoursSolo: 4.0, hoursHelper: 2.3, drive: 0.9, drop: "compost" },
  "junk-single":   { label: "Junk · one piece or bags",                   low: 59,  high: 95,  hoursSolo: 0.6, hoursHelper: 0.4, drive: 0.9, drop: "landfill" },
  "junk-half":     { label: "Junk · half the bed",                        low: 125, high: 195, hoursSolo: 1.1, hoursHelper: 0.7, drive: 0.9, drop: "landfill" },
  "junk-full":     { label: "Junk · full bed",                            low: 175, high: 265, hoursSolo: 1.75, hoursHelper: 1.0, drive: 1.0, drop: "landfill" },
  "gutter":        { label: "Gutters · single-story, from the ground",    low: 135, high: 165, hoursSolo: 1.1, hoursHelper: 0.8, drive: 0.6, drop: "landfill-shared" },
  "bundle":        { label: "Leaf standard + gutters while we're here",   low: 320, high: 455, hoursSolo: 3.5, hoursHelper: 2.1, drive: 0.75, drop: "compost" },
};

/** Fall job mix — what a door-hanger neighborhood actually orders (assumption, n=0 until the first season's books exist). */
export const MIX = {
  "leaf-standard": 0.45,
  "leaf-small": 0.12,
  "leaf-large": 0.10,
  "bundle": 0.08,
  "gutter": 0.05,
  "junk-half": 0.10,
  "junk-full": 0.05,
  "junk-single": 0.05,
};

export const ASSUMPTIONS = {
  promoShare: 0.30,        // share of fall jobs booked under the 20%-off-up-to-$75 promo
  promoPct: 0.20,
  promoCap: 75,
  blockShare: 0.15,        // share of jobs that get the block deal ($25 each, never with promo)
  blockCredit: 25,
  milesPerJob: 12,         // home → job → drop → home in a 7-mile-wide town; chained legs are shorter
  vehicleCostPerMile: 0.76,// IRS rate = the full cost of the truck mile (fuel, wear, tires, depreciation); H2 2026
  dumpFee: { compost: 12, landfill: 28, "landfill-shared": 9 }, // GF landfill $23 min + weight; yard-waste site: assume a small commercial charge; shared = gutter muck rides with another load
  consumablesPerJob: 4,    // contractor bags, tarp wear, gloves, 2-cycle oil
  stripePct: 0.029, stripeFixed: 0.30,
  depositCents: 5000, balanceByCardShare: 0.60,
  helperWage: 18, helperBurden: 0.12, // FICA 7.65% + FUTA/SUTA/WSI ≈ 12% on top
  fixedMonthly: [
    { label: "Truck payment (personal, business must cover)", cents: 55000 },
    { label: "Extended warranty", cents: 22000 },
    { label: "Progressive auto ($450 / 6 mo)", cents: 7500 },
    { label: "Supabase Pro + Netlify + domain", cents: 4800 },
    { label: "General liability (NEXT quote, not bound)", cents: 8500 },
    { label: "Twilio line", cents: 500 },
    { label: "Phone share (business use of the cell)", cents: 3000 },
  ],
  taxRateOnNet: 0.30,      // SE 15.3%×92.35% + 22% federal marginal (on top of $55k W-2) + ND 2.5%, less ½-SE and QBI ≈ 30%
  fallWeeks: 9, springWeeks: 6,
};

const r2 = (n) => Math.round(n * 100) / 100;
const usd = (n) => (n < 0 ? "−$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

export function perJob(key, withHelper = false) {
  const t = TICKETS[key];
  const mid = (t.low + t.high) / 2;
  const promoDiscount = Math.min(t.high === 95 ? mid * ASSUMPTIONS.promoPct : mid * ASSUMPTIONS.promoPct, ASSUMPTIONS.promoCap);
  const ticket = mid - ASSUMPTIONS.promoShare * promoDiscount - ASSUMPTIONS.blockShare * ASSUMPTIONS.blockCredit;
  const dump = ASSUMPTIONS.dumpFee[t.drop];
  const vehicle = ASSUMPTIONS.milesPerJob * ASSUMPTIONS.vehicleCostPerMile;
  const card = ASSUMPTIONS.stripePct * 50 + ASSUMPTIONS.stripeFixed + ASSUMPTIONS.balanceByCardShare * (ASSUMPTIONS.stripePct * Math.max(0, ticket - 50) + ASSUMPTIONS.stripeFixed);
  const hoursOnSite = withHelper ? t.hoursHelper : t.hoursSolo;
  const hours = hoursOnSite + t.drive;
  const helper = withHelper ? hours * ASSUMPTIONS.helperWage * (1 + ASSUMPTIONS.helperBurden) : 0;
  const variable = dump + vehicle + ASSUMPTIONS.consumablesPerJob + card + helper;
  return { key, label: t.label, ticket: r2(ticket), dump, vehicle: r2(vehicle), card: r2(card), consumables: ASSUMPTIONS.consumablesPerJob, helper: r2(helper), variable: r2(variable), contribution: r2(ticket - variable), hours: r2(hours), perHour: r2((ticket - variable) / hours) };
}

export function blended(withHelper = false) {
  const rows = Object.entries(MIX).map(([k, w]) => ({ w, ...perJob(k, withHelper) }));
  const sum = (f) => r2(rows.reduce((s, r) => s + r.w * r[f], 0));
  return { ticket: sum("ticket"), variable: sum("variable"), contribution: sum("contribution"), hours: sum("hours"), dump: sum("dump"), vehicle: sum("vehicle"), card: sum("card"), helper: sum("helper") };
}

export function monthly(jobs, withHelper = false) {
  const b = blended(withHelper);
  const fixed = ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100;
  const revenue = jobs * b.ticket;
  const variable = jobs * b.variable;
  const gross = revenue - variable;
  const pretax = gross - fixed;
  const tax = Math.max(0, pretax) * ASSUMPTIONS.taxRateOnNet;
  const net = pretax - tax;
  const hours = jobs * b.hours;
  return { jobs, revenue: r2(revenue), variable: r2(variable), gross: r2(gross), fixed, pretax: r2(pretax), tax: r2(tax), net: r2(net), hours: r2(hours), netPerHour: hours ? r2(net / hours) : 0, marginPretax: revenue ? r2(pretax / revenue) : 0 };
}

export function breakEvenJobs(withHelper = false) {
  const b = blended(withHelper);
  const fixed = ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100;
  return Math.ceil(fixed / b.contribution);
}

export function season(jobsPerWeek, weeks, withHelper = false) {
  const jobs = jobsPerWeek * weeks;
  const months = weeks / 4.33;
  const b = blended(withHelper);
  const fixed = (ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100) * months;
  const revenue = jobs * b.ticket;
  const pretax = revenue - jobs * b.variable - fixed;
  const net = pretax - Math.max(0, pretax) * ASSUMPTIONS.taxRateOnNet;
  return { jobsPerWeek, weeks, jobs, revenue: r2(revenue), fixed: r2(fixed), pretax: r2(pretax), net: r2(net), hours: r2(jobs * b.hours), netPerHour: r2(net / (jobs * b.hours)) };
}

/**
 * A week-by-week ramp: jobs per week, helper from a given week (0-based),
 * fixed nut pro-rated per week. Returns per-week rows and the season total.
 */
export function ramp(weeklyJobs, helperFromWeek = 99, label = "") {
  const weekNut = (ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100) * 12 / 52;
  let rev = 0, varc = 0, hours = 0, helperHours = 0;
  const rows = weeklyJobs.map((jobs, i) => {
    const helper = i >= helperFromWeek;
    const b = blended(helper);
    rev += jobs * b.ticket; varc += jobs * b.variable; hours += jobs * b.hours;
    if (helper) helperHours += jobs * b.hours;
    return { week: i + 1, jobs, helper, revenue: r2(jobs * b.ticket), kept: r2(jobs * b.contribution), ownerHours: r2(jobs * b.hours) };
  });
  const fixed = weekNut * weeklyJobs.length;
  const pretax = rev - varc - fixed;
  const net = pretax - Math.max(0, pretax) * ASSUMPTIONS.taxRateOnNet;
  return { label, rows, jobs: weeklyJobs.reduce((a, b) => a + b, 0), revenue: r2(rev), variable: r2(varc), fixed: r2(fixed), pretax: r2(pretax), net: r2(net), ownerHours: r2(hours), helperHours: r2(helperHours), netPerHour: hours ? r2(net / hours) : 0 };
}

/** The owner's stated target vs the two honest cases from the feasibility review (weeks from Mon Sept 14). */
export const RAMPS = {
  target: { label: "Target as stated: 3 a day, 6 days, from week 1", jobs: [18, 18, 18, 18, 18, 18, 18, 18, 9], helperFrom: 2 },
  leave: { label: "Realistic — owner full-time from Oct 5, helper from Sept 28", jobs: [2, 4, 6, 11, 15, 17, 14, 10, 5], helperFrom: 2 },
  w2: { label: "Realistic — W-2 job kept (Saturdays, Sundays, two evenings)", jobs: [2, 4, 5, 7, 8, 8, 7, 5, 3], helperFrom: 99 },
};

/** Truck loan: $26k at 10% APR, $550/mo — what extra principal buys. Standard monthly amortization. */
export const LOAN = { principal: 26000, apr: 0.10, payment: 550, extras: [0, 100, 200, 400] };
export function loan(extra = 0, l = LOAN) {
  const r = l.apr / 12;
  let bal = l.principal, months = 0, interest = 0;
  while (bal > 0.005 && months < 1000) {
    const i = bal * r;
    const pay = Math.min(l.payment + extra, bal + i);
    interest += i; bal = bal + i - pay; months += 1;
  }
  return { extra, months, interest: r2(interest) };
}
export function loanTable(l = LOAN) {
  const base = loan(0, l);
  return l.extras.map((x) => { const o = loan(x, l); return { ...o, saved: r2(base.interest - o.interest), cut: base.months - o.months }; });
}

/** 2026 federal + ND figures (IRS Rev. Proc. 2025-32; ND 2025 schedule — 2026 thresholds unpublished, indexed up). Single filer. */
export const TAX_2026 = {
  stdDeduction: 16100,
  brackets: [[12400, 0.10], [50400, 0.12], [105700, 0.22], [201775, 0.24], [Infinity, 0.32]],
  seRate: 0.153, seBase: 0.9235, qbi: 0.20,
  ndZeroTo: 48475, ndRate: 0.0195,
};
function bracketTax(taxable) {
  let tax = 0, lo = 0;
  for (const [hi, rate] of TAX_2026.brackets) { if (taxable <= lo) break; tax += (Math.min(taxable, hi) - lo) * rate; lo = hi; }
  return tax;
}
/** How the streams stack on one 1040: W-2 + Schedule C net (all businesses netted) + short-term trading gains + net rent. */
export function stack({ w2 = 55000, c = 0, gains = 0, rent = 0 }) {
  const se = Math.max(0, c) * TAX_2026.seBase * TAX_2026.seRate;
  const half = se / 2;
  const agi = w2 + c + gains + rent - half;
  const qbi = Math.max(0, c - half) * TAX_2026.qbi; // rent has no QBI without the 250-hour safe harbor; gains never do
  const taxable = Math.max(0, agi - TAX_2026.stdDeduction - qbi);
  const fed = bracketTax(taxable);
  const nd = Math.max(0, taxable - TAX_2026.ndZeroTo) * TAX_2026.ndRate;
  return { se: r2(se), agi: r2(agi), qbi: r2(qbi), taxable: r2(taxable), fed: r2(fed), nd: r2(nd), total: r2(se + fed + nd) };
}
export const STACK_CASES = [
  { label: "W-2 only — the baseline", w2: 55000, c: 0, gains: 0, rent: 0 },
  { label: "+ Pick It Up E $7,500 net (W-2 kept, ≈50 jobs)", w2: 55000, c: 7500, gains: 0, rent: 0 },
  { label: "+ Pick It Up E $12,000 net (leave from Oct 5, ≈84 jobs)", w2: 55000, c: 12000, gains: 0, rent: 0 },
  { label: "+ LuxeForge −$2,000, trading +$10,000 realized", w2: 55000, c: 10000, gains: 10000, rent: 0 },
  { label: "+ trading at the $1,000/wk target for six months (+$26,000)", w2: 55000, c: 10000, gains: 26000, rent: 0 },
  { label: "+ a full year at target (+$52,000) and a rental netting $3,000", w2: 55000, c: 10000, gains: 52000, rent: 3000 },
];
export function stackTable() {
  const base = stack(STACK_CASES[0]);
  return STACK_CASES.map((k) => {
    const s = stack(k);
    const dC = stack({ ...k, c: k.c + 1000 }).total - s.total;      // tax on the next $1,000 of job profit
    const dG = stack({ ...k, gains: k.gains + 1000 }).total - s.total; // tax on the next $1,000 of trading gain
    return { ...k, ...s, over: r2(s.total - base.total), side: k.c + k.gains + k.rent, mC: Math.round(dC / 10), mG: Math.round(dG / 10) };
  });
}

/** Realistic cash calendar, Sept 2026 → May 2027 (80 fall jobs, 40 spring; collected includes deposits, 10 two-visit plans in Nov, 5 gift cards in Dec, spring deposits in March). All n=0. */
export const CASH_MONTHS = [
  { m: "Sep 26", jobs: 8, collected: 3470, variable: 449, oneTime: 988, note: "hangers, permit, GL, WSI, blower" },
  { m: "Oct 26", jobs: 46, collected: 11126, variable: 2580, oneTime: 0 },
  { m: "Nov 26", jobs: 26, collected: 7902, variable: 1458, oneTime: 0, note: "10 plans prepaid, $2,800" },
  { m: "Dec 26", jobs: 4, collected: 1780, variable: 224, oneTime: 0, note: "UND turns + 5 gift cards" },
  { m: "Jan 27", jobs: 0, collected: 0, variable: 0, oneTime: 0 },
  { m: "Feb 27", jobs: 0, collected: 0, variable: 0, oneTime: 0 },
  { m: "Mar 27", jobs: 0, collected: 1000, variable: 0, oneTime: 0, note: "20 spring deposits" },
  { m: "Apr 27", jobs: 12, collected: 2508, variable: 673, oneTime: 0 },
  { m: "May 27", jobs: 28, collected: 4852, variable: 1571, oneTime: 0 },
];
export const CASH_RULES = { reservePct: 0.25, escrowTarget: 5065, repairTarget: 1000 };
export function cashCalendar(reservePct = CASH_RULES.reservePct) {
  const nut = ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100;
  let escrow = 0, repair = 0, taxBal = 0;
  const rows = CASH_MONTHS.map((mo) => {
    const tax = mo.collected * reservePct; taxBal += tax;
    let avail = mo.collected - tax - mo.variable - nut - mo.oneTime;
    let escrowMove = 0, repairMove = 0, draw = 0;
    if (avail < 0) { escrowMove = avail; escrow += avail; avail = 0; }
    else {
      escrowMove = Math.min(avail, CASH_RULES.escrowTarget - escrow); escrow += escrowMove; avail -= escrowMove;
      repairMove = Math.min(avail, CASH_RULES.repairTarget - repair); repair += repairMove; avail -= repairMove;
      draw = avail;
    }
    return { ...mo, tax: r2(tax), nut, escrowMove: r2(escrowMove), escrow: r2(escrow), repair: r2(repair), draw: r2(draw), taxBal: r2(taxBal) };
  });
  const sum = (k) => r2(rows.reduce((s, x) => s + x[k], 0));
  return { rows, totals: { jobs: sum("jobs"), collected: sum("collected"), variable: sum("variable"), tax: sum("tax"), nut: sum("nut"), oneTime: sum("oneTime"), draw: sum("draw") }, minEscrow: Math.min(...rows.map((x) => x.escrow)) };
}

export function tables() {
  const fixed = ASSUMPTIONS.fixedMonthly.reduce((s, f) => s + f.cents, 0) / 100;
  const perService = Object.keys(TICKETS).map((k) => perJob(k, false));
  const perServiceHelper = Object.keys(TICKETS).map((k) => perJob(k, true));
  const solo = blended(false), helper = blended(true);
  const ladder = [4, 6, 8, 10, 15, 20, 30, 40].map((j) => monthly(j, false));
  const ladderHelper = [4, 6, 8, 10, 15, 20, 30, 40].map((j) => monthly(j, true));
  const fall = [2, 4, 6, 8, 10].map((w) => season(w, ASSUMPTIONS.fallWeeks, false));
  const fallHelper = [6, 8, 10, 14].map((w) => season(w, ASSUMPTIONS.fallWeeks, true));
  const ramps = Object.fromEntries(Object.entries(RAMPS).map(([k, r]) => [k, ramp(r.jobs, r.helperFrom, r.label)]));
  return { fixed, perService, perServiceHelper, solo, helper, breakEven: breakEvenJobs(false), breakEvenHelper: breakEvenJobs(true), ladder, ladderHelper, fall, fallHelper, ramps, loan: loanTable(), stack: stackTable(), cash: cashCalendar(), cash18: cashCalendar(0.18) };
}

if (process.argv[1]?.endsWith("plan-model.mjs")) {
  const t = tables();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(t, null, 2));
  } else {
    console.log(`Fixed monthly nut: ${usd(t.fixed)}   blended ticket ${usd(t.solo.ticket)}   variable ${usd(t.solo.variable)}   contribution ${usd(t.solo.contribution)}/job (${t.solo.hours} h)   break-even ${t.breakEven} jobs/mo solo, ${t.breakEvenHelper} with a helper\n`);
    console.log("PER SERVICE (solo)");
    for (const r of t.perService) console.log(`  ${r.label.padEnd(46)} ticket ${usd(r.ticket).padStart(5)}  var ${usd(r.variable).padStart(4)}  keeps ${usd(r.contribution).padStart(5)}  ${r.hours} h  ${usd(r.perHour)}/h`);
    console.log("\nJOBS PER MONTH (solo)");
    for (const m of t.ladder) console.log(`  ${String(m.jobs).padStart(3)} jobs  rev ${usd(m.revenue).padStart(7)}  pre-tax ${usd(m.pretax).padStart(7)}  after 30% tax ${usd(m.net).padStart(7)}  ${m.hours} h  ${usd(m.netPerHour)}/h`);
    console.log("\nJOBS PER MONTH (with helper)");
    for (const m of t.ladderHelper) console.log(`  ${String(m.jobs).padStart(3)} jobs  rev ${usd(m.revenue).padStart(7)}  pre-tax ${usd(m.pretax).padStart(7)}  after tax ${usd(m.net).padStart(7)}  ${m.hours} h  ${usd(m.netPerHour)}/h`);
    console.log("\nFALL SEASON (9 weeks, solo)");
    for (const s of t.fall) console.log(`  ${s.jobsPerWeek}/wk → ${s.jobs} jobs  rev ${usd(s.revenue).padStart(7)}  after tax ${usd(s.net).padStart(7)}  ${s.hours} h  ${usd(s.netPerHour)}/h`);
  }
}
