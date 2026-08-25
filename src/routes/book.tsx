import { createFileRoute } from "@tanstack/react-router";
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
  "garage-basement",
  "furniture-appliances",
  "single-item",
  "other",
];

export type BookSearch = {
  service?: ServiceKey;
  size?: string;
  addons?: AddOnKey[];
};

/**
 * The hero estimate card on / links here with what the visitor already
 * picked. Everything is validated against the pricebook rather than trusted:
 * a hand-edited ?service=foo simply falls back to the form's defaults instead
 * of throwing or feeding a bad key into estimate().
 *
 * It must return ALL THREE KEYS on every path, even as undefined. The router
 * merges anything validateSearch does not return straight back out of the raw
 * query string, so an early `return {}` on a bad ?service left the raw
 * ?addons="bogus" STRING reaching the form, where addOns.filter blew up the
 * page (verified in the browser — the types alone do not catch it, because
 * the declared type is the sanitised one).
 *
 * Keys are optional in the type so `<Link to="/book">` stays legal elsewhere
 * with no search prop; they are always present at runtime so nothing raw
 * survives. `addons` is read as either a real array or a comma string,
 * because the router serialises arrays itself and a hand-typed URL will not.
 */
function parseSearch(search: Record<string, unknown>): BookSearch {
  const serviceRaw = String(search.service ?? "");
  const service = SERVICE_KEYS.includes(serviceRaw as ServiceKey)
    ? (serviceRaw as ServiceKey)
    : undefined;

  if (!service) return { service: undefined, size: undefined, addons: undefined };

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

export const Route = createFileRoute("/book")({
  validateSearch: parseSearch,
  loader: () => getOfferStatus(),
  component: BookPage,
});

function BookPage() {
  const offer = Route.useLoaderData();
  const { service, size, addons } = Route.useSearch();

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
