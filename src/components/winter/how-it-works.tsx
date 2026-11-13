import { Camera, CalendarCheck, Receipt, Truck } from "lucide-react";
import { useEffect, useRef, type CSSProperties } from "react";
import { TruckSvg } from "@/components/winter/truck-svg";
import { smsLink } from "@/lib/messages";
import { BUSINESS } from "@/lib/seo";

/**
 * "How it works" as a road. The truck drives left to right while the section
 * scrolls through view, and each stop lights up as the truck reaches it.
 *
 * Motion is CSS scroll-driven (`animation-timeline: view()`) — no scroll
 * listeners, no pinning, the page never stops scrolling. Browsers without
 * scroll timelines get an IntersectionObserver that parks the truck at the end
 * with a transition and lights every stop. Reduced motion: truck parked, all lit.
 */
const STEPS = [
  { icon: Camera, title: "Text a photo", body: "Or tap the size of the pile. No account." },
  { icon: Receipt, title: "See the price", body: "A range up front, from the same pricebook every time." },
  { icon: CalendarCheck, title: "Pick a day", body: "$50 on a card holds it and comes off the bill." },
  { icon: Truck, title: "Gone", body: "We carry it out, load it and haul it. You don't lift a thing." },
] as const;

/** Step 01 is the one thing the customer does, so it is a real button: it opens
 * their texting app with the number and a starter line filled in. */
const PHOTO_TEXT = smsLink(
  BUSINESS.phone,
  "Junk pickup quote. Photo of the pile attached. Address: ",
);

export function HowItWorksRoad() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: view()")) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.arrived = "";
          io.disconnect();
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="road-section section-y mx-auto max-w-6xl px-4" aria-labelledby="how-it-works">
      <p className="kicker">How it works</p>
      <h2 id="how-it-works" className="mt-3 font-display text-3xl leading-none sm:text-4xl lg:text-5xl">
        Four stops. You do one of them.
      </h2>

      <div className="road-track mt-10" aria-hidden="true">
        <div className="road-lane" />
        <div className="road-driver">
          <TruckSvg className="road-truck" wheelsSpin />
        </div>
      </div>

      <ol className="road-steps mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="road-step card-green rounded-2xl p-5" style={{ "--i": i } as CSSProperties}>
            <span className="road-step-num font-display text-sm text-gold">0{i + 1}</span>
            <s.icon className="mt-3 size-6 text-gold" aria-hidden="true" />
            <p className="mt-3 font-display text-2xl leading-none">{s.title}</p>
            <p className="mt-2 text-sm leading-6 text-fg/85">{s.body}</p>
            {i === 0 ? (
              <a
                href={PHOTO_TEXT}
                className="btn-press mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-ink hover:bg-gold"
              >
                <Camera className="size-4" aria-hidden="true" />
                Text a photo
              </a>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  );
}
