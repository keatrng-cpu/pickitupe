import { createFileRoute } from "@tanstack/react-router";
import { QuoteForm } from "@/components/quote-form";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getOfferStatus } from "@/lib/bookings";

export const Route = createFileRoute("/book")({
  loader: () => getOfferStatus(),
  component: BookPage,
});

function BookPage() {
  const offer = Route.useLoaderData();
  return (
    <div className="relative z-10 min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="kicker">Request</p>
          <h1 className="mt-3 font-display text-5xl">Book a haul.</h1>
          <p className="mt-4 text-muted">
            Send the form and we'll text you back.
            {offer.active
              ? ` Book by ${offer.deadlineLabel} for ${Math.round(offer.percent * 100)}% off, up to $${offer.cap}.`
              : ` The ${offer.deadlineLabel} rate has closed — still booking at regular rates.`}
          </p>
        </div>
        <QuoteForm promo={offer} />
      </main>
      <SiteFooter />
    </div>
  );
}
