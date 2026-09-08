import { createFileRoute, Link } from "@tanstack/react-router";
import { Mic, Phone, PhoneOff } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DateField } from "@/components/date-field";
import { LotSizeField } from "@/components/lot-size-field";
import { PhotoQuote } from "@/components/photo-quote";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { StickyDock } from "@/components/sticky-dock";
import { speakShop, talkShop, type ChatTurn, type ShopLead } from "@/lib/dispatcher";
import { lockWithDeposit } from "@/lib/pay-actions";
import { formatPhone, isUsPhone } from "@/lib/phone";
import { PHONE } from "@/lib/messages";
import {
  canonicalService,
  canonicalSize,
  clampStops,
  estimate,
  featuredSizesFor,
  formatRange,
  isPromoActive,
  LANDLORD_PACKS,
  listedSizesFor,
  landlordDeposit,
  packDefaultSize,
  packService,
  sizesForPack,
  STOP_COUNTS,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";
import { saveLastBooking } from "@/lib/returning";
import { formatDayLong } from "@/lib/schedule";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

type Search = {
  service?: string;
  size?: string;
  src?: string;
  pack?: LandlordPack;
  stops?: number;
  lotSqFt?: number;
  held?: boolean;
  job?: number;
  when?: string;
  code?: string;
  cancelled?: boolean;
};

export const Route = createFileRoute("/call")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const out: Search = {};
    if (typeof search.service === "string") out.service = search.service;
    if (typeof search.size === "string") out.size = search.size;
    if (typeof search.src === "string") out.src = search.src;
    if (search.pack === "turns" || search.pack === "leaves" || search.pack === "combo") {
      out.pack = search.pack;
    }
    const rawStops =
      typeof search.stops === "number"
        ? search.stops
        : typeof search.stops === "string"
          ? Number(search.stops)
          : NaN;
    if (Number.isFinite(rawStops) && rawStops >= 1) out.stops = clampStops(rawStops);
    const rawLot =
      typeof search.lotSqFt === "number"
        ? search.lotSqFt
        : typeof search.lotSqFt === "string"
          ? Number(search.lotSqFt)
          : NaN;
    if (Number.isFinite(rawLot) && rawLot >= 1500) out.lotSqFt = Math.round(rawLot);
    if (search.held === "1" || search.held === 1 || search.held === true) out.held = true;
    if (search.cancelled === "1" || search.cancelled === 1 || search.cancelled === true) out.cancelled = true;
    const job =
      typeof search.job === "number"
        ? search.job
        : typeof search.job === "string"
          ? Number(search.job)
          : NaN;
    if (Number.isFinite(job) && job > 0) out.job = job;
    if (typeof search.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.day)) out.when = search.day;
    if (typeof search.code === "string") out.code = search.code;
    return out;
  },
  component: CallPage,
});

const GREETING =
  "Pick It Up E. Tap a day on the board, or tell me what we're hauling — I'll lock it.";

function landlordGreeting(pack?: LandlordPack, stops?: number) {
  if (pack && stops && stops > 1) {
    const label = LANDLORD_PACKS.find((p) => p.value === pack)?.label.toLowerCase();
    return `Landlord desk. ${stops} ${label ?? "stops"} this week. Name on the invoice and I'll lock the first open day.`;
  }
  if (pack) {
    const label = LANDLORD_PACKS.find((p) => p.value === pack)?.label.toLowerCase();
    return `Landlord desk. ${label}. How many addresses this week?`;
  }
  return "Landlord desk. Tenant turns, a leaf route, or both this week? I'll stack the days on one code.";
}

const SERVICES: { value: ServiceKey; short: string }[] = [
  { value: "leaf-cleanup", short: "Leaves" },
  { value: "junk-removal", short: "Junk" },
  { value: "gutter-cleaning", short: "Gutters" },
];

function isService(v: string | undefined): v is ServiceKey {
  return (
    v === "leaf-cleanup" ||
    v === "junk-removal" ||
    v === "furniture-appliances" ||
    v === "gutter-cleaning"
  );
}

function CallPage() {
  const params = Route.useSearch();
  const landlord = params.src === "landlord" || Boolean(params.pack);
  const initialPack: LandlordPack | undefined = params.pack;
  const initialService: ServiceKey = isService(params.service)
    ? canonicalService(params.service)
    : initialPack
      ? packService(initialPack)
      : "junk-removal";
  const initialSizes = landlord
    ? sizesForPack(initialPack ?? "turns")
    : listedSizesFor(initialService);
  const wantedSize = landlord
    ? params.size
    : canonicalSize(initialService, params.size || "");
  const initialSize =
    initialSizes.find((s) => s.value === wantedSize)?.value ??
    (initialPack ? packDefaultSize(initialPack) : initialSizes[0]?.value ?? "single");

  const [pack, setPack] = useState<LandlordPack | undefined>(
    initialPack ?? (landlord ? "turns" : undefined),
  );
  const [stops, setStops] = useState(params.stops ?? (landlord ? 2 : 1));
  const [service, setService] = useState<ServiceKey>(initialService);
  const [size, setSize] = useState(initialSize);
  const [lotSqFt, setLotSqFt] = useState(params.lotSqFt ?? 0);
  const [day, setDay] = useState("");
  const [asap, setAsap] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      role: "assistant",
      content: landlord ? landlordGreeting(initialPack, params.stops) : GREETING,
    },
  ]);
  const [draft, setDraft] = useState("");
  const [hearing, setHearing] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState<{ day: string; code: string } | null>(null);
  const [fillKey, setFillKey] = useState(0);
  const [showAllSizes, setShowAllSizes] = useState(false);
  const [extras, setExtras] = useState<string[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recRef = useRef<SpeechRecognition | null>(null);
  const logRef = useRef<HTMLOListElement | null>(null);
  const { user } = useCurrentUserState();

  useEffect(() => {
    if (!params.held) return;
    setLocked({
      day: params.when || "",
      code: params.code || (params.job ? `#${params.job}` : ""),
    });
  }, [params.held, params.when, params.code, params.job]);

  useEffect(() => {
    if (params.cancelled) setError("Card not charged. The day isn't held until the deposit clears.");
  }, [params.cancelled]);

  useEffect(() => {
    if (!landlord) {
      setExtras([]);
      return;
    }
    const n = Math.max(0, stops - 1);
    setExtras((cur) => Array.from({ length: n }, (_, i) => cur[i] ?? ""));
  }, [landlord, stops]);

  useEffect(() => {
    return () => {
      recRef.current?.stop();
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const sizedAll = landlord ? sizesForPack(pack ?? "turns") : listedSizesFor(service);
  const featured = landlord ? sizedAll : featuredSizesFor(service);
  const sized =
    landlord || showAllSizes || !featured.some((s) => s.value === size)
      ? sizedAll
      : featured;
  const currentSize = sized.find((s) => s.value === size)?.value ?? sized[0]?.value ?? size;
  const priced = useMemo(
    () =>
      estimate({
        service: pack ? packService(pack) : service,
        size: currentSize,
        addOns: [],
        pack,
        stops: landlord ? stops : 1,
        lotSqFt: service === "leaf-cleanup" || pack === "leaves" || pack === "combo" ? lotSqFt : 0,
        earlyBird: isPromoActive(),
      }),
    [service, currentSize, pack, stops, landlord, lotSqFt],
  );

  function leadSnap(): ShopLead {
    return {
      service: pack ? packService(pack) : service,
      size: currentSize,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      email: user?.primaryEmail || undefined,
      day: asap ? undefined : day,
      asap,
      pack,
      stops: landlord ? stops : undefined,
      desk: landlord ? "landlord" : undefined,
    };
  }

  async function say(text: string) {
    if (!live) return;
    setSpeaking(true);
    const spoken = await speakShop({ data: { text } }).catch(() => ({ audio: null }));
    if (spoken.audio) {
      const audio = new Audio(spoken.audio);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play().catch(() => resolve());
      });
    } else if (typeof window !== "undefined" && window.speechSynthesis) {
      await new Promise<void>((resolve) => {
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.02;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        window.speechSynthesis.speak(u);
      });
    }
    setSpeaking(false);
  }

  function applyLead(next: ShopLead | undefined) {
    if (!next) return;
    if (next.service && isService(next.service)) {
      const s = canonicalService(next.service);
      setService(s);
      if (next.size) setSize(next.size);
    } else if (next.size) {
      setSize(next.size);
    }
    if (next.name) setName(next.name);
    if (next.phone) setPhone(next.phone);
    if (next.address) setAddress(next.address);
    if (next.pack) {
      setPack(next.pack);
      setService(packService(next.pack));
    }
    if (next.stops) setStops(clampStops(next.stops));
    if (typeof next.asap === "boolean") setAsap(next.asap);
    if (next.day) setDay(next.day);
    if (next.booked && next.code && (next.bookedDay || next.day)) {
      finish(next.bookedDay || next.day || "", next.code, next);
    }
  }

  function finish(lockedDay: string, code: string, snap?: ShopLead) {
    setLocked({ day: lockedDay, code });
    setFillKey((n) => n + 1);
    saveLastBooking({
      name: (snap?.name ?? name).trim(),
      phone: (snap?.phone ?? phone).trim(),
      address: (snap?.address ?? address).trim(),
      service: snap?.service ?? service,
      size: snap?.size ?? currentSize,
      at: new Date().toISOString(),
    });
  }

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || thinking || locked) return;
    const next: ChatTurn[] = [...turns, { role: "user", content: clean }];
    setTurns(next);
    setDraft("");
    setLive(true);
    setThinking(true);
    const reply = await talkShop({
      data: { turns: next, lead: leadSnap() },
    }).catch(() => ({ text: "Line crackled. Say that again?", lead: leadSnap() }));
    setThinking(false);
    const said = reply.text || "Say that again?";
    applyLead(reply.lead);
    setTurns([...next, { role: "assistant", content: said }]);
    await say(said);
  }

  function listen() {
    const SR =
      typeof window !== "undefined"
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : undefined;
    if (!SR) return;
    recRef.current?.stop();
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const piece = [...e.results].map((r) => r[0].transcript).join(" ");
      setDraft(piece);
      if (e.results[e.results.length - 1]?.isFinal) {
        setHearing(false);
        send(piece);
      }
    };
    rec.onend = () => setHearing(false);
    recRef.current = rec;
    setLive(true);
    setHearing(true);
    rec.start();
  }

  async function lockDay() {
    setError("");
    if (name.trim().length < 2) {
      setError("Name on the job.");
      return;
    }
    if (!isUsPhone(phone)) {
      setError("Ten-digit phone so we can text the morning of.");
      return;
    }
    if (address.trim().length < 5) {
      setError("Street address for the stop.");
      return;
    }
    if (landlord && stops > 1 && extras.filter((a) => a.trim().length >= 5).length < stops - 1) {
      setError("Street for each stop this week.");
      return;
    }
    setBusy(true);
    const paid = await lockWithDeposit({
      data: {
        name: name.trim(),
        phone,
        address: address.trim(),
        extraAddresses: extras.map((a) => a.trim()).filter(Boolean),
        email: user?.primaryEmail || "",
        service: pack ? packService(pack) : service,
        jobSize: currentSize,
        preferredDate: day,
        asap: asap || !day,
        notes: landlord ? `Landlord desk · ${stops} ${pack ?? "stops"}` : "Shop line",
        estimateLow: priced.range?.low,
        estimateHigh: priced.range?.high,
        pack,
        stops: landlord ? stops : 1,
      },
    }).catch((err: unknown) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : "Couldn't open checkout.",
    }));
    setBusy(false);
    if (!paid || !("ok" in paid) || !paid.ok) {
      setError("error" in paid ? String(paid.error) : "Couldn't open checkout.");
      return;
    }
    if ("url" in paid && paid.url) {
      window.location.href = paid.url;
      return;
    }
  }

  if (locked) {
    return (
      <div className="relative z-10 min-h-dvh bg-bg text-fg">
        <SiteHeader />
        <main id="main" className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="kicker">On the truck</p>
          <h1 className="mt-3 font-display text-5xl leading-none">You're booked.</h1>
          <p className="mt-4 text-base text-muted">
            {locked.day ? `${formatDayLong(locked.day)}. ` : null}
            {priced.range ? `${formatRange(priced.range)} on file. ` : null}
            Job {locked.code}. Deposit is on the card and comes off the invoice. We'll text{" "}
            {formatPhone(phone) || "the number you gave"}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/status"
              className="btn-press inline-flex h-12 items-center rounded-full bg-fg px-6 text-sm font-medium text-ink hover:bg-gold"
            >
              Your hauls
            </Link>
            {!user ? (
              <Link
                to="/login"
                className="btn-press inline-flex h-12 items-center rounded-full border border-border px-6 text-sm text-fg"
              >
                Save on an account
              </Link>
            ) : null}
            <a
              href={`tel:${PHONE.replaceAll("-", "")}`}
              className="btn-press inline-flex h-12 items-center rounded-full border border-border px-6 text-sm text-fg"
            >
              {PHONE}
            </a>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="page-home relative z-10 min-h-dvh bg-bg text-fg">
      <SiteHeader />
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 lg:py-12">
        <p className="kicker">{landlord ? "Landlord desk" : "Book"}</p>
        <h1 className="mt-2 font-display text-4xl leading-none sm:text-5xl">
          {landlord ? "Book the stack." : "Lock a day."}
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted">
          {landlord
            ? "Turns, leaves, or both. First stop full rate. Extra stops this week at route rate."
            : "What it is, how big, which day. Then we hold it."}
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="card-green rounded-3xl p-5 sm:p-6">
            {landlord ? (
              <>
                <fieldset>
                  <legend className="text-xs font-medium text-muted">Owner pack</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {LANDLORD_PACKS.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        aria-pressed={pack === p.value}
                        onClick={() => {
                          setPack(p.value);
                          setService(packService(p.value));
                          const next = sizesForPack(p.value);
                          if (!next.some((x) => x.value === size)) setSize(packDefaultSize(p.value));
                        }}
                        className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                          pack === p.value
                            ? "bg-gold text-ink"
                            : "border border-border text-fg hover:bg-fg/8"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="mt-4">
                  <legend className="text-xs font-medium text-muted">
                    {pack === "leaves"
                      ? "Yards this week"
                      : pack === "combo"
                        ? "Addresses this week"
                        : "Units this week"}
                  </legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {STOP_COUNTS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={stops === c}
                        onClick={() => setStops(c)}
                        className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                          stops === c
                            ? "bg-gold text-ink"
                            : "border border-border text-fg hover:bg-fg/8"
                        }`}
                      >
                        {c === 6 ? "6+" : c}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </>
            ) : (
            <fieldset>
              <legend className="text-xs font-medium text-muted">What we're hauling</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {SERVICES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={service === s.value}
                    onClick={() => {
                      setService(s.value);
                      setShowAllSizes(false);
                      const next = featuredSizesFor(s.value);
                      if (!next.some((x) => x.value === size)) setSize(next[0]?.value ?? "");
                    }}
                    className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
                      service === s.value
                        ? "bg-gold text-ink"
                        : "border border-border text-fg hover:bg-fg/8"
                    }`}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            </fieldset>
            )}

            <fieldset className="mt-4">
              <legend className="text-xs font-medium text-muted">{landlord ? "First stop" : "Size"}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {sized.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={currentSize === s.value}
                    onClick={() => {
                      setSize(s.value);
                      setLotSqFt(0);
                    }}
                    className={`btn-press inline-flex min-h-11 items-center rounded-full px-3 text-sm ${
                      currentSize === s.value
                        ? "bg-gold text-ink"
                        : "border border-border text-fg hover:bg-fg/8"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {!landlord && sizedAll.length > featured.length ? (
                <button
                  type="button"
                  onClick={() => setShowAllSizes((v) => !v)}
                  className="mt-3 text-xs text-muted underline-offset-4 hover:text-gold hover:underline"
                >
                  {showAllSizes ? "Fewer sizes" : "More sizes"}
                </button>
              ) : null}
            </fieldset>

            <div className="mt-6">
              <DateField
                service={pack ? packService(pack) : service}
                size={currentSize}
                day={day}
                asap={asap}
                refreshKey={fillKey}
                onChange={(next) => {
                  setDay(next.day);
                  setAsap(next.asap);
                }}
              />
            </div>

            <details className="mt-6 rounded-2xl border border-border/80 p-4">
              <summary className="cursor-pointer text-sm text-fg">Photos or lot size</summary>
              {service === "leaf-cleanup" || pack === "leaves" || pack === "combo" ? (
                <LotSizeField value={lotSqFt} onChange={setLotSqFt} />
              ) : null}
              <PhotoQuote
                service={pack ? packService(pack) : service}
                pack={pack}
                stops={landlord ? stops : 1}
                lotSqFt={lotSqFt}
                onApply={({ size: next, lotSqFt: measured }) => {
                  setSize(landlord ? next : canonicalSize(service, next));
                  if (measured) setLotSqFt(measured);
                }}
              />
            </details>

            {priced.range ? (
              <p className="mt-4 font-display text-3xl leading-none text-gold tabular-nums">
                {formatRange(priced.range)}
              </p>
            ) : null}
            {landlord && priced.deposit ? (
              <p className="mt-2 text-sm text-muted">
                ${priced.deposit} deposit holds the first day
                {stops > 1 ? ` · ${stops} stops this week` : ""}.
              </p>
            ) : null}

            <div className="mt-5 grid gap-3">
              <label className="text-xs font-medium text-muted">
                Name
                <input
                  className="field mt-1 h-12"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-muted">
                Phone
                <input
                  className="field mt-1 h-12"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="text-xs font-medium text-muted">
                Street address{landlord && stops > 1 ? " — first stop" : ""}
                <input
                  className="field mt-1 h-12"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              {landlord
                ? extras.map((line, i) => (
                    <label key={i} className="text-xs font-medium text-muted">
                      Stop {i + 2}
                      <input
                        className="field mt-1 h-12"
                        value={line}
                        onChange={(e) =>
                          setExtras((cur) => cur.map((x, j) => (j === i ? e.target.value : x)))
                        }
                        placeholder="Street, city"
                      />
                    </label>
                  ))
                : null}
            </div>

            {error ? <p className="mt-3 text-sm text-gold">{error}</p> : null}

            <button
              type="button"
              onClick={lockDay}
              disabled={busy}
              className="btn-press mt-5 h-14 w-full rounded-full bg-fg text-base font-medium text-ink hover:bg-gold disabled:opacity-60"
            >
              {busy
                ? "Opening card…"
                : `Pay $${landlord ? landlordDeposit(stops, pack ?? "turns") : 50} to hold`}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Prefer a form?{" "}
              <Link to="/book" className="text-gold hover:underline">
                Use the form
              </Link>
            </p>
          </section>

          <section className="flex min-h-[28rem] flex-col">
            <p className="kicker">
              {speaking
                ? "Shop talking"
                : hearing
                  ? "Listening"
                  : thinking
                    ? "Checking the board"
                    : live
                      ? "Connected"
                      : "Talk it through"}
            </p>
            <ol
              ref={logRef}
              className="mt-4 max-h-[22rem] flex-1 space-y-3 overflow-y-auto pr-1 text-sm"
              aria-live="polite"
            >
              {turns.map((t, i) => (
                <li key={`${t.role}-${i}`} className={t.role === "assistant" ? "text-gold" : "text-fg"}>
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    {t.role === "assistant" ? "Shop" : "You"}
                  </span>
                  <p>{t.content}</p>
                </li>
              ))}
              {thinking ? <li className="text-muted">Checking the board…</li> : null}
            </ol>

            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={landlord ? "3 units on University, ASAP…" : "Couch, 123 Main, ASAP…"}
                className="field h-12"
                disabled={thinking || speaking}
                aria-label="Message the shop"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={thinking || speaking || !draft.trim()}
                  className="btn-press inline-flex h-12 flex-1 items-center justify-center rounded-full bg-gold text-sm font-medium text-ink disabled:opacity-50"
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={listen}
                  disabled={thinking || speaking}
                  className={`btn-press inline-flex h-12 items-center justify-center gap-2 rounded-full px-4 text-sm ${
                    hearing ? "bg-gold text-ink" : "border border-border text-fg"
                  }`}
                >
                  <Mic className="size-4" />
                  {hearing ? "Listening" : "Talk"}
                </button>
                {live ? (
                  <button
                    type="button"
                    onClick={() => {
                      recRef.current?.stop();
                      audioRef.current?.pause();
                      window.speechSynthesis?.cancel();
                      setLive(false);
                      setHearing(false);
                      setSpeaking(false);
                    }}
                    className="btn-press grid size-12 place-items-center rounded-full bg-mahogany text-paper"
                    aria-label="Stop talking"
                  >
                    <PhoneOff className="size-4" />
                  </button>
                ) : (
                  <span className="grid size-12 place-items-center rounded-full border border-border text-muted" aria-hidden>
                    <Phone className="size-4" />
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
      <StickyDock />
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition?: { new (): SpeechRecognition };
    webkitSpeechRecognition?: { new (): SpeechRecognition };
  }
  interface SpeechRecognition extends EventTarget {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    start: () => void;
    stop: () => void;
    onresult: ((ev: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
  }
  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }
}
