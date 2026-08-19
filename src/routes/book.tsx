import { createFileRoute } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { QuoteForm } from "@/components/quote-form";
import { FallingLeaves } from "@/components/falling-leaves";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { getOfferStatus } from "@/lib/bookings";

export const Route = createFileRoute("/book")({
  loader: () => getOfferStatus(),
  component: BookPage,
});

function BookPage() {
  const offer = Route.useLoaderData();
  return (
    <div className="relative min-h-screen bg-bg">
      <FallingLeaves />
      <SiteHeader />
      <main className="mx-auto grid max-w-5xl items-start gap-10 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs tracking-[0.28em] text-gold">REQUEST</p>
          <h1 className="mt-3 font-display text-5xl">Book a haul.</h1>
          <p className="mt-4 text-muted">
            Text 218-779-2553 or send the form.{" "}
            {offer.active
              ? `Book by ${offer.deadlineLabel} for ${Math.round(offer.percent * 100)}% off, up to $${offer.cap}.`
              : `The ${offer.deadlineLabel} rate has closed — still booking at regular rates.`}
          </p>
          <ul className="mt-8 space-y-4 text-sm text-muted">
            <li>
              <span className="text-gold">01 — </span>
              We quote from a photo or a walk-around.
            </li>
            <li>
              <span className="text-gold">02 — </span>
              $50 holds the date and comes off the bill.
            </li>
            <li>
              <span className="text-gold">03 — </span>
              We rake, blow, and haul. You never bag.
            </li>
          </ul>
          <a
            href="tel:2187792553"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-full border border-border px-4 text-sm text-fg hover:bg-fg/8"
          >
            <Phone className="size-4" />
            Call or text 218-779-2553
          </a>
        </div>
        <QuoteForm promo={offer} />
      </main>
      <SiteFooter />
    </div>
  );
}
