import { SITE_E164, SITE_PHONE, SITE_TEL } from "@/lib/site-phone";
/**
 * Structured data so Google can answer "leaf removal near me" with this
 * business instead of a directory page.
 *
 * Shape copied from the E&E site's LocalBusiness block — the parts that matter
 * for a local service business are `areaServed`, `telephone`, and an explicit
 * service list. Everything here must stay true; a wrong hour or a town we
 * don't actually serve is worse than no markup at all.
 *
 * The NAP block (name / phone / city / hours) is mirrored character-for-character
 * on the Google Business Profile and in the site footer. Change one, change all.
 */

export const BUSINESS = {
  name: "Pick It Up E",
  phone: SITE_PHONE,
  telHref: SITE_TEL,
  telE164: SITE_E164,
  city: "Grand Forks",
  region: "ND",
  /**
   * Truck hours from 2026-11-13, built around the landfill (Mon–Fri 8–4,
   * Sat 8–11). Mirror on the Google Business Profile by hand.
   */
  hoursLine: "Mon–Fri 9:30–5:30 · Sat 12–4",
  /** GBP pin (address hidden; proximity still computes from it). */
  geo: { lat: 47.92409, lng: -97.0862134 },
  /** The profile's g.page short link (same id family as REVIEW_URL). */
  mapsUrl: "https://g.page/r/CfPEjbVSA_SoEBM",
} as const;

/** Set VITE_SITE_URL at deploy time; canonical/OG tags need an absolute URL. */
export const SITE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SITE_URL as string | undefined)) ||
  "https://pickitupe.com";

/** Absolute canonical for a route path ("/" → SITE_URL, "/x" → SITE_URL/x). */
export function canonical(path: string) {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

/**
 * Profiles that carry the same NAP. Add each citation URL the day it goes live
 * (Bing Places, Apple Business Connect, Yelp, Nextdoor, Facebook, BBB) — this
 * list is what tells Google they are all the same business.
 */
export const SAME_AS: string[] = [BUSINESS.mapsUrl];

// Winter order (2026-11): junk and estates first, leaves last until spring.
const SERVICES = [
  "Junk removal",
  "Estate cleanout",
  "Whole-house cleanout",
  "Appliance removal",
  "Furniture removal",
  "Garage cleanout",
  "Basement cleanout",
  "Gutter cleaning",
  "Leaf raking and hauling",
  "Yard debris hauling",
] as const;

/** City / state pairs — rendered as City objects in the JSON-LD, text in copy. */
const AREA_SERVED: { name: string; region: "ND" | "MN" }[] = [
  { name: "Grand Forks", region: "ND" },
  { name: "East Grand Forks", region: "MN" },
  { name: "Grand Forks Air Force Base", region: "ND" },
  { name: "Emerado", region: "ND" },
  { name: "Thompson", region: "ND" },
  { name: "Manvel", region: "ND" },
  { name: "Reynolds", region: "ND" },
  { name: "Larimore", region: "ND" },
  { name: "Northwood", region: "ND" },
  { name: "Gilby", region: "ND" },
  { name: "Crookston", region: "MN" },
  { name: "Fisher", region: "MN" },
  { name: "Climax", region: "MN" },
  { name: "Oslo", region: "MN" },
];

/** Flat list for the answer box — same source as the JSON-LD, so they cannot drift. */
export const AREA_SERVED_TEXT = AREA_SERVED.map((a) => `${a.name} ${a.region}`).join(", ");

/** Grand Forks neighborhoods the hangers go to — named in body copy so the pages read local, not templated. */
export const NEIGHBORHOODS = [
  "Lincoln Park",
  "Belmont Road",
  "Reeves Drive",
  "Clover Drive",
  "University Park",
  "Riverside",
  "Near Southside",
] as const;

function areaServedJsonLd() {
  return AREA_SERVED.map((a) => ({
    "@type": "City",
    name: a.name,
    containedInPlace: { "@type": "State", name: a.region === "ND" ? "North Dakota" : "Minnesota" },
  }));
}

const OPENING_HOURS = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: "09:30",
    closes: "17:30",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Saturday"],
    opens: "12:00",
    closes: "16:00",
  },
];

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_URL}/#business`,
    name: BUSINESS.name,
    description:
      "Junk, furniture and appliance removal, estate and whole-house cleanouts, and single-story gutter cleaning in Grand Forks, ND and East Grand Forks, MN. Carried from the basement, price before you call, book in 60 seconds.",
    telephone: BUSINESS.telE164,
    url: SITE_URL,
    image: [`${SITE_URL}/og.jpg`, `${SITE_URL}/work/couch-bed.jpg`],
    logo: `${SITE_URL}/logo.png`,
    priceRange: "$59–$4,500",
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
    hasMap: BUSINESS.mapsUrl,
    sameAs: SAME_AS,
    openingHoursSpecification: OPENING_HOURS,
    areaServed: areaServedJsonLd(),
    knowsAbout: [...SERVICES],
    makesOffer: SERVICES.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s },
    })),
  };
}

/**
 * One Service block per service page. `price` is the pricebook range as text
 * ("$160–$490") — never a number the pricebook does not produce.
 */
export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
  priceLow: number;
  priceHigh: number;
  serviceType: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonical(input.path)}#service`,
    name: input.name,
    serviceType: input.serviceType,
    description: input.description,
    url: canonical(input.path),
    image: input.image ? `${SITE_URL}${input.image}` : `${SITE_URL}/og.jpg`,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: areaServedJsonLd(),
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: input.priceLow,
      highPrice: input.priceHigh,
      url: `${SITE_URL}/call`,
    },
  };
}

/**
 * FAQ markup for the questions people actually search before they call. This
 * list IS the on-page FAQ (components/fine-print.tsx renders it) so the two can
 * never drift. Every answer has to match the pricebook and the no-ladder rule.
 */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "What does junk removal cost in Grand Forks?",
    a: "Priced by the truck bed, not the hour. One piece is $59–$95. Half the bed is $125–$195. A full strapped load is $175–$265. You see the range before you book and we confirm it when we see the pile.",
  },
  {
    q: "Does it have to be at the curb?",
    a: "No. We carry it out of the basement, the garage or the back bedroom. Stairs add $30–$60. That's the difference from the city's curbside pickup.",
  },
  {
    q: "Do you do estate or whole-house cleanouts?",
    a: "Yes. Free walkthrough, then one fixed written price. Most land between $650 and $4,500. That covers one room up to a full house with a packed basement. Usable things go to donation, metal to scrap.",
  },
  {
    q: "What can't you take?",
    a: "Paint, chemicals, oil, propane, concrete, dirt, roofing, or asbestos. Everything else in a normal house, garage or basement pile is fine.",
  },
  {
    q: "How do I hold a day?",
    a: "$50 on the card locks it and comes off the invoice. Landlord stacks run $75–$150. I'll text the morning of.",
  },
  {
    q: "Gutters?",
    a: "Yes — single-story only, cleaned from the ground with a 120V gutter vacuum, no ladder on your siding. Two-story we'll tell you straight and hand you off. Leaf cleanup is back in spring.",
  },
];

export function faqJsonLd(items: { q: string; a: string }[] = FAQ) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/** BreadcrumbList for the service pages: Home → page. */
export function breadcrumbJsonLd(path: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Pick It Up E", item: SITE_URL },
      { "@type": "ListItem", position: 2, name, item: canonical(path) },
    ],
  };
}

/** The head() block every public route shares: title, description, canonical, OG. */
export function pageHead(input: {
  path: string;
  title: string;
  description: string;
  image?: string;
  jsonLd?: object[];
  noindex?: boolean;
}) {
  const url = canonical(input.path);
  const image = `${SITE_URL}${input.image ?? "/og.jpg"}`;
  return {
    meta: [
      { title: input.title },
      { name: "description", content: input.description },
      ...(input.noindex ? [{ name: "robots", content: "noindex, nofollow" }] : []),
      { property: "og:title", content: input.title },
      { property: "og:description", content: input.description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "geo.region", content: "US-ND" },
      { name: "geo.placename", content: "Grand Forks" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: (input.jsonLd ?? []).map((obj) => ({
      type: "application/ld+json",
      children: JSON.stringify(obj),
    })),
  };
}
