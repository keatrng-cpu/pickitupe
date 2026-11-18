/** Touch-driven functional test on a phone viewport. Usage: node scripts/mobile-test.mjs [url] */
import { chromium, devices } from 'playwright';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://localhost:4331/';
const shot = (n) => fileURLToPath(new URL(`../qa-shots/${n}.png`, import.meta.url));
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ ...devices['iPhone 13'] });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const results = [];
const check = (name, ok, detail = '') => results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForFunction(() => ![...document.querySelectorAll('#stage div')].some((d) => d.textContent?.startsWith('Loading the basement')), null, { timeout: 90000 }).catch(() => {});
await page.waitForTimeout(2500);
check('3D scene ready on mobile (SD tier)', await page.evaluate(() => !!document.querySelector('#stage canvas')));

// 1. Tap a size tick → price, name and booking link all update from the pricebook.
await page.tap('[data-tick="1"]');
await page.waitForTimeout(400);
const s1 = await page.evaluate(() => ({ price: document.querySelector('[data-size-price]')?.textContent, name: document.querySelector('[data-size-name]')?.textContent, href: document.querySelector('[data-size-book]')?.getAttribute('href'), size: globalThis.__haulStage?.size }));
check('tap "One piece" updates price', s1.price === '$59–$95', JSON.stringify(s1));
check('booking link carries size', s1.href?.endsWith('size=single') ?? false);
check('3D pile state follows slider', s1.size === 1);
await page.waitForTimeout(1500);
await page.screenshot({ path: shot('m-one-piece') });

// 2. Mobile menu opens as a modal, links scroll, closes.
await page.tap('[data-menu-open]');
await page.waitForTimeout(600);
check('menu opens', await page.evaluate(() => document.querySelector('#menu')?.open === true));
await page.screenshot({ path: shot('m-menu') });
await page.tap('#menu a[href="#rates"]');
await page.waitForFunction(() => Math.abs(document.getElementById('rates').getBoundingClientRect().top) < 120, null, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(1200);
const afterMenu = await page.evaluate(() => ({ open: document.querySelector('#menu')?.open, top: Math.round(document.getElementById('rates').getBoundingClientRect().top) }));
check('menu closes on link', afterMenu.open === false);
check('menu link scrolls to Pricing', Math.abs(afterMenu.top) < 120, `rates top=${afterMenu.top}px`);

// 3. Action bar visible past the hero.
const bar = await page.evaluate(() => { const b = document.querySelector('[data-actionbar]'); return { show: b?.dataset.show, y: Math.round(b.getBoundingClientRect().top), vh: innerHeight }; });
check('action bar shown below hero', bar.show === 'true' && bar.y < bar.vh, JSON.stringify(bar));
await page.screenshot({ path: shot('m-rates') });

// 4. "See it in 3D" from a rate card → back to stage with that size.
await page.tap('[data-see="5"]');
await page.waitForTimeout(2800);
const see = await page.evaluate(() => ({ y: Math.round(scrollY), size: globalThis.__haulStage?.size, price: document.querySelector('[data-size-price]')?.textContent }));
check('"See it in 3D" returns to stage', see.y < 40, `scrollY=${see.y}`);
check('"See it in 3D" sets Two trips', see.size === 5 && see.price === '$245–$365', JSON.stringify(see));
await page.waitForTimeout(1500);
await page.screenshot({ path: shot('m-two-trips') });

// 4b. "Loaded" truck section reads the same size, and Pause snow toggles.
await page.evaluate(() => window.__lenis.scrollTo(document.getElementById('truck').offsetTop, { immediate: true, force: true }));
await page.waitForTimeout(1500);
const truck = await page.evaluate(() => {
  const s = document.getElementById('truck');
  return { name: s.querySelector('[data-live-name]')?.textContent, price: s.querySelector('[data-live-price]')?.textContent, href: s.querySelector('[data-size-book]')?.getAttribute('href') };
});
check('truck bed shows the chosen size', truck.name === 'Two trips' && truck.price === '$245–$365' && truck.href?.endsWith('size=overflow'), JSON.stringify(truck));
await page.tap('[data-snow-toggle]');
const snow = await page.evaluate(() => ({ pressed: document.querySelector('[data-snow-toggle]').getAttribute('aria-pressed'), running: globalThis.__haulStage.snow, label: document.querySelector('[data-snow-label]').textContent }));
check('Pause snow stops the snowfall', snow.pressed === 'true' && snow.running === false && snow.label === 'Let it snow', JSON.stringify(snow));
await page.tap('[data-snow-toggle]');
await page.waitForFunction(() => document.querySelector('#truck canvas'), null, { timeout: 60000 }).catch(() => {});
check('truck 3D canvas mounts near viewport', await page.evaluate(() => !!document.querySelector('#truck canvas')));

// 5. Story stops on mobile, including the live counter at stop 04.
for (const [label, p] of [['m-stop1', 0.22], ['m-stop3', 0.62], ['m-stop4', 0.99]]) {
  await page.evaluate(async (p) => {
    const st = document.getElementById('stage');
    for (let k = 0; k < 2; k++) { window.__lenis.scrollTo(st.offsetTop + p * (st.offsetHeight - innerHeight), { immediate: true, force: true }); await new Promise((r) => setTimeout(r, 900)); }
  }, p);
  await page.waitForTimeout(3500);
  await page.screenshot({ path: shot(label) });
}
const counter = await page.evaluate(() => document.querySelector('[data-carried]')?.textContent + ' ' + document.querySelector('[data-carried-label]')?.textContent);
check('stop 04 counter reads the scene', /^\d+ \/ \d+/.test(counter), counter);
check('no horizontal overflow', await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));

console.log(results.join('\n'));
await browser.close();
