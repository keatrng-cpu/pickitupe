import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })).newPage();
await p.goto(process.argv[2] ?? 'http://localhost:4321/');
await p.waitForTimeout(1500);
console.log(await p.evaluate(() => [...document.querySelectorAll('a,button,input,summary')].map((el) => {
  const target = el.closest('label') ?? el; const r = target.getBoundingClientRect();
  return { el: el.tagName + (el.type ? ':' + el.type : '') + ' ' + (el.textContent || el.name || '').trim().slice(0, 28), h: Math.round(r.height), w: Math.round(r.width), visible: r.width > 0 };
}).filter((x) => x.visible && x.h < 44 && x.w < 300)));
await b.close();
