/** Screenshots the "Loaded" truck section at desktop + phone, cycling bed sizes. Usage: node scripts/truck-shot.mjs [url] */
import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://localhost:4331/';
const shot = (n) => fileURLToPath(new URL(`../qa-shots/${n}.png`, import.meta.url));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
for (const [label, opts] of [['d', { viewport: { width: 1440, height: 900 } }], ['m', devices['iPhone 13']]]) {
  const page = await (await browser.newContext(opts)).newPage();
  page.on('pageerror', (e) => errors.push(`${label}: ${e}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${label}: ${m.text()}`); });
  await page.goto(BASE, { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => { const t = document.getElementById('truck'); window.__lenis?.scrollTo(t.offsetTop, { immediate: true, force: true }); });
  await page.waitForFunction(() => document.querySelector('#truck canvas'), null, { timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(9000);
  await page.screenshot({ path: shot(`${label}-truck-full`), timeout: 120000 });
  await page.evaluate(() => { globalThis.__haulStage.size = 0; document.querySelectorAll('[data-live-name]').forEach((e) => { e.textContent = 'Bags'; }); });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: shot(`${label}-truck-bags`) });
  await page.evaluate(() => { globalThis.__haulStage.size = 5; });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: shot(`${label}-truck-overflow`) });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  console.log(label, 'no overflow:', ov);
}
console.log('errors:', errors.length ? errors.slice(0, 5).join('\n') : 'none');
await browser.close();
