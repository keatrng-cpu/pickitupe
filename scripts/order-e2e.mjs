/**
 * End-to-end order test: real site code, real browser, fake Stripe.
 *
 *   1. Start the site with test-only Stripe settings (the "pickitupe-e2e" entry
 *      in the gitignored .claude/launch.json runs exactly this):
 *        VITE_AUTH_ENABLED=false BETTER_AUTH_URL=http://localhost:8091 \
 *        STRIPE_SECRET_KEY=sk_test_e2e_local STRIPE_WEBHOOK_SECRET=whsec_e2e_local \
 *        STRIPE_TEST_API_HOST=127.0.0.1 STRIPE_TEST_API_PORT=12111 \
 *        node node_modules/vite/bin/vite.js dev --host 127.0.0.1 --port 8091
 *      These are made-up test values, not keys. No real database (PGLite in
 *      memory); the Stripe override only works for a test key on loopback, so
 *      nothing leaves this machine.
 *   2. npm run e2e:order                     (BASE defaults to http://localhost:8091)
 *
 * This script runs the fake Stripe API on 127.0.0.1:12111 (checkout session
 * create/retrieve plus a stand-in hosted pay page) and drives Chromium through:
 *   A. junk via the home slider + add-ons → /call → deposit → pay → booked screen →
 *      the signed webhook (twice — idempotency) → the owner's job page
 *   B. landlord desk, 2 units (tiered deposit)
 *   C. gutter cleaning
 *   D. old furniture-appliances link (canonical junk sizes)
 *   E. bad phone is refused before any checkout opens
 *   F. a cancelled checkout says the card wasn't charged
 * Prices are checked against estimate() in src/lib/pricebook.ts, never typed.
 * Exit code 1 on any failure. Screenshots: artifacts/e2e/.
 */
import http from "node:http";
import { mkdir } from "node:fs/promises";
import { register } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import Stripe from "stripe";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = (process.env.BASE || "http://localhost:8091").replace(/\/$/, "");
const STRIPE_PORT = 12111;
const WEBHOOK_SECRET = "whsec_e2e_local";
const GUEST_EMAIL = "e2e-guest@example.test";
const SHOTS = join(ROOT, "artifacts", "e2e");
register("./ts-strip-loader.mjs", pathToFileURL(join(ROOT, "scripts") + "/"));
const pb = await import(pathToFileURL(join(ROOT, "src/lib/pricebook.ts")).href);

// ------------------------------------------------------------- fake Stripe --
const sessions = new Map();
let seq = 0;
// Unique per run: the dev server's in-memory database outlives one run, and a
// reused session or event id would hit the idempotency locks from the last run.
const RUN = Date.now().toString(36);
const json = (res, code, body) => {
  res.writeHead(code, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};
const readBody = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });

const stripe = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${STRIPE_PORT}`);
  if (req.method === "POST" && url.pathname === "/v1/checkout/sessions") {
    const form = new URLSearchParams(await readBody(req));
    const id = `cs_test_E2E${RUN}${String(++seq).padStart(4, "0")}`;
    const metadata = {};
    for (const [k, v] of form) {
      const m = /^metadata\[(.+)\]$/.exec(k);
      if (m) metadata[m[1]] = v;
    }
    const session = {
      id,
      object: "checkout.session",
      mode: form.get("mode"),
      status: "open",
      payment_status: "unpaid",
      url: `http://127.0.0.1:${STRIPE_PORT}/pay/${id}`,
      success_url: form.get("success_url"),
      cancel_url: form.get("cancel_url"),
      amount_total: Number(form.get("line_items[0][price_data][unit_amount]") || 0),
      currency: "usd",
      customer_email: form.get("customer_email"),
      customer_details: null,
      metadata,
      _params: [...form.keys()],
    };
    sessions.set(id, session);
    return json(res, 200, session);
  }
  const get = /^\/v1\/checkout\/sessions\/([^/]+)$/.exec(url.pathname);
  if (req.method === "GET" && get) {
    const s = sessions.get(get[1]);
    return s ? json(res, 200, s) : json(res, 404, { error: { type: "invalid_request_error", message: "No such session" } });
  }
  const pay = /^\/pay\/([^/]+)$/.exec(url.pathname);
  if (pay && sessions.has(pay[1])) {
    const s = sessions.get(pay[1]);
    if (req.method === "GET") {
      res.writeHead(200, { "content-type": "text/html" });
      return res.end(
        `<!doctype html><title>Fake Stripe</title><h1>Fake Stripe checkout</h1><p>$${(s.amount_total / 100).toFixed(2)}</p>
         <form method="post"><button>Pay</button></form><a href="${s.cancel_url}">Back</a>`,
      );
    }
    // The customer types an email on Stripe's page; /call never asked a guest for one.
    s.status = "complete";
    s.payment_status = "paid";
    s.customer_details = { email: GUEST_EMAIL, name: "E2E Guest", phone: null, address: null };
    res.writeHead(303, { location: s.success_url.replace("{CHECKOUT_SESSION_ID}", s.id) });
    return res.end();
  }
  json(res, 404, { error: { type: "invalid_request_error", message: `fake stripe: no route ${req.method} ${url.pathname}` } });
});

// ------------------------------------------------------------------ checks --
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};
const range = (r) => (r ? pb.formatRange(r) : null);
const lastSession = () => [...sessions.values()].at(-1);

async function fillAndPay(page, { name, phone, address, extra }) {
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Phone", { exact: true }).fill(phone);
  await page.getByLabel(/^Street address/).fill(address);
  if (extra) await page.getByLabel("Stop 2").fill(extra);
  await page.getByRole("button", { name: /^Pay \$\d+ to hold$/ }).click();
}

async function completeCheckout(page, label) {
  await page.waitForURL(/127\.0\.0\.1:12111\/pay\//, { timeout: 30_000 });
  await page.getByRole("button", { name: "Pay" }).click();
  await page.waitForURL(/\/call\?held=/, { timeout: 30_000 }); // the router rewrites held=1 as held=true
  await page.getByRole("heading", { name: "You're booked." }).waitFor({ timeout: 30_000 });
  const job = new URL(page.url()).searchParams.get("job");
  await page.waitForTimeout(800); // confirmDeposit lands the real day
  await page.screenshot({ path: join(SHOTS, `${label}-booked.png`), fullPage: true });
  return job;
}

async function signedWebhook(session) {
  const payload = JSON.stringify({
    id: `evt_e2e_${session.id}`,
    object: "event",
    type: "checkout.session.completed",
    api_version: "2026-05-27.dahlia",
    created: Math.floor(Date.now() / 1000),
    data: { object: session },
  });
  const sig = new Stripe("sk_test_signing_only").webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  const res = await fetch(`${BASE}/api/stripe/webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "stripe-signature": sig },
    body: payload,
  });
  return { status: res.status, text: await res.text() };
}

// ---------------------------------------------------------------- scenarios --
await mkdir(SHOTS, { recursive: true });
await new Promise((resolve) => stripe.listen(STRIPE_PORT, "127.0.0.1", resolve));
const browser = await chromium.launch();
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(30_000);
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(String(e)));

  // A — junk through the slider, two add-ons, guest checkout.
  const want = range(pb.estimate({ service: "junk-removal", size: "half", addOns: ["stairs", "appliance-freon"], earlyBird: pb.isPromoActive() }).range);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 120_000 });
  const slider = page.locator("#load-range");
  await slider.waitFor();
  await page.getByRole("button", { name: "One piece" }).click(); // hydrated + known start
  await slider.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  check("A slider: two arrow presses from One piece land on Half the truck", (await page.getByRole("button", { name: "Half the truck" }).getAttribute("aria-pressed")) === "true");
  await page.getByRole("button", { name: /Stairs or basement carry/ }).click();
  await page.getByRole("button", { name: /Fridge, freezer, or AC/ }).click();
  const homePrice = (await page.locator(".price-pop").innerText()).trim();
  check("A home price = pricebook (half + stairs + fridge)", homePrice === want, `${homePrice} vs ${want}`);
  await page.screenshot({ path: join(SHOTS, "A-home-quote.png"), fullPage: false });
  await page.getByRole("link", { name: "Lock this" }).click();
  await page.waitForURL(/\/call\?/);
  const callUrl = new URL(page.url());
  check("A /call carries size and add-ons", callUrl.searchParams.get("size") === "half" && callUrl.searchParams.get("addons") === "stairs,appliance-freon", callUrl.search);
  await page.getByText(want, { exact: true }).first().waitFor();
  check("A /call shows the same price", true, want);
  check("A /call slider opened on Half the truck", (await page.getByRole("button", { name: "Half the truck" }).getAttribute("aria-pressed")) === "true");
  await fillAndPay(page, { name: "E2E Junk", phone: "701-555-0142", address: "1234 Test Ave, Grand Forks ND" });
  const sA = await page.waitForURL(/127\.0\.0\.1:12111/).then(lastSession);
  check("A deposit is the pricebook deposit", sA.amount_total === pb.DEPOSIT * 100, `${sA.amount_total}`);
  check("A Stripe isn't asked for the phone a second time", !sA._params.some((k) => k.startsWith("phone_number_collection")));
  check("A success URL carries the session id placeholder", (sA.success_url || "").includes("sid={CHECKOUT_SESSION_ID}"));
  const jobA = await completeCheckout(page, "A");
  check("A booked screen shows a job code", Boolean(jobA), `#${jobA}`);
  const manage = await page.locator('a[href^="/my/"]').first().getAttribute("href").catch(() => null);
  check("A booked screen links the private job page", Boolean(manage), manage ?? "");
  const hook1 = await signedWebhook(sessions.get(sA.id));
  check("A signed webhook accepted after the success page already finalized", hook1.status === 200, `${hook1.status} ${hook1.text}`);
  const hook2 = await signedWebhook(sessions.get(sA.id));
  check("A replayed webhook is a no-op", hook2.status === 200 && /duplicate/i.test(hook2.text), hook2.text);
  await page.goto(`${BASE}/jobs/${jobA}`, { waitUntil: "networkidle" });
  const jobText = await page.locator("main").innerText();
  // Local demo runs with sign-in off, so /call carries the dev user's email; Stripe's must not overwrite it.
  check("A signed-in email is kept (Stripe's doesn't overwrite it)", jobText.includes("dev@example.com") && !jobText.includes(GUEST_EMAIL));
  check("A owner job page has the quoted range", jobText.includes(want));
  const depositLines = jobText.match(/Deposit \$50\.00 paid by card/g) ?? [];
  check("A deposit recorded exactly once (success page + 2 webhooks)", depositLines.length === 1, `${depositLines.length} lines`);
  await page.screenshot({ path: join(SHOTS, "A-owner-job.png"), fullPage: true });
  if (manage) {
    await page.goto(`${BASE}${manage}`, { waitUntil: "networkidle" });
    check("A private job page opens", /job|day|ticket/i.test(await page.locator("main").innerText()));
  }

  // B — landlord desk, two units.
  const landlordDep = pb.landlordDeposit(2, "turns");
  await page.goto(`${BASE}/call?src=landlord&pack=turns&stops=2`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: `Pay $${landlordDep} to hold` }).waitFor();
  await fillAndPay(page, { name: "E2E Landlord", phone: "701-555-0143", address: "100 Unit A St, Grand Forks ND", extra: "102 Unit B St, Grand Forks ND" });
  const sB = await page.waitForURL(/127\.0\.0\.1:12111/).then(lastSession);
  check("B landlord deposit is tiered from the pricebook", sB.amount_total === landlordDep * 100, `${sB.amount_total} vs ${landlordDep * 100}`);
  check("B landlord order completes", Boolean(await completeCheckout(page, "B")));

  // C — gutters.
  await page.goto(`${BASE}/call?service=gutter-cleaning&size=standard`, { waitUntil: "networkidle" });
  const wantC = range(pb.estimate({ service: "gutter-cleaning", size: "standard", addOns: [], earlyBird: pb.isPromoActive() }).range);
  await page.getByText(wantC, { exact: true }).first().waitFor();
  await fillAndPay(page, { name: "E2E Gutters", phone: "701-555-0144", address: "200 Ranch Rd, Grand Forks ND" });
  const sC = await page.waitForURL(/127\.0\.0\.1:12111/).then(lastSession);
  check("C gutter deposit", sC.amount_total === pb.DEPOSIT * 100);
  check("C gutter order completes", Boolean(await completeCheckout(page, "C")));

  // D — an old furniture link still prices on the junk ladder.
  await page.goto(`${BASE}/call?service=furniture-appliances&size=sofa`, { waitUntil: "networkidle" });
  const wantD = range(pb.estimate({ service: "junk-removal", size: pb.canonicalSize("junk-removal", "sofa"), addOns: [], earlyBird: pb.isPromoActive() }).range);
  await page.getByText(wantD, { exact: true }).first().waitFor();
  check("D old furniture link opens on the junk ladder", (await page.getByRole("button", { name: "One piece" }).getAttribute("aria-pressed")) === "true", wantD);

  // G — a true guest: /book's own email field left blank, so the only email is the one typed on Stripe.
  await page.goto(`${BASE}/book?service=junk-removal&size=full`, { waitUntil: "networkidle" });
  await page.getByLabel(/^Name/).fill("E2E Guest");
  await page.getByLabel(/^Phone/).fill("701-555-0145");
  await page.locator("#address").fill("300 Guest Ln, Grand Forks ND");
  await page.getByRole("button", { name: /Pay \$\d+ to hold/ }).click();
  const sG = await page.waitForURL(/127\.0\.0\.1:12111/).then(lastSession);
  check("G /book guest deposit", sG.amount_total === pb.DEPOSIT * 100 && !sG.customer_email, `email sent to Stripe: ${sG.customer_email ?? "none"}`);
  await completeCheckout(page, "G");
  await page.getByText(/day-before reminder go to/).waitFor();
  const masked = (await page.getByText(/day-before reminder go to/).innerText()).trim();
  check("G guest's Stripe email saved to the booking (shown masked)", masked.includes("e•••@example.test"), masked);

  // E — bad phone never opens checkout.
  const before = sessions.size;
  await page.goto(`${BASE}/call?service=junk-removal&size=single`, { waitUntil: "networkidle" });
  await fillAndPay(page, { name: "E2E Bad", phone: "12345", address: "1 Nowhere St" });
  await page.getByText("Ten-digit phone so we can text the morning of.").waitFor();
  check("E bad phone refused, no checkout opened", sessions.size === before);

  // F — cancelled checkout.
  await page.goto(`${BASE}/call?cancelled=1`, { waitUntil: "networkidle" });
  check("F cancel says the card wasn't charged", await page.getByText(/Card not charged/).isVisible());

  const real = consoleErrors.filter((e) => !/Transition was aborted|Download the React DevTools/.test(e));
  check("no console errors during the run", real.length === 0, real.slice(0, 3).join(" | "));
} catch (err) {
  check("run finished without throwing", false, err instanceof Error ? err.message.split("\n")[0] : String(err));
  for (const pg of browser.contexts().flatMap((c) => c.pages())) {
    console.log("  at:", pg.url());
    await pg.screenshot({ path: join(SHOTS, "failure.png"), fullPage: true }).catch(() => {});
    console.log("  page:", (await pg.locator("body").innerText().catch(() => "")).slice(0, 500).replace(/\s+/g, " "));
  }
} finally {
  await browser.close();
  stripe.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed · ${sessions.size} checkout sessions · screenshots in artifacts/e2e/`);
process.exit(failed.length ? 1 : 0);
