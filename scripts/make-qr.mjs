/**
 * Generate the print QR code for the door hanger.
 *
 *   node scripts/make-qr.mjs                      # uses SITE_URL below
 *   node scripts/make-qr.mjs https://pickitupe.com
 *
 * Writes print/qr-pickitupe.svg (vector — give this to the printer) and
 * print/qr-pickitupe.png (2400px raster fallback).
 *
 * WHEN THE DOMAIN CHANGES, RERUN THIS AND REPRINT. A QR code is a physical
 * object with a URL baked into it; there is no editing it after the cards
 * are cut.
 *
 * Design decisions that are not arbitrary — read before changing:
 *
 * - Error correction 'H' (30%). A door hanger lives outdoors on a knob in
 *   Grand Forks weather and gets handled with wet gloves. H is the level
 *   that still scans with a corner scuffed or a raindrop over a module.
 * - Dark modules on a LIGHT ground. Inverted QR codes (light modules on a
 *   dark field) fail on a meaningful share of scanners, which is exactly
 *   the failure you cannot detect until the cards are printed. So the code
 *   sits in its own cream panel on the mahogany card, never directly on
 *   the mahogany.
 * - `margin: 4` is the spec-required quiet zone. Do not trim it to reclaim
 *   space; a QR with no quiet zone is unreliable.
 * - Colours are the brand's own print tokens, not black/white.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Change this if the domain ever changes again, then rerun and REPRINT. */
const SITE_URL = "https://pickitupe.com";

/**
 * `?s=dh` marks the scan as coming from a door hanger. It costs 5 characters
 * and it is the only way to ever answer "did the door hangers work?" — a
 * printed card cannot be re-tagged later.
 */
const SOURCE_PARAM = "?s=dh";

const PRINT = {
  dark: "#3c1e14", // --color-print, mahogany ink
  light: "#f3ead6", // --color-paper, cream ground
};

const target =
  (process.argv[2] || SITE_URL).replace(/\/+$/, "") + "/" + SOURCE_PARAM;

const opts = {
  errorCorrectionLevel: "H",
  margin: 4,
  color: { dark: PRINT.dark, light: PRINT.light },
};

await mkdir(join(ROOT, "print"), { recursive: true });

const svg = await QRCode.toString(target, { ...opts, type: "svg" });
await writeFile(join(ROOT, "print", "qr-pickitupe.svg"), svg, "utf8");

const png = await QRCode.toBuffer(target, { ...opts, width: 2400 });
await writeFile(join(ROOT, "print", "qr-pickitupe.png"), png);

const { modules } = QRCode.create(target, opts);

console.log("encoded URL :", target);
console.log("EC level    : H (30% recoverable)");
console.log("grid        :", `${modules.size}x${modules.size} modules`);
console.log("quiet zone  : 4 modules");
console.log("colours     :", PRINT.dark, "on", PRINT.light);
console.log("");
console.log("wrote print/qr-pickitupe.svg  (vector — send this to the printer)");
console.log("wrote print/qr-pickitupe.png  (2400px raster fallback)");
console.log("");
// Printed reliability is governed by MODULE size, not overall size. Below
// roughly 0.5mm per module, consumer phone cameras start failing at arm's
// length. Total modules across = grid + both quiet zones.
const across = modules.size + 8;
const mmPerModuleAt = (inches) => (inches * 25.4) / across;
console.log(`modules across (incl. quiet zone): ${across}`);
for (const inches of [0.75, 1.0, 1.25]) {
  const mm = mmPerModuleAt(inches);
  const verdict = mm >= 0.6 ? "good" : mm >= 0.5 ? "marginal" : "TOO SMALL";
  console.log(`  ${inches.toFixed(2)} in -> ${mm.toFixed(2)} mm/module  ${verdict}`);
}
console.log("recommended on the card: 1.0-1.25 in square, including quiet zone");
