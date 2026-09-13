// Ad-hoc scenario runner for the plan model:
//   node scripts/plan-scenario.mjs 18 8        → 18 jobs/week for 8 weeks, solo and with a helper
import { blended, monthly, season } from "./plan-model.mjs";

const perWeek = Number(process.argv[2] ?? 18);
const weeks = Number(process.argv[3] ?? 8);
const usd = (n) => (n < 0 ? "-$" : "$") + Math.abs(Math.round(n)).toLocaleString("en-US");

for (const helper of [false, true]) {
  const b = blended(helper);
  console.log(helper ? "\nWITH A HELPER ON EVERY JOB" : "SOLO");
  console.log(`  per job: ticket ${usd(b.ticket)} · variable ${usd(b.variable)} (helper ${usd(b.helper)}) · keeps ${usd(b.contribution)} · ${b.hours} h`);
  for (const wk of [weeks - 2, weeks, weeks + 1]) {
    const s = season(perWeek, wk, helper);
    console.log(`  ${perWeek}/wk × ${wk} wks = ${s.jobs} jobs | revenue ${usd(s.revenue)} | fixed ${usd(s.fixed)} | pre-tax ${usd(s.pretax)} | after tax ${usd(s.net)} | owner hours ${s.hours} (${(s.hours / wk).toFixed(1)}/wk) | ${usd(s.netPerHour)}/h`);
  }
  const m = monthly(Math.round(perWeek * 4.33), helper);
  console.log(`  a full month at ${m.jobs} jobs: revenue ${usd(m.revenue)} · variable ${usd(m.variable)} · pre-tax ${usd(m.pretax)} · after tax ${usd(m.net)} · owner hours ${m.hours}`);
}
