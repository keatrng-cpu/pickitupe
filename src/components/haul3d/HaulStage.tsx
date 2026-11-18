import { Link } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { featuredSizesFor, formatRange, DEPOSIT } from "@/lib/pricebook";
import { BUSINESS } from "@/lib/seo";
import { SITE_PHONE, SITE_TEL } from "@/lib/site-phone";
import { stage } from "./stage";

const HaulScene = lazy(() => import("./HaulScene"));
const TruckScene = lazy(() => import("./TruckScene"));

const WEEK = [
  ["Mon", "9:30–5:30"],
  ["Tue", "9:30–5:30"],
  ["Wed", "9:30–5:30"],
  ["Thu", "9:30–5:30"],
  ["Fri", "9:30–5:30"],
  ["Sat", "12–4"],
] as const;

const STOPS = [
  { n: "01", t: "Text a photo", d: "Or slide to the size of the pile. No account." },
  { n: "02", t: "See the price", d: "A range up front, from the same pricebook every time." },
  { n: "03", t: "Pick a day", d: `$${DEPOSIT} on a card holds it and comes off the bill.` },
  { n: "04", t: "Gone", d: "We carry it out, load it and haul it. You don’t lift a thing." },
];

function useMoney(low: number, high: number, reduced: boolean) {
  const [shown, setShown] = useState({ low, high });
  const from = useRef({ low, high });
  useEffect(() => {
    if (reduced) {
      from.current = { low, high };
      setShown({ low, high });
      return;
    }
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 650);
      const e = 1 - (1 - p) ** 3;
      const next = {
        low: Math.round(start.low + (low - start.low) * e),
        high: Math.round(start.high + (high - start.high) * e),
      };
      setShown(next);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = { low, high };
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [low, high, reduced]);
  return shown;
}

export function HaulStage({ after }: { after?: ReactNode }) {
  const sizes = featuredSizesFor("junk-removal");
  const [index, setIndex] = useState(4);
  const [reduced, setReduced] = useState(false);
  const [webgl, setWebgl] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [allow3d, setAllow3d] = useState(false);
  const [carried, setCarried] = useState("0 / 0");
  const [day, setDay] = useState(0);
  const size = sizes[index] ?? sizes[0];
  const money = useMoney(size?.range.low ?? 0, size?.range.high ?? 0, reduced);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduced(mq.matches);
      stage.reduced = mq.matches;
      stage.snow = !mq.matches;
    };
    setMounted(true);
    sync();
    mq.addEventListener("change", sync);
    try {
      setWebgl(!!document.createElement("canvas").getContext("webgl2"));
    } catch {
      setWebgl(false);
    }
    const tomorrow = (new Date().getDay() + 1) % 7;
    setDay(tomorrow === 0 ? 0 : tomorrow - 1);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const phone = window.matchMedia("(max-width: 767px)").matches;
    if (!phone) {
      setAllow3d(true);
      return;
    }
    const go = () => setAllow3d(true);
    window.addEventListener("scroll", go, { once: true, passive: true });
    window.addEventListener("pointerdown", go, { once: true });
    return () => {
      window.removeEventListener("scroll", go);
      window.removeEventListener("pointerdown", go);
    };
  }, [mounted]);

  useEffect(() => {
    stage.size = index;
  }, [index]);

  useEffect(() => {
    const onSize = (e: Event) => setIndex((e as CustomEvent<number>).detail);
    window.addEventListener("haul-size", onSize);
    return () => window.removeEventListener("haul-size", onSize);
  }, []);

  useEffect(() => {
    if (reduced) return;
    let stop = false;
    let lenis: { destroy: () => void; raf: (t: number) => void } | null = null;
    let trigger: { kill: () => void } | null = null;
    const root = document.documentElement;
    root.classList.add("js-stage");
    const steps = [...document.querySelectorAll<HTMLElement>(".stage-step")];
    const at = [0.12, 0.34, 0.54, 0.74];
    const apply = (progress: number) => {
      const p = Math.min(1, Math.max(0, progress));
      stage.progress = p;
      // Claude's ramp, started at 0.35 so the room is swept before the quote.
      stage.gone = Math.min(1, Math.max(0, (p - 0.35) / 0.5));
      let active = -1;
      at.forEach((mark, i) => {
        if (p >= mark) active = i;
      });
      steps.forEach((el, i) => {
        el.dataset.active = String(i === active && p < 0.82);
      });
      const done = stage.total > 0 && stage.carried >= stage.total;
      const label = done ? "carried out. Broom-swept." : `${stage.carried} / ${stage.total} items carried out`;
      setCarried((prev) => (prev === label ? prev : label));
      const hero = document.querySelector<HTMLElement>(".hero-copy");
      if (hero) {
        const h = Math.min(1, Math.max(0, (p - 0.16) / 0.22));
        hero.style.opacity = String(1 - h);
        hero.style.pointerEvents = h > 0.85 ? "none" : "";
      }
    };
    const fromWindow = () => {
      const el = document.getElementById("haul-stage");
      const quote = document.getElementById("haul");
      if (!el) return;
      const start = el.offsetTop;
      const end = quote ? quote.offsetTop - window.innerHeight * 0.2 : start + el.offsetHeight - window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / Math.max(end - start, 1)));
      apply(p);
    };
    window.addEventListener("scroll", fromWindow, { passive: true });
    fromWindow();
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (fine) (async () => {
      const [{ default: Lenis }, gsapMod] = await Promise.all([import("lenis"), import("gsap"), import("gsap/ScrollTrigger")]);
      if (stop) return;
      const gsap = gsapMod.gsap;
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);
      const scroller = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        syncTouch: false,
        wheelMultiplier: 0.9,
        touchMultiplier: 1,
      });
      lenis = scroller;
      (window as Window & { __lenis?: typeof scroller }).__lenis = scroller;
      scroller.on("scroll", ScrollTrigger.update);
      const tick = (t: number) => scroller.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      trigger = ScrollTrigger.create({
        trigger: "#haul-stage",
        start: "top top",
        end: "bottom bottom",
        onUpdate: () => fromWindow(),
      });
    })();
    return () => {
      stop = true;
      trigger?.kill();
      lenis?.destroy();
      window.removeEventListener("scroll", fromWindow);
      root.classList.remove("js-stage");
    };
  }, [reduced]);

  const show3d = mounted && webgl && !reduced && allow3d;
  const price = size?.range ? `$${money.low.toLocaleString("en-US")}–$${money.high.toLocaleString("en-US")}` : "";
  const book = useMemo(() => ({ service: "junk-removal" as const, size: size?.value }), [size?.value]);

  return (
    <div className="haul-stage bg-[#07140e] text-[#EDE3D0]">
      <section id="haul-stage" className="relative" aria-label="Your pile, priced and hauled">
        <div className="stage-viewport relative h-[100svh] min-h-[640px] overflow-hidden">
          <picture className="pointer-events-none absolute inset-0">
            <source media="(max-width: 767px)" srcSet="/haul3d/poster-sm.webp" />
            <img
              src="/haul3d/poster.webp"
              alt=""
              width={1280}
              height={1108}
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </picture>
          {show3d ? (
            <Suspense fallback={null}>
              <HaulScene />
            </Suspense>
          ) : null}

          <div className="hero-copy pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-[#07140e] via-[#07140e]/80 to-transparent px-4 pb-28 pt-24 md:inset-y-0 md:flex md:items-end md:bg-gradient-to-r md:pb-16 md:pt-24">
            <div className="mx-auto w-full max-w-6xl">
              <div className="max-w-xl">
                <p className="soft-in kicker mb-3">Junk, appliances & cleanouts in Grand Forks</p>
                <h1 className="soft-in font-display text-5xl leading-[0.95] tracking-[-0.02em] sm:text-7xl">
                  We haul it.
                  <span className="mt-1 block italic text-gold">You don’t.</span>
                </h1>
                <p className="soft-in mt-4 hidden max-w-md text-sm leading-6 text-[#EDE3D0]/80 sm:block">
                  Out of your house, not on the curb for the city truck. Carried from the basement. ${DEPOSIT} holds the day.
                </p>
                <div className="soft-in pointer-events-auto mt-6 border border-[#EDE3D0]/20 bg-[#07140e]/85 p-4 md:p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="haul-size" className="text-[11px] uppercase tracking-[0.18em] text-[#EDE3D0]/70">
                      How much is there?
                    </label>
                    <span className="font-display text-lg">{size?.label}</span>
                  </div>
                  <input
                    id="haul-size"
                    type="range"
                    min={0}
                    max={Math.max(0, sizes.length - 1)}
                    step={1}
                    value={index}
                    onChange={(e) => setIndex(Number(e.target.value))}
                    className="mt-3 h-11 w-full cursor-pointer accent-[#EDE3D0]"
                    aria-valuetext={`${size?.label}, ${price}`}
                  />
                  <div className="-mt-1 grid grid-cols-6 text-center text-[10px] uppercase tracking-wide text-[#EDE3D0]/60">
                    {sizes.map((s, i) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setIndex(i)}
                        className={`min-h-11 px-0.5 leading-tight ${i === index ? "text-[#EDE3D0]" : ""}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-[#EDE3D0]/70">{size?.hint}</p>
                  <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-[#EDE3D0]/15 pt-4">
                    <p className="font-display text-4xl leading-none tabular-nums" aria-live="polite">
                      {price}
                    </p>
                    <Link
                      to="/call"
                      search={book}
                      className="btn-press inline-flex h-11 items-center rounded-full bg-[#EDE3D0] px-5 text-sm font-medium text-[#143224] hover:bg-gold"
                    >
                      Lock this →
                    </Link>
                  </div>
                  <p className="mt-3 text-xs text-[#EDE3D0]/60">
                    Confirmed when we see it. ${DEPOSIT} on a card holds the day and comes off the bill. {SITE_PHONE}. {BUSINESS.hoursLine}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ol className="stage-steps z-10 px-4 py-16" aria-label="How it works">
            {STOPS.map((s, i) => (
              <li key={s.n} className="stage-step" data-active={reduced ? "true" : "false"}>
                <div className="max-w-md border border-[#EDE3D0]/20 bg-[#07140e]/90 p-5">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gold">{s.n} — How it works</p>
                  <h2 className="mt-2 font-display text-3xl leading-none">{s.t}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#EDE3D0]/80">{s.d}</p>
                  {i === 2 ? (
                    <ol className="mt-4 grid grid-cols-6 gap-1" aria-label="Open days and hours">
                      {WEEK.map(([d, h], k) => (
                        <li key={d} className={`border px-1 py-2 text-center ${k === day ? "border-[#EDE3D0] bg-[#EDE3D0]/10" : "border-[#EDE3D0]/25"}`}>
                          <span className="block text-xs">{d}</span>
                          <span className="block text-[10px] text-[#EDE3D0]/70">{h}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                  {i === 3 ? (
                    <p className="mt-4 font-display text-3xl tabular-nums" aria-live="polite">{carried}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
        {after ? (
          <div className="stage-follow">
            <div className="stage-scroll-room" aria-hidden="true" />
            {after}
          </div>
        ) : null}
      </section>

      <section id="truck" className="relative h-[88svh] min-h-[560px] overflow-hidden bg-[#07140e] md:h-[100svh]" aria-labelledby="truck-h">
        {show3d ? (
          <Suspense fallback={null}>
            <TruckScene />
          </Suspense>
        ) : (
          <img src="/haul3d/poster.webp" alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />
        )}
        <div className="pointer-events-none relative z-10 flex h-full flex-col justify-end px-4 pb-28 md:justify-center md:pb-0">
          <div className="mx-auto w-full max-w-6xl">
            <p className="soft-in text-[11px] uppercase tracking-[0.2em] text-gold">Loaded</p>
            <h2 id="truck-h" className="soft-in mt-2 font-display text-4xl leading-none sm:text-6xl">
              Out of your house.
              <span className="mt-1 block italic text-gold">Into the bed.</span>
            </h2>
            <p className="soft-in mt-4 max-w-md text-sm leading-6 text-[#EDE3D0]/80">
              Not on the curb for the city truck. Carried from the basement and strapped in the bed. Priced by the truck bed, not the hour.
            </p>
            <p className="soft-in mt-4 font-display text-2xl">
              In the bed: {size?.label} <span className="text-gold tabular-nums">{price || (size?.range ? formatRange(size.range) : "")}</span>
            </p>
            <div className="pointer-events-auto mt-5 flex flex-wrap gap-3">
              <Link to="/call" search={book} className="btn-press inline-flex h-11 items-center rounded-full bg-[#EDE3D0] px-5 text-sm font-medium text-[#143224]">
                Book this load →
              </Link>
              <a href={SITE_TEL} className="inline-flex h-11 items-center rounded-full border border-[#EDE3D0]/30 px-4 text-sm">
                Call {SITE_PHONE}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
