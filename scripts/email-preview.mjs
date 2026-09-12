// Renders the customer emails to HTML files so they can be eyeballed in a
// browser before anything is sent:  node scripts/email-preview.mjs  → artifacts/email-*.html
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createServer } from "vite";

const vite = await createServer({ server: { middlewareMode: true, hmr: false }, appType: "custom", logLevel: "silent", configFile: false, resolve: { alias: { "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src") } } });
try {
  const mod = await vite.ssrLoadModule("/src/lib/email-theme.ts");
  mkdirSync("artifacts", { recursive: true });
  const booked = mod.bookedEmail({
    id: 42,
    name: "Marlys Thompson",
    service: "leaf-cleanup",
    jobSize: "medium",
    addOns: "gutters-here",
    address: "1417 Chestnut St, Grand Forks, ND 58201",
    day: "2026-10-17",
    range: { low: 145, high: 195 },
    deposit: 50,
    notes: "Gate on the north side sticks — lift and push.",
  });
  writeFileSync("artifacts/email-booked.html", booked.html);
  const junk = mod.bookedEmail({ id: 43, name: "Dale", service: "junk-removal", jobSize: "half", address: "702 S 17th St, Grand Forks", day: null, range: { low: 120, high: 160 }, deposit: 50 });
  writeFileSync("artifacts/email-booked-junk.html", junk.html);
  const done = mod.doneEmail({ id: 42, name: "Marlys Thompson", service: "leaf-cleanup", estimate: "$165" });
  writeFileSync("artifacts/email-done.html", done.html);
  const lead = mod.leadEmail({
    channel: "Voicemail",
    phone: "701-555-0142",
    when: "Sat Sep 12, 2:40 PM",
    transcript: "Hi, this is Carol on Belmont, I've got a yard full of leaves and an old couch. Call me back.",
    recordingUrl: "https://example.invalid/rec",
    bookingId: 44,
    jobsUrl: "https://pickitupe.com/jobs/44",
  });
  writeFileSync("artifacts/email-lead.html", lead.html);
  console.log(booked.subject, "\n", booked.text, "\n\nwrote artifacts/email-*.html");
} finally {
  await vite.close();
}
