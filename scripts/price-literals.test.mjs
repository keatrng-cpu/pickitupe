import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// Vault idea PK-K01 ("a price that is not in the book cannot render"): the
// surfaces that show prices must read them from src/lib/pricebook.ts. A typed
// "$59" here is exactly how the old rate cards drifted from the book.
const PRICE_SURFACES = [
  "src/components/rate-reel.tsx",
  "src/components/quick-quote.tsx",
  "src/components/add-on-picker.tsx",
  "src/components/winter/load-slider.tsx",
  "src/components/winter/bed-load.tsx",
  "src/components/winter/how-it-works.tsx",
];

for (const file of PRICE_SURFACES) {
  test(`${file} has no typed dollar amounts`, () => {
    const src = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
      // comments may cite a figure; code may not
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    const hits = src.match(/\$\d[\d,]*/g) ?? [];
    assert.deepEqual(hits, [], `price literals found: ${hits.join(", ")}`);
  });
}
