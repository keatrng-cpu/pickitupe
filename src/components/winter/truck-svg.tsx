import { truckArt } from "@/lib/truck-art";

/**
 * Side view of the brand truck: the vintage cream pickup from
 * `src/lib/truck-art.ts` (the print build draws the same one). Faces right —
 * never flip it. Pure SVG, so it costs nothing to ship: the hero art, the
 * truck that drives the "how it works" road and the estate page hero.
 */
const STILL = truckArt();
const SPINNING = truckArt({ wheelClass: "truck-wheel" });

export function TruckSvg({
  className,
  title,
  wheelsSpin = false,
}: {
  className?: string;
  title?: string;
  wheelsSpin?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 320 160"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      // Static markup from truck-art.ts — no user input reaches it.
      dangerouslySetInnerHTML={{ __html: wheelsSpin ? SPINNING : STILL }}
    />
  );
}
