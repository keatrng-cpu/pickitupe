/**
 * Reference stills for Higgsfield, drawn from the site's own truck so every
 * render starts from the brand art instead of an AI's idea of a pickup:
 *   node scripts/make-higgsfield-refs.mjs
 *
 * Writes media/higgsfield/:
 *   hero-start-frame.png  1440×1080 (4:3) — the hero composition on the page
 *                         green. Use it as BOTH start and end frame for the loop.
 *   truck-sheet.png       2048×1024 — the truck alone on neutral grey, for a
 *                         Higgsfield Element ("vehicle appearance only").
 * Upload them through Higgsfield's own upload window — files attached in the
 * Claude chat are not passed to Higgsfield. See docs/HIGGSFIELD.md.
 */
import { mkdir } from "node:fs/promises";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "media", "higgsfield");
register("./ts-strip-loader.mjs", pathToFileURL(join(ROOT, "scripts") + "/"));
const { truckArt } = await import(pathToFileURL(join(ROOT, "src/lib/truck-art.ts")).href);

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,700&display=block" rel="stylesheet" />`;

const frames = [
  {
    name: "hero-start-frame",
    w: 1440,
    h: 1080,
    html: `<body style="margin:0;width:1440px;height:1080px;overflow:hidden;
      background: radial-gradient(ellipse 70% 60% at 50% 55%, #0a5c32 0%, #064e2a 60%, #04351c 100%);">
      <svg width="1440" height="1080" viewBox="0 0 1440 1080" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4f6f2" stop-opacity="0.95"/><stop offset="1" stop-color="#f4f6f2" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="720" cy="800" rx="640" ry="120" fill="url(#g)"/>
        <g transform="translate(160 340) scale(3.5)">${truckArt({ glass: "#16362a" })}</g>
      </svg></body>`,
  },
  {
    name: "truck-sheet",
    w: 2048,
    h: 1024,
    html: `<body style="margin:0;width:2048px;height:1024px;overflow:hidden;background:#8c8c88;">
      <svg width="2048" height="1024" viewBox="0 0 2048 1024" xmlns="http://www.w3.org/2000/svg">
        <g transform="translate(144 192) scale(5.5)">${truckArt({ glass: "#16362a", snow: false })}</g>
      </svg></body>`,
  },
];

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const f of frames) {
    const page = await browser.newPage({ viewport: { width: f.w, height: f.h } });
    await page.setContent(`<!doctype html><html><head>${FONTS}</head>${f.html}</html>`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT, `${f.name}.png`) });
    await page.close();
    console.log(`wrote media/higgsfield/${f.name}.png (${f.w}×${f.h})`);
  }
} finally {
  await browser.close();
}
