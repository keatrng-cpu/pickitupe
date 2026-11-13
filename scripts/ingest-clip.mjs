/**
 * Turn a downloaded Higgsfield clip into web-ready files for one MEDIA slot.
 *
 *   node scripts/ingest-clip.mjs <clip.mp4> --slot hero-loop [--width 1440]
 *
 * Writes public/media/<slot>.mp4 (H.264, CRF 28, faststart — same recipe as
 * the haul videos), public/media/<slot>.webm (VP9) and
 * public/media/<slot>-poster.jpg (frame 0, so the loop's first frame and the
 * poster are identical — no flash when it starts), then prints the line to
 * paste into MEDIA in src/lib/media.ts.
 *
 * Needs ffmpeg on PATH (or FFMPEG=/path/to/ffmpeg). On Windows:
 *   winget install Gyan.FFmpeg
 * Audio is always dropped: hero loops autoplay muted.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const input = args.find((a, i) => !a.startsWith("--") && !args[i - 1]?.startsWith("--"));
const slot = flag("slot", "");
const width = Number(flag("width", "1440"));

if (!input || !existsSync(input)) fail("usage: node scripts/ingest-clip.mjs <clip.mp4> --slot hero-loop [--width 1440]");
if (!/^[a-z0-9-]+$/.test(slot)) fail("--slot must be lowercase letters, digits and dashes, e.g. hero-loop");
if (!Number.isInteger(width) || width < 480 || width > 2560) fail("--width must be 480–2560");

const ffmpeg = process.env.FFMPEG || "ffmpeg";
if (spawnSync(ffmpeg, ["-version"], { stdio: "ignore" }).status !== 0) {
  fail("ffmpeg not found. Install it (Windows: winget install Gyan.FFmpeg) or set FFMPEG=/path/to/ffmpeg.");
}

const outDir = join(ROOT, "public", "media");
mkdirSync(outDir, { recursive: true });
const src = resolve(input);
const scale = `scale=${width}:-2:flags=lanczos,fps=30`;
const out = (ext) => join(outDir, `${slot}${ext}`);

run("mp4", ["-y", "-i", src, "-an", "-vf", scale, "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out(".mp4")]);
run("webm", ["-y", "-i", src, "-an", "-vf", scale, "-c:v", "libvpx-vp9", "-crf", "36", "-b:v", "0", "-row-mt", "1", out(".webm")]);
run("poster", ["-y", "-i", src, "-vf", `scale=${width}:-2:flags=lanczos`, "-frames:v", "1", "-q:v", "3", out("-poster.jpg")]);

const kb = (p) => Math.round(statSync(p).size / 1024);
console.log(`\n${slot}.mp4 ${kb(out(".mp4"))} KB · .webm ${kb(out(".webm"))} KB · poster ${kb(out("-poster.jpg"))} KB`);
if (kb(out(".mp4")) > 2500) console.warn("! over 2.5 MB — try --width 1280 or a shorter clip; the hero should stay light on phones.");
const key = slot.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
console.log(`\nPaste into MEDIA in src/lib/media.ts:\n  ${key}: { mp4: "/media/${slot}.mp4", webm: "/media/${slot}.webm", poster: "/media/${slot}-poster.jpg" },`);
console.log("Then check it on the page: the edges must melt into the green (see .claude/rules/visual.md).");

function run(label, ffArgs) {
  const r = spawnSync(ffmpeg, ["-hide_banner", "-loglevel", "error", ...ffArgs], { stdio: "inherit" });
  if (r.status !== 0) fail(`ffmpeg failed on ${label}`);
}
function fail(msg) {
  console.error(msg);
  process.exit(1);
}
