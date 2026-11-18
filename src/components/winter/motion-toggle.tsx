import { Pause, Play } from "lucide-react";
import { setMotionPaused, useMotionPaused, useReducedMotion } from "@/components/winter/motion";

/** Pause / play for the snow and the 3D truck. Hidden under reduced motion (nothing moves). */
export function MotionToggle({ className }: { className?: string }) {
  const paused = useMotionPaused();
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <button
      type="button"
      onClick={() => setMotionPaused(!paused)}
      aria-pressed={paused}
      className={`motion-toggle inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-bg/70 px-3 text-xs text-fg backdrop-blur hover:bg-fg/10 ${className ?? ""}`}
    >
      {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
      {paused ? "Play snow" : "Pause snow"}
    </button>
  );
}
