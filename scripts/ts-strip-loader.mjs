/**
 * Minimal Node module loader that lets the pricebook unit tests import
 * `src/lib/pricebook.ts` directly.
 *
 * pricebook.ts is deliberately dependency-free and framework-free — it is pure
 * arithmetic over literal tables. Standing up Vite or ts-node just to assert
 * that a discount cannot breach a floor would be more moving parts than the
 * thing under test. Node can already strip TypeScript types (>= 22.6), so this
 * only has to answer "yes, .ts is a module" and hand the source over.
 *
 * Deliberately NOT a general-purpose TS loader: no path aliases, no JSX, no
 * decorators. If pricebook.ts ever grows an import of anything, replace this
 * with a real build step rather than extending it.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith(".ts")) {
    const parent = context.parentURL ?? import.meta.url;
    return {
      url: new URL(specifier, parent).href,
      format: "module",
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".ts")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return {
      format: "module-typescript",
      source,
      shortCircuit: true,
    };
  }
  return nextLoad(url, context);
}
