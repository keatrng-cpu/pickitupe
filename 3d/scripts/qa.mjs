/**
 * Automated QA loop (agency-web-studio / playwright-qa.md).
 * Usage: start `npm run preview`, then `node scripts/qa.mjs [baseUrl]`.
 * Writes screenshots + qa-report.json to ./qa-shots.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://localhost:4331/';
const OUT = new URL('../qa-shots/', import.meta.url);
await mkdir(OUT, { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];
const STORY = [
  ['hero', 0], ['01-photo', 0.22], ['02-price', 0.42], ['03-day', 0.62], ['04-gone-mid', 0.86], ['04-gone-clean', 0.99],
];

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const report = {};

async function settle(page, ms = 1800) { await page.waitForTimeout(ms); }

for (const vp of VIEWPORTS) {
  for (const motion of ['no-preference', 'reduce']) {
    const key = `${vp.name}${motion === 'reduce' ? '-reduced' : ''}`;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: motion,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto(BASE, { waitUntil: 'load' });
    // Clean-load LCP, before any scrolling.
    const lcp = await page.evaluate(() => new Promise((res) => {
      new PerformanceObserver((l) => { const e = l.getEntries().at(-1); res({ ms: Math.round(e.startTime), el: e.element?.tagName + '.' + String(e.element?.className ?? '').split(' ')[0] }); })
        .observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => res(null), 3000);
    }));
    // Wait for the 3D studio to report ready (loader removed).
    await page.waitForFunction(() => ![...document.querySelectorAll('#stage div')].some((d) => d.textContent?.startsWith('Loading the basement')), null, { timeout: 60000 }).catch(() => {});
    await settle(page, 2500);

    const shots = [];
    if (motion === 'no-preference') {
      for (const [label, p] of STORY) {
        await page.evaluate(async (p) => {
          const st = document.getElementById('stage');
          const max = st.offsetHeight - innerHeight;
          for (let k = 0; k < 2; k++) { window.__lenis.scrollTo(st.offsetTop + p * max, { immediate: true, force: true }); await new Promise((r) => setTimeout(r, 900)); }
        }, p);
        await settle(page, 2200);
        const file = `${key}-${label}.png`;
        await page.screenshot({ path: fileURLToPath(new URL(file, OUT)) });
        shots.push(file);
      }
    } else {
      const file = `${key}-hero.png`;
      await page.screenshot({ path: fileURLToPath(new URL(file, OUT)) });
      shots.push(file);
    }

    // Scroll the whole page (fires reveals / lazy work), then probe.
    await page.evaluate(async () => {
      const H = document.documentElement.scrollHeight;
      for (let y = 0; y < H; y += innerHeight * 0.8) {
        if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 250));
      }
    });
    await settle(page, 1200);
    for (const [label, sel] of [['rates', '#rates'], ['estates', '#estates']]) {
      const file = `${key}-${label}.png`;
      await page.locator(sel).screenshot({ path: fileURLToPath(new URL(file, OUT)) });
      shots.push(file);
    }

    const probe = await page.evaluate(() => {
      const doc = document.documentElement;
      let cls = 0;
      for (const e of performance.getEntriesByType('layout-shift')) if (!e.hadRecentInput) cls += e.value;
      const offenders = [...document.querySelectorAll('body *')].filter((el) => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 5)
        .map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0]);
      const small = [...document.querySelectorAll('a,button,input,summary')].filter((el) => {
        const r = el.getBoundingClientRect(); return r.width > 0 && (r.height < 44 && r.width < 44);
      }).length;
      return {
        overflowPx: doc.scrollWidth - innerWidth,
        offenders,
        cls: +cls.toFixed(4),
        unsizedMedia: [...document.querySelectorAll('img,video,iframe')].filter((m) => !m.getAttribute('width') && getComputedStyle(m).aspectRatio === 'auto').length,
        stuckHidden: [...document.querySelectorAll('[data-reveal],[data-fade]')].filter((el) => getComputedStyle(el).opacity === '0').length,
        smallTapTargets: small,
        stepsVisibleInFlow: getComputedStyle(document.querySelector('.stage-step')).position !== 'absolute',
      };
    });
    report[key] = { lcp, ...probe, consoleErrors: errors, shots };
    await ctx.close();
  }
}

await browser.close();
await writeFile(new URL('qa-report.json', OUT), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
