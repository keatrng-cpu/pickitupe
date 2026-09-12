import { useEffect } from "react";
import { rememberSource } from "@/lib/source";

/** Remembers the `?s=` tag (door hanger, Business Profile) so the booking can carry it. Renders nothing. */
export function SourceCapture() {
  useEffect(() => {
    rememberSource();
  }, []);
  return null;
}
