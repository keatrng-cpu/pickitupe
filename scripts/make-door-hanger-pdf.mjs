// Build the print-ready door hanger PDF + PNG proofs from print/door-hanger.html.
//   node scripts/make-door-hanger-pdf.mjs
// Output: print/door-hanger-vistaprint.pdf (2 pages, 4.72in x 11.22in full bleed),
//         print/door-hanger-front.png, print/door-hanger-back.png (proofs, 300 dpi-ish).
// The QR is inlined from print/qr-pickitupe.svg so it stays vector.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const here = dirname(fileURLToPath(import.meta.url));
const printDir = resolve(here, "..", "print");
const src = resolve(printDir, "door-hanger.html");
const qr = readFileSync(resolve(printDir, "qr-pickitupe.svg"), "utf8");
const html = readFileSync(src, "utf8").replace("__QR_SVG__", qr);
const built = resolve(printDir, ".door-hanger.built.html");
writeFileSync(built, html);

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 3.125 });
await page.goto(pathToFileURL(built).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

await page.pdf({
  path: resolve(printDir, "door-hanger-vistaprint.pdf"),
  width: "4.72in",
  height: "11.26in",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

const pages = await page.$$("section.page");
const names = ["front", "back"];
for (let i = 0; i < pages.length; i++) {
  await pages[i].screenshot({ path: resolve(printDir, `door-hanger-${names[i]}.png`) });
}
await browser.close();
unlinkSync(built);
console.log("wrote print/door-hanger-vistaprint.pdf + front/back PNG proofs");
