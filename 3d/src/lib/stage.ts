/**
 * Shared, mutable stage state on globalThis so the Astro script bundle and the React island
 * always see the same object. Written by DOM scripts, read every frame by the 3D scene.
 */
export interface StageState {
  /** 0 → 1 across the pinned story */
  progress: number;
  /** pricebook size index (0 bags … 5 two trips) chosen on the slider */
  size: number;
  /** 0 → 1: items being carried out during stop 04 */
  gone: number;
  /** pile items carried out so far / total in the pile (stop 04 counter) */
  carried: number;
  total: number;
  reduced: boolean;
  /** snowfall running in the truck scene (Pause snow toggles it; off under reduced motion) */
  snow: boolean;
  visible: boolean;
}

const g = globalThis as typeof globalThis & { __haulStage?: StageState };

export const stage: StageState = (g.__haulStage ??= {
  progress: 0,
  size: 4,
  gone: 0,
  carried: 0,
  total: 0,
  reduced: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  visible: true,
  snow: !(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches),
});
