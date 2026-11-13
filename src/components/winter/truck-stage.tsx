import { useEffect, useRef, useState } from "react";
import { TruckSvg } from "@/components/winter/truck-svg";
import { useMotionPaused } from "@/components/winter/motion";

/**
 * Hero stage: an SVG poster paints with the HTML (no network, no layout
 * shift), then the 3D scene is fetched after the page is idle and fades in on
 * top once its first frame is drawn.
 *
 * Skipped entirely — poster stays — when:
 *  - the browser has no WebGL,
 *  - the visitor asked for less data (Save-Data / 2g),
 *  - the device reports very little memory.
 * Reduced motion / the pause toggle still gets the 3D model, as one still frame.
 *
 * Swap slot: pass `video` (mp4/webm + poster) to replace the 3D scene with a
 * rendered loop — e.g. the Higgsfield clips — without touching the layout.
 */
type VideoSlot = { mp4: string; webm?: string; poster: string };

function canRun3D() {
  try {
    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
      deviceMemory?: number;
    };
    if (nav.connection?.saveData) return false;
    if (nav.connection?.effectiveType && /(^|-)2g$/.test(nav.connection.effectiveType)) return false;
    if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 2) return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export function TruckStage({ video, className }: { video?: VideoSlot; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"poster" | "3d" | "video">("poster");
  const [ready, setReady] = useState(false);
  const paused = useMotionPaused();
  const handleRef = useRef<{ setActive(a: boolean): void; dispose(): void } | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (video) {
      setMode("video");
      return;
    }
    if (!canRun3D()) return;
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      setMode("3d");
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const whenIdle = () => {
      if (w.requestIdleCallback) w.requestIdleCallback(start, { timeout: 1500 });
      else setTimeout(start, 300);
    };
    if (document.readyState === "complete") {
      whenIdle();
    } else {
      const onLoad = () => whenIdle();
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        cancelled = true;
        window.removeEventListener("load", onLoad);
      };
    }
    return () => {
      cancelled = true;
    };
  }, [video]);

  useEffect(() => {
    if (mode !== "3d") return;
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    let disposed = false;
    let io: IntersectionObserver | null = null;
    const onVis = () => handleRef.current?.setActive(visibleRef.current && !document.hidden && !paused);

    import("@/components/winter/truck-scene")
      .then(({ mountTruckScene }) => {
        if (disposed) return;
        handleRef.current = mountTruckScene(canvas, {
          still: paused,
          onReady: () => setReady(true),
        });
        io = new IntersectionObserver(([e]) => {
          visibleRef.current = e.isIntersecting;
          onVis();
        });
        io.observe(wrap);
        document.addEventListener("visibilitychange", onVis);
        onVis();
      })
      .catch(() => setMode("poster"));

    return () => {
      disposed = true;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      handleRef.current?.dispose();
      handleRef.current = null;
      setReady(false);
    };
    // Re-mount on pause change so "still" is honoured (one frame, no loop).
  }, [mode, paused]);

  return (
    <div ref={wrapRef} className={`truck-stage ${className ?? ""}`} data-ready={ready ? "" : undefined}>
      <div className="truck-stage-poster" aria-hidden="true">
        <div className="truck-stage-ground" />
        <TruckSvg className="truck-stage-svg" />
      </div>
      {mode === "3d" ? (
        <canvas
          ref={canvasRef}
          className="truck-stage-canvas"
          aria-label="3D model of the Pick It Up E pickup, loaded with a couch, a fridge and boxes, parked in snow. Drag to turn it."
          role="img"
        />
      ) : null}
      {mode === "video" && video ? (
        <video
          className="truck-stage-canvas"
          data-shown=""
          muted
          loop
          playsInline
          autoPlay={!paused}
          preload="metadata"
          poster={video.poster}
          aria-hidden="true"
        >
          {video.webm ? <source src={video.webm} type="video/webm" /> : null}
          <source src={video.mp4} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
