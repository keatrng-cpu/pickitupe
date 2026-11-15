/**
 * Reference stills for Higgsfield, drawn from the site's own truck so every
 * render starts from the brand art instead of an AI's idea of a pickup:
 *   node scripts/make-higgsfield-refs.mjs
 *
 * Writes media/higgsfield/:
 *   hero-start-frame-16x9.png  1920×1080 — the frame for Kling 3.0, which only
 *                         renders 16:9 / 9:16 / 1:1. Its centre 1440×1080 is
 *                         pixel-for-pixel hero-start-frame.png, so
 *                         `ingest-clip.mjs --aspect 4:3` crops back to the hero.
 *                         Use it as BOTH start and end frame for the loop.
 *   hero-start-frame.png  1440×1080 (4:3) — the same composition, for models
 *                         that take 4:3 directly.
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

/**
 * The hero composition at any width ≥ 1440. Everything is sized in pixels from
 * the centre (gradient included), so a wider frame only adds green at the
 * sides and its centre 1440×1080 matches the 4:3 frame exactly.
 *
 * Colours are the page measured behind the hero stage (Nov 13, dev build):
 * centre #055b2e; just outside the stage #05562c–#06562d on desktop (the
 * hero's green glow sits there), #064e2a–#06532b at 375 px. The frame fades to
 * #065229, between the two, so the clip's edge melts into the page at both
 * widths. No dark vignette: it read as a dark box around the video.
 */
const heroFrame = (w) => {
  const dx = (w - 1440) / 2;
  return `<body style="margin:0;width:${w}px;height:1080px;overflow:hidden;
      background: radial-gradient(ellipse 1008px 648px at 50% 55%, #055b2e 0%, #05552c 70%, #065229 100%);">
      <svg width="${w}" height="1080" viewBox="0 0 ${w} 1080" xmlns="http://www.w3.org/2000/svg">
        <defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f4f6f2" stop-opacity="0.95"/><stop offset="1" stop-color="#f4f6f2" stop-opacity="0"/></radialGradient></defs>
        <ellipse cx="${720 + dx}" cy="800" rx="640" ry="120" fill="url(#g)"/>
        <g transform="translate(${160 + dx} 340) scale(3.5)">${truckArt({ glass: "#16362a" })}</g>
      </svg></body>`;
};

const frames = [
  { name: "hero-start-frame", w: 1440, h: 1080, html: heroFrame(1440) },
  { name: "hero-start-frame-16x9", w: 1920, h: 1080, html: heroFrame(1920) },
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
