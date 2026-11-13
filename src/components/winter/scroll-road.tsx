/**
 * A thin road under the header that fills as you scroll the page. Gold on a dashed lane. CSS only (`animation-timeline: scroll()`),
 * decorative, hidden where scroll timelines aren't supported and under reduced
 * motion.
 */
export function ScrollRoad() {
  return (
    <div className="scroll-road" aria-hidden="true">
      <div className="scroll-road-fill" />
    </div>
  );
}
