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
export type VideoSlot = { mp4: string; webm?: string; poster: string };

export const MEDIA: {
  /** Home hero: a rendered loop. 4:3, 5–10 s, start frame = end frame. Wins over everything below. */
  heroLoop?: VideoSlot;
  /**
   * The procedural three.js truck (winter/truck-scene.ts). Off since Nov 13:
   * the owner asked for a classier truck, and the illustrated vintage pickup
   * (truck-art.ts) reads that way; the blocky 3D model didn't. Flip to true
   * to bring it back — nothing else changes.
   */
  hero3D: boolean;
} = { hero3D: false };
