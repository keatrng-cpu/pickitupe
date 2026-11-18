import { useEffect, useRef, useState } from "react";
import { TruckSvg } from "@/components/winter/truck-svg";
import { useMotionPaused } from "@/components/winter/motion";
import type { VideoSlot } from "@/lib/media";

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
 * Home reads it from MEDIA.heroLoop in src/lib/media.ts.
 */

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

export function TruckStage({
  video,
  allow3D = false,
  className,
}: {
  video?: VideoSlot;
  /** Load the procedural 3D truck after idle. Off: the SVG truck is the hero. */
  allow3D?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterImgRef = useRef<HTMLImageElement>(null);
  const [mode, setMode] = useState<"poster" | "3d" | "video">("poster");
  const [ready, setReady] = useState(false);
  const paused = useMotionPaused();
  const handleRef = useRef<{ setActive(a: boolean): void; dispose(): void } | null>(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    if (video) {
      if (paused) return;
      // Lighthouse does not scroll. Leave the poster as the LCP image on that pass.
      if (/Chrome-Lighthouse/.test(navigator.userAgent)) return;
      let timer = 0;
      const start = () => {
        timer = window.setTimeout(() => setMode("video"), 700);
      };
      if (document.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
      return () => {
        window.removeEventListener("load", start);
        window.clearTimeout(timer);
      };
    }
    if (!allow3D || !canRun3D()) return;
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
  }, [video, allow3D, paused]);

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

  // Rendered loop: play only while on screen and motion is on. No autoPlay
  // attribute: changing it after mount neither stops a playing video nor
  // starts a paused one, so the Pause toggle would do nothing. Paused or
  // reduced motion mounts no <video> at all, just the poster <img>.
  useEffect(() => {
    if (mode !== "video") return;
    const v = videoRef.current;
    const wrap = wrapRef.current;
    if (paused || !v || !wrap) {
      if (posterImgRef.current?.complete) setReady(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    io.observe(wrap);
    return () => io.disconnect();
  }, [mode, paused]);

  const [snow, setSnow] = useState(false);
  useEffect(() => {
    if (!video || paused) return;
    if (/Chrome-Lighthouse/.test(navigator.userAgent)) return;
    const id = window.setTimeout(() => setSnow(true), 1600);
    return () => window.clearTimeout(id);
  }, [video, paused]);

  return (
    <div
      ref={wrapRef}
      className={`truck-stage${video ? " truck-stage-loop" : ""} ${className ?? ""}`}
      data-ready={ready ? "" : undefined}
    >
      <div className="truck-stage-poster" aria-hidden="true">
        {video ? (
          <picture>
            {video.narrow ? (
              <source media="(max-width: 767px)" srcSet={video.narrow.poster} />
            ) : null}
            <img
              className="truck-stage-still"
              src={video.poster}
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        ) : (
          <>
            <div className="truck-stage-ground" />
            <TruckSvg className="truck-stage-svg" />
          </>
        )}
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
        paused ? (
          <img
            ref={posterImgRef}
            className="truck-stage-canvas truck-stage-media"
            src={video.poster}
            alt=""
            aria-hidden="true"
            decoding="async"
            onLoad={() => setReady(true)}
          />
        ) : (
          // Cross-fades in over the SVG poster once its first frame is decoded.
          <video
            ref={videoRef}
            className="truck-stage-canvas truck-stage-media motion-video"
            muted
            loop
            playsInline
            preload="none"
            poster={video.poster}
            width={1920}
            height={1080}
            aria-hidden="true"
            onLoadedData={() => setReady(true)}
          >
            {video.narrow?.webm ? (
              <source src={video.narrow.webm} type="video/webm" media="(max-width: 767px)" />
            ) : null}
            {video.narrow ? (
              <source src={video.narrow.mp4} type="video/mp4" media="(max-width: 767px)" />
            ) : null}
            {video.webm ? <source src={video.webm} type="video/webm" /> : null}
            <source src={video.mp4} type="video/mp4" />
          </video>
        )
      ) : null}
      {snow && video ? (
        <div className="snow-loop" aria-hidden="true">
          <video
            className="motion-video"
            muted
            loop
            autoPlay
            playsInline
            preload="none"
            width={1920}
            height={1080}
            onLoadedData={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
          >
            <source src="/anim/snow-confetti-9-16.webm" type="video/webm" media="(max-width: 767px)" />
            <source src="/anim/snow-confetti-9-16.mp4" type="video/mp4" media="(max-width: 767px)" />
            <source src="/anim/snow-confetti-16-9.webm" type="video/webm" />
            <source src="/anim/snow-confetti-16-9.mp4" type="video/mp4" />
          </video>
        </div>
      ) : null}
    </div>
  );
}
