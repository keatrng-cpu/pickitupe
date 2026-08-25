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
 * Resolves exactly one path alias, "@/" to "src/", because that is the only
 * alias the project declares and the modules under test import each other
 * through it.
 *
 * Deliberately NOT a general-purpose TS loader beyond that: no JSX, no
 * decorators, no interop games. If a module under test ever needs a framework
 * import, give it a real build step instead of growing this.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const SRC = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    return {
      url: new URL(specifier.slice(2) + ".ts", SRC).href,
      format: "module",
      shortCircuit: true,
    };
  }
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
