// node --test scripts/phone-line.test.mjs
// Twilio signature math + a signed round-trip against the dev server when it's up.
import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

function sign(token, url, params) {
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  return createHmac("sha1", token).update(data, "utf8").digest("base64");
}

test("signature matches Twilio's published example", () => {
  // From https://www.twilio.com/docs/usage/webhooks/webhooks-security — token "12345".
  const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
  const params = { CallSid: "CA1234567890ABCDE", Caller: "+12349013030", Digits: "1234", From: "+12349013030", To: "+18005551212" };
  assert.equal(sign("12345", url, params), "0/KCTR6DLpKmkAf8muzZqo1nDgQ=");
});

test("dev server rejects an unsigned POST and accepts a signed one", async (t) => {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const base = process.env.TEST_BASE || "http://localhost:8080";
  let up = false;
  try {
    up = (await fetch(base, { signal: AbortSignal.timeout(1500) })).ok;
  } catch {
    up = false;
  }
  if (!up || !token) {
    t.skip("dev server not running or TWILIO_AUTH_TOKEN not set locally");
    return;
  }
  const path = "/api/voice/missed";
  const params = { From: "+17015550142", To: "+18005550100", CallSid: "CAtest", ForwardedFrom: "+17012133969" };
  const body = new URLSearchParams(params).toString();
  const bad = await fetch(base + path, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  assert.equal(bad.status, 403);
  const sig = sign(token, (process.env.BETTER_AUTH_URL || base) + path, params);
  const good = await fetch(base + path, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded", "x-twilio-signature": sig } });
  assert.equal(good.status, 200);
  const xml = await good.text();
  assert.match(xml, /<Response><Say voice="Polly\.Matthew-Neural">/);
  assert.match(xml, /<Record [^>]*transcribe="true"/);
});
