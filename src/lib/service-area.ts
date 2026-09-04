/**
 * Where the truck goes, and how we tell a customer instantly.
 *
 * Geocoding pattern lifted from the GF Plat map desk: keyless Nominatim,
 * bounded to a Grand Forks viewbox so a half-typed street matches the right
 * town on the first try. No API key, no billing, nothing to expire.
 *
 * Nominatim's usage policy allows this at low volume: one request per keystroke
 * burst (debounced), never in a loop, and the browser sends a real Referer.
 */

/** Downtown Grand Forks — distances are measured from here. */
export const HOME = { lat: 47.9253, lon: -97.0329 };

/** Search box around Greater Grand Forks: west, north, east, south. */
export const VIEWBOX = "-97.45,48.10,-96.75,47.75";

export const CORE_MILES = 12;
export const RING_MILES = 25;

export type AreaTier = "core" | "ring" | "outside" | "unknown";

export type AreaVerdict = {
  tier: AreaTier;
  miles: number | null;
  message: string;
};

/** Towns we say yes to by name, even before a map lookup. */
export const CORE_TOWNS = [
  "grand forks",
  "east grand forks",
  "grand forks afb",
  "emerado",
  "thompson",
  "manvel",
] as const;

export const RING_TOWNS = [
  "reynolds",
  "larimore",
  "northwood",
  "gilby",
  "crookston",
  "fisher",
  "climax",
  "mekinock",
  "buxton",
  "hatton",
  "ardoch",
  "oslo",
] as const;

/** Great-circle distance in miles. */
export function milesFromHome(lat: number, lon: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat - HOME.lat);
  const dLon = toRad(lon - HOME.lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(HOME.lat)) * Math.cos(toRad(lat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function verdictForDistance(miles: number): AreaVerdict {
  if (miles <= CORE_MILES) {
    return {
      tier: "core",
      miles,
      message: "You're in our main run — no travel charge.",
    };
  }
  if (miles <= RING_MILES) {
    return {
      tier: "ring",
      miles,
      message: `About ${Math.round(miles)} miles out — we come your way, usually on a day we're already nearby.`,
    };
  }
  return {
    tier: "outside",
    miles,
    message: `That's about ${Math.round(miles)} miles out. Call 701-213-3969 — we'll tell you straight whether we can make it work.`,
  };
}

/** Name-only check, for when the customer types a town instead of an address. */
export function verdictForText(text: string): AreaVerdict {
  const t = (text || "").toLowerCase();
  if (CORE_TOWNS.some((town) => t.includes(town))) {
    return {
      tier: "core",
      miles: null,
      message: "You're in our main run — no travel charge.",
    };
  }
  if (RING_TOWNS.some((town) => t.includes(town))) {
    return {
      tier: "ring",
      miles: null,
      message: "We come out your way — usually on a day we're already nearby.",
    };
  }
  return { tier: "unknown", miles: null, message: "" };
}

export type AddressHit = {
  label: string;
  lat: number;
  lon: number;
};

/**
 * Address suggestions from OpenStreetMap, boxed to Greater Grand Forks.
 * Returns [] on any failure — a lookup outage must never block a booking.
 */
export async function suggestAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressHit[]> {
  if (query.trim().length < 4) return [];
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "5",
    countrycodes: "us",
    viewbox: VIEWBOX,
    bounded: "1",
    q: query,
  });
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { signal, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as {
      display_name?: string;
      lat?: string;
      lon?: string;
    }[];
    return rows
      .filter((r) => r.display_name && r.lat && r.lon)
      .map((r) => ({
        label: String(r.display_name).replace(/, United States$/, ""),
        lat: Number(r.lat),
        lon: Number(r.lon),
      }));
  } catch {
    return [];
  }
}
