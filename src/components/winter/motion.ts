import { useEffect, useState } from "react";

/**
 * One switch for every looping animation on the page (snow, the 3D truck,
 * the header ticker keeps its own). WCAG 2.2.2: anything that moves on its own
 * for more than 5 seconds next to other content needs a way to stop it.
 *
 * State lives on <html data-motion="paused"> so plain CSS can read it, and in
 * localStorage so it survives a page change. prefers-reduced-motion counts as
 * paused everywhere.
 */
const KEY = "piue-motion";
const EVENT = "piue-motion-change";

export function readMotionPaused(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return true;
  return document.documentElement.dataset.motion === "paused";
}

export function setMotionPaused(paused: boolean) {
  const root = document.documentElement;
  if (paused) root.dataset.motion = "paused";
  else delete root.dataset.motion;
  try {
    localStorage.setItem(KEY, paused ? "paused" : "on");
  } catch {
    // private mode — the toggle still works for this page
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Restore the saved choice once on the client. */
export function restoreMotionChoice() {
  try {
    if (localStorage.getItem(KEY) === "paused") document.documentElement.dataset.motion = "paused";
  } catch {
    // ignore
  }
}

export function useMotionPaused() {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    restoreMotionChoice();
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPaused(readMotionPaused());
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener(EVENT, sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener(EVENT, sync);
    };
  }, []);
  return paused;
}

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}
