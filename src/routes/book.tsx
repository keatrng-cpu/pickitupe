import { createFileRoute, useRouterState } from "@tanstack/react-router";
import { QuoteForm } from "@/components/quote-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getOfferStatus } from "@/lib/bookings";
import {
  addOnsFor,
  sizeOptionsFor,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";

const SERVICE_KEYS: ServiceKey[] = [
  "leaf-cleanup",
  "junk-removal",
  "furniture-appliances",
  "gutter-cleaning",
  "other",
];

export type BookSearch = {
  service?: ServiceKey;
  size?: string;
  addons?: AddOnKey[];
};

/**
 * The hero estimate card on / links here with what the visitor already picked.
 * Nothing is trusted: every value is checked against the pricebook, so a
 * hand-edited ?service=foo falls back to the form's own defaults instead of
 * feeding a bad key into estimate().
 *
 * `addons` is read as either a real array or a comma string — the router
 * serialises arrays as JSON itself, a hand-typed URL will not.
 */
export function sanitizeBookSearch(search: Record<string, unknown>): BookSearch {
  const serviceRaw = String(search.service ?? "");
  if (!SERVICE_KEYS.includes(serviceRaw as ServiceKey)) return {};
  const service = serviceRaw as ServiceKey;

  const sizeRaw = String(search.size ?? "");
  const size = sizeOptionsFor(service).some((s) => s.value === sizeRaw)
    ? sizeRaw
    : undefined;

  const valid = addOnsFor(service).map((a) => a.key);
  const rawAddons = Array.isArray(search.addons)
    ? search.addons.map(String)
    : String(search.addons ?? "").split(",");
  const addons = rawAddons.filter((k): k is AddOnKey =>
    valid.includes(k as AddOnKey),
  );

  return { service, size, addons: addons.length > 0 ? addons : undefined };
}

/**
 * Deliberately NO `validateSearch` on this route. It looks like the right tool
 * and it is a trap here: the router merges any key validateSearch does not
 * return straight back out of the raw query string, so a sanitised result can
 * never differ from a hostile URL — the router redirects to "canonical", the
 * raw keys survive, and it redirects again. Verified in production:
 * /book?service=nonsense&size=zzz&addons=bogus served an endless 307 to itself
 * (ERR_TOO_MANY_REDIRECTS). Local dev never showed it. Sanitising in the
 * component has no redirect machinery to loop on.
 */
export const Route = createFileRoute("/book")({
  loader: () => getOfferStatus(),
  component: BookPage,
});

function BookPage() {
  const offer = Route.useLoaderData();
  const rawSearch = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  const { service, size, addons } = sanitizeBookSearch(rawSearch);

  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="kicker">Request</p>
          <h1 className="mt-3 font-display text-5xl leading-[0.95] tracking-[-0.02em] sm:text-6xl">
            Book a haul.
          </h1>
          <p className="mt-4 text-base leading-[1.6] text-muted">
            Send the form and we'll text you back.
            {offer.active
              ? ` Book by ${offer.deadlineLabel} for ${Math.round(offer.percent * 100)}% off, up to $${offer.cap}.`
              : ` The ${offer.deadlineLabel} rate has closed — still booking at regular rates.`}
          </p>
          <p className="mt-4 text-base leading-[1.6] text-muted">
            We cannot take paint, chemicals, oil, propane tanks, concrete,
            dirt, roofing, or asbestos.
          </p>
        </div>
        <QuoteForm
          promo={offer}
          initialService={service}
          initialSize={size}
          initialAddOns={addons}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
