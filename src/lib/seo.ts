/**
 * Structured data so Google can answer "leaf removal near me" with this
 * business instead of a directory page.
 *
 * Shape copied from the E&E site's LocalBusiness block — the parts that matter
 * for a local service business are `areaServed`, `telephone`, and an explicit
 * service list. Everything here must stay true; a wrong hour or a town we
 * don't actually serve is worse than no markup at all.
 */

export const BUSINESS = {
  name: "Pick It Up E",
  phone: "218-779-2553",
  telHref: "tel:2187792553",
  telE164: "+1-218-779-2553",
  city: "Grand Forks",
  region: "ND",
} as const;

/** Set VITE_SITE_URL at deploy time; canonical/OG tags need an absolute URL. */
export const SITE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta.env?.VITE_SITE_URL as string | undefined)) ||
  "https://pickitupe.com";

const SERVICES = [
  "Fall leaf cleanup",
  "Leaf raking and hauling",
  "Junk removal",
  "Yard debris hauling",
  "Garage cleanout",
  "Basement cleanout",
  "Furniture removal",
  "Appliance removal",
] as const;

const AREA_SERVED = [
  "Grand Forks ND",
  "East Grand Forks MN",
  "Grand Forks Air Force Base ND",
  "Emerado ND",
  "Thompson ND",
  "Manvel ND",
  "Reynolds ND",
  "Larimore ND",
  "Northwood ND",
  "Gilby ND",
  "Crookston MN",
  "Fisher MN",
  "Climax MN",
  "Oslo MN",
] as const;

/** Flat list for the answer box — same source as the JSON-LD, so they cannot drift. */
export const AREA_SERVED_TEXT = AREA_SERVED.join(", ");

export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: BUSINESS.name,
    description:
      "Fall leaf cleanup and junk removal in Grand Forks, ND and East Grand Forks, MN. We rake, blow, bag, and haul — the customer never touches a bag.",
    telephone: BUSINESS.telE164,
    url: SITE_URL,
    image: `${SITE_URL}/og.jpg`,
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: "US",
    },
    areaServed: [...AREA_SERVED],
    knowsAbout: [...SERVICES],
    makesOffer: SERVICES.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s },
    })),
  };
}

/**
 * FAQ markup for the questions people actually search before they call. Every
 * answer here has to match what the site says out loud.
 */
export const FAQ: { q: string; a: string }[] = [
  {
    q: "Do I have to bag my leaves before you come?",
    a: "No. We rake, blow, bag, and haul. Loose piles are fine — you never touch a bag.",
  },
  {
    q: "What does leaf cleanup cost in Grand Forks?",
    a: "Most city lots land between $95 and $245 depending on yard size and how heavy the cover is — under what the national services quote for the same yard. You get a range on this page before you book, and we confirm the number before any work starts.",
  },
  {
    q: "What can't you haul away?",
    a: "We can't take paint, chemicals, oil, propane, concrete, dirt, roofing, or asbestos. Everything else in a normal yard or garage pile is fine.",
  },
  {
    q: "When does the Grand Forks city leaf vacuum run?",
    a: "Typically mid-October to mid-November. Leaves must be loose, within 3 feet of the curb, not in the street, and clear of trees, mailboxes, and poles. Confirm current dates with the city at 701-738-8740.",
  },
  {
    q: "How fast can you come out?",
    a: "Text a photo of the pile to 218-779-2553 and you'll get a number the same day. A $50 deposit holds your date and comes off the invoice.",
  },
];

export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}
