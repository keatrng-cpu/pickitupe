/**
 * Rendered clips that stand in for an illustration, one entry per slot.
 * Empty slot = the page keeps its built-in art (the 3D truck, the SVGs).
 *
 * Filling a slot: render in Higgsfield (docs/HIGGSFIELD.md), then
 *   node scripts/ingest-clip.mjs <download.mp4> --slot hero-loop
 * writes public/media/hero-loop.{mp4,webm} + hero-loop-poster.jpg and prints
 * the line to paste here.
 *
 * Brand loops only. Never put AI footage in a slot that reads as proof of a
 * real job (before/after, "our crew", customer homes) — those are real photos.
 */
export type VideoSlot = {
  mp4: string;
  webm?: string;
  poster: string;
  /** Phone crop. Used under `(max-width: 767px)` so a 16:9 loop is not letterboxed onto a tall stage. */
  narrow?: { mp4: string; webm?: string; poster: string };
};

export const MEDIA: {
  /** Home hero: a rendered loop. Wins over the SVG and the 3D scene. */
  heroLoop?: VideoSlot;
  /**
   * The procedural three.js truck (winter/truck-scene.ts). Off while a
   * hero loop is set — the loop is the same truck, and loading both fights
   * the poster LCP. Flip to true only when heroLoop is empty.
   */
  hero3D: boolean;
} = {
  hero3D: false,
};
