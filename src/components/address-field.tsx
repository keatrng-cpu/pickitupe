import { useEffect, useRef, useState } from "react";
import { MapPin, Check, AlertCircle } from "lucide-react";
import {
  milesFromHome,
  suggestAddresses,
  verdictForDistance,
  verdictForText,
  type AddressHit,
  type AreaVerdict,
} from "@/lib/service-area";

/**
 * Address box that answers "do you even come out here?" while the customer is
 * still typing. Suggestions come from OpenStreetMap, bounded to Greater Grand
 * Forks; picking one pins the exact house so the owner can route the day.
 *
 * Typing is never blocked. If the lookup is slow, down, or blocked, the field
 * behaves like a plain text input and falls back to matching the town name.
 */
export function AddressField({
  id,
  value,
  onChange,
  onResolve,
  className,
  error,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  onResolve: (hit: { lat: number; lon: number; verdict: AreaVerdict } | null) => void;
  className: string;
  error?: string;
}) {
  const [hits, setHits] = useState<AddressHit[]>([]);
  const [open, setOpen] = useState(false);
  const [verdict, setVerdict] = useState<AreaVerdict | null>(null);
  const [pinned, setPinned] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced lookup. Nominatim is a donated service — one request per pause in
  // typing, never one per keystroke.
  useEffect(() => {
    if (pinned || value.trim().length < 4) {
      setHits([]);
      return;
    }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      const rows = await suggestAddresses(value, ctl.signal);
      setHits(rows);
      setOpen(rows.length > 0);
    }, 550);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [value, pinned]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function choose(hit: AddressHit) {
    const miles = milesFromHome(hit.lat, hit.lon);
    const v = verdictForDistance(miles);
    onChange(hit.label);
    setVerdict(v);
    setPinned(true);
    setOpen(false);
    onResolve({ lat: hit.lat, lon: hit.lon, verdict: v });
  }

  function handleTyping(next: string) {
    onChange(next);
    setPinned(false);
    onResolve(null);
    // Town-name fallback so a hand-typed "East Grand Forks" still gets a yes.
    const guess = verdictForText(next);
    setVerdict(guess.tier === "unknown" ? null : guess);
  }

  const tone =
    verdict?.tier === "outside"
      ? "text-gold"
      : verdict?.tier === "ring"
        ? "text-fg"
        : "text-sioux";

  return (
    <div ref={boxRef} className="relative">
      <input
        id={id}
        className={className}
        autoComplete="street-address"
        placeholder="Street, city"
        aria-required="true"
        value={value}
        onChange={(e) => handleTyping(e.target.value)}
        onFocus={() => setOpen(hits.length > 0)}
      />

      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-bg-deep shadow-xl">
          {hits.map((hit) => (
            <li key={`${hit.lat},${hit.lon}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface"
                onClick={() => choose(hit)}
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-gold" />
                <span>{hit.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <span className="mt-1.5 flex items-start gap-1.5 text-xs text-gold">
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {error}
        </span>
      ) : verdict ? (
        <span className={`mt-1.5 flex items-start gap-1.5 text-xs ${tone}`}>
          {verdict.tier === "outside" ? (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <Check className="mt-0.5 size-3.5 shrink-0" />
          )}
          {verdict.message}
        </span>
      ) : null}
    </div>
  );
}
