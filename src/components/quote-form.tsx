import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressField } from "@/components/address-field";
import { estimateJob, submitBooking } from "@/lib/bookings";
import {
  addOnsFor,
  BLOCK_TIERS,
  estimate as computeEstimate,
  formatRange,
  PROMO_DEADLINE_LABEL,
  refusedItemsIn,
  sizeOptionsFor,
  type AddOnKey,
  type ServiceKey,
} from "@/lib/pricebook";
import type { AreaVerdict } from "@/lib/service-area";

const schema = z.object({
  name: z.string().min(2, "Name please"),
  phone: z.string().min(7, "Phone please"),
  email: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: "Email looks off",
    }),
  address: z.string().min(5, "Address please"),
  service: z.enum([
    "leaf-cleanup",
    "junk-removal",
    "furniture-appliances",
    "other",
  ]),
  notes: z.string().optional(),
  preferredDate: z.string().optional(),
  urgency: z.enum(["before-vacuum", "this-week", "flexible"]),
  neighborOf: z.string().optional(),
  households: z.number().int().min(1).max(6).optional(),
  otherDescription: z.string().optional(),
}).refine(
  // "Something else" is the one service the estimator cannot price, so the
  // description IS the request. Without it the owner receives a booking that
  // says only "something else" and has to phone back to learn what the job is
  // — which is the callback this whole form exists to avoid.
  (v) => v.service !== "other" || Boolean(v.otherDescription && v.otherDescription.trim().length >= 5),
  {
    message: "Tell us what you need done and we'll price it the same day",
    path: ["otherDescription"],
  },
).refine(
  // The block credit is a promise to route two houses on one street the same
  // day. Without the neighbour's address that is unroutable: the owner cannot
  // confirm the houses are actually on the same street, cannot plan the trip
  // the discount is paying for, and cannot tell the neighbour they are booked.
  // So it is required exactly when a block credit is being claimed, and stays
  // optional otherwise — asking a solo booker for a neighbour's address would
  // be a pointless field.
  (v) => (v.households ?? 1) < 2 || Boolean(v.neighborOf && v.neighborOf.trim().length >= 5),
  {
    message: "We need your neighbor's address to put you on the same day",
    path: ["neighborOf"],
  },
);

type Values = z.infer<typeof schema>;

const SERVICES = [
  { value: "leaf-cleanup", label: "Fall leaf cleanup" },
  { value: "junk-removal", label: "Junk removal" },
  { value: "furniture-appliances", label: "Furniture & appliances" },
  { value: "other", label: "Something else" },
] as const;

// Labels kept short on purpose: at the form's column width a 3-up grid gives
// each card ~127px of text, and the old "Before city vacuum" / "Mid-Oct to
// mid-Nov rush" pair overflowed that and wrapped ragged. The dropped detail
// moves to one shared hint line under the whole group instead of being said
// three times.
const URGENCY = [
  { value: "before-vacuum", label: "Before vacuum" },
  { value: "this-week", label: "This week" },
  { value: "flexible", label: "Flexible" },
] as const;

export type PromoStatus = {
  active: boolean;
  percent: number;
  cap: number;
  deadlineLabel: string;
};

const labelClass =
  "block text-xs font-semibold uppercase tracking-[0.12em] text-fg";
const requiredMark = (
  <span aria-hidden="true" className="text-gold">
    {" "}
    *
  </span>
);

function FieldError({ message }: { message: string }) {
  return (
    <span className="mt-1.5 flex items-start gap-1.5 text-xs text-gold">
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </span>
  );
}

/**
 * `initial*` are seeded from the hero estimate card's URL search params (see
 * src/routes/book.tsx) so a visitor who already picked their service, yard
 * size and add-ons on the home page does not pick them a second time here.
 * They are plain initial state, not controlled props — the form owns them
 * once mounted.
 */
export function QuoteForm({
  promo,
  initialService,
  initialSize,
  initialAddOns,
}: {
  promo: PromoStatus;
  initialService?: ServiceKey;
  initialSize?: string;
  initialAddOns?: AddOnKey[];
}) {
  const [done, setDone] = useState<{ earlyBird: boolean } | null>(null);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [photo, setPhoto] = useState<string>("");
  const [size, setSize] = useState<string>(initialSize ?? "medium");
  // Array.isArray, not `?? []`: this value originates in a URL, and a
  // hand-edited ?addons=bogus arrives as a string. book.tsx sanitises it, but
  // a second guard here is what keeps a bad link from white-screening the one
  // page that takes bookings.
  const [addOns, setAddOns] = useState<AddOnKey[]>(
    Array.isArray(initialAddOns) ? initialAddOns : [],
  );
  const [geo, setGeo] = useState<{
    lat: number;
    lon: number;
    verdict: AreaVerdict;
  } | null>(null);

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      address: "",
      service: initialService ?? "leaf-cleanup",
      notes: "",
      preferredDate: "",
      urgency: "before-vacuum",
      neighborOf: "",
      households: 1,
      otherDescription: "",
    },
  });

  const service = form.watch("service") as ServiceKey;
  const notes = form.watch("notes") ?? "";
  const address = form.watch("address") ?? "";
  const households = Number(form.watch("households") ?? 1) || 1;
  const urgency = form.watch("urgency");

  const sizes = useMemo(() => sizeOptionsFor(service), [service]);
  const availableAddOns = useMemo(() => addOnsFor(service), [service]);

  // Keep the size and add-ons valid whenever the service changes.
  const activeSize = sizes.some((s) => s.value === size) ? size : sizes[0].value;
  const activeAddOns = addOns.filter((k) =>
    availableAddOns.some((a) => a.key === k),
  );

  const quote = useMemo(
    () =>
      computeEstimate({
        service,
        size: activeSize,
        addOns: activeAddOns,
        earlyBird: promo.active,
        notes,
        households,
        urgency,
      }),
    [service, activeSize, activeAddOns, promo.active, notes, households, urgency],
  );

  const refused = refusedItemsIn(notes);

  async function onSubmit(values: Values) {
    try {
      const described =
        values.service === "other" && values.otherDescription
          ? [values.otherDescription.trim(), values.notes?.trim()]
              .filter(Boolean)
              .join("\n\n")
          : values.notes;

      const result = await submitBooking({
        data: {
          ...values,
          notes: described,
          jobSize: activeSize,
          addOns: activeAddOns,
          households,
          estimateLow: quote.range?.low,
          estimateHigh: quote.range?.high,
          lat: geo?.lat,
          lon: geo?.lon,
          areaTier: geo?.verdict.tier,
        },
      });
      setDone({ earlyBird: result.earlyBird });
      toast.success("Request received — we'll text you back.");
    } catch {
      toast.error("Could not send. Call or text 218-779-2553.");
    }
  }

  async function onEstimate() {
    setEstimating(true);
    setAiEstimate(null);
    try {
      const values = form.getValues();
      const result = await estimateJob({
        data: {
          service: values.service,
          notes: values.notes,
          photoDataUrl: photo,
        },
      });
      if (result.ok) setAiEstimate(result.text);
      else toast.error(result.error);
    } catch {
      toast.error("Estimate unavailable — the range above still stands.");
    } finally {
      setEstimating(false);
    }
  }

  if (done) {
    return (
      <div className="card-green rounded-2xl p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-gold" />
        <h3 className="mt-4 font-display text-3xl">You're on the list</h3>
        <p className="mt-2 text-muted">
          {done.earlyBird
            ? `Your ${Math.round(promo.percent * 100)}% off (up to $${promo.cap}) is locked in. We'll text to confirm and collect the $50 date-hold deposit.`
            : `Request received — the ${PROMO_DEADLINE_LABEL} rate has closed, but we'll still text back with a fast, straight quote.`}
        </p>
        <a
          className="mt-6 inline-flex text-sm underline decoration-gold/50 underline-offset-4"
          href="sms:2187792553"
        >
          Text a photo of the pile now
        </a>
      </div>
    );
  }

  const field =
    "mt-2 w-full rounded-xl border border-border bg-bg-deep/50 px-4 py-3 text-base text-fg outline-none placeholder:text-muted/70 focus:border-gold";
  const err = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="card-green rounded-2xl p-6 sm:p-8"
    >
      <p className="kicker">Free estimate</p>
      <h3 className="mt-2 font-display text-3xl">Hold your date</h3>
      <p className="mt-2 text-sm text-muted">
        {promo.active
          ? `Book by ${promo.deadlineLabel} for ${Math.round(promo.percent * 100)}% off, up to $${promo.cap}.`
          : `The ${PROMO_DEADLINE_LABEL} rate has closed — still booking at regular rates.`}
      </p>

      <div className="mt-8 grid gap-x-4 gap-y-5 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>Name{requiredMark}</span>
          <input
            className={field}
            autoComplete="name"
            aria-required="true"
            {...form.register("name")}
          />
          {err.name ? <FieldError message={err.name.message!} /> : null}
        </label>
        <label className="block">
          <span className={labelClass}>Phone{requiredMark}</span>
          <input
            className={field}
            type="tel"
            autoComplete="tel"
            aria-required="true"
            {...form.register("phone")}
          />
          {err.phone ? <FieldError message={err.phone.message!} /> : null}
        </label>
        <label className="block">
          <span className={labelClass}>Email (optional)</span>
          <input
            className={field}
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {err.email ? <FieldError message={err.email.message!} /> : null}
        </label>
        <label className="block">
          <span className={labelClass}>Preferred date (optional)</span>
          <input
            className={field}
            type="date"
            {...form.register("preferredDate")}
          />
        </label>

        <div className="sm:col-span-2">
          <label htmlFor="address" className={labelClass}>
            Address{requiredMark}
          </label>
          <AddressField
            id="address"
            className={field}
            value={address}
            onChange={(v) =>
              form.setValue("address", v, { shouldValidate: true })
            }
            onResolve={setGeo}
            error={err.address?.message}
          />
        </div>

        <label className="block sm:col-span-2">
          <span className={labelClass}>Service{requiredMark}</span>
          <select
            className={field}
            aria-required="true"
            {...form.register("service")}
          >
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>

        {/* Sits immediately under the picker, not down with the optional
            details, because when nothing in the list fits this field IS the
            booking — everything below it is secondary. */}
        {service === "other" ? (
          <label className="block sm:col-span-2">
            <span className={labelClass}>What do you need done?{requiredMark}</span>
            <textarea
              className={`${field} min-h-20`}
              placeholder="Tell us what it is — a shed to tear down, a hot tub, whatever it is"
              aria-required="true"
              {...form.register("otherDescription")}
            />
            {err.otherDescription ? (
              <FieldError message={err.otherDescription.message!} />
            ) : null}
            <span className="mt-1.5 block text-xs text-muted">
              We can't put a number on this one automatically, so we'll read it
              and text you a price the same day.
            </span>
          </label>
        ) : null}
      </div>

      {service !== "other" ? (
        <fieldset className="mt-10">
          <legend className={labelClass}>
            {service === "leaf-cleanup" ? "How big is the yard?" : "How much is there?"}
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sizes.map((s) => (
              <label
                key={s.value}
                className={`btn-press cursor-pointer rounded-xl border px-4 py-3.5 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                  activeSize === s.value
                    ? "border-gold bg-bg-deep/60"
                    : "border-border bg-bg-deep/30 hover:border-gold/50"
                }`}
              >
                <input
                  type="radio"
                  name="job-size"
                  className="sr-only"
                  value={s.value}
                  checked={activeSize === s.value}
                  onChange={() => setSize(s.value)}
                />
                <span className="block font-medium">{s.label}</span>
                <span className="block text-xs text-muted">{s.hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {service !== "other" && availableAddOns.length > 0 ? (
        <fieldset className="mt-8">
          <legend className={labelClass}>Anything else we should know?</legend>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {availableAddOns.map((a) => {
              const on = activeAddOns.includes(a.key);
              return (
                <label
                  key={a.key}
                  title={a.hint}
                  className={`btn-press inline-flex min-h-11 cursor-pointer items-center rounded-full border px-4 text-sm transition has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold ${
                    on
                      ? "border-gold bg-gold/15 text-fg"
                      : "border-border text-muted hover:border-gold/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={on}
                    onChange={() =>
                      setAddOns((prev) =>
                        prev.includes(a.key)
                          ? prev.filter((k) => k !== a.key)
                          : [...prev, a.key],
                      )
                    }
                  />
                  {a.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="mt-8">
        <legend className={labelClass}>When do you need it?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {URGENCY.map((u) => (
            <label
              key={u.value}
              className="btn-press cursor-pointer rounded-xl border border-border bg-bg-deep/30 px-2 py-3 text-center text-sm transition has-checked:border-gold has-checked:bg-bg-deep/60 hover:border-gold/50 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold"
            >
              <input
                type="radio"
                className="sr-only"
                value={u.value}
                {...form.register("urgency")}
              />
              <span className="block font-medium">{u.label}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gold">
          City vacuum runs mid-Oct to mid-Nov.
        </p>
      </fieldset>

      <div className="mt-10 grid gap-5">
        <label className="block">
          <span className={labelClass}>Notes (optional)</span>
          <textarea
            className={`${field} min-h-24`}
            placeholder="How many bags, what's in the pile, stairs, etc."
            {...form.register("notes")}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Houses on your street, same day</span>
          <select
            className={field}
            {...form.register("households", { valueAsNumber: true })}
          >
            <option value={1}>Just mine</option>
            <option value={2}>2 houses — ${BLOCK_TIERS[0].credit} off each</option>
            <option value={3}>3 or more — ${BLOCK_TIERS[1].credit} off each</option>
          </select>
          <span className="mt-1.5 block text-xs text-muted">
            One trip down your street costs us less than two. You get whichever
            is bigger — this or the {PROMO_DEADLINE_LABEL} rate — never both.
          </span>
        </label>
        <label className="block">
          <span className={labelClass}>
            Neighbor's address
            {households >= 2 ? requiredMark : " (optional)"}
          </span>
          <input
            className={field}
            placeholder={
              households >= 2
                ? "Street address of the other house"
                : "So we can put you on the same day"
            }
            aria-required={households >= 2}
            {...form.register("neighborOf")}
          />
          {err.neighborOf ? (
            <FieldError message={err.neighborOf.message!} />
          ) : null}
        </label>
        <label className="block">
          <span className={labelClass}>Photo of the pile (optional)</span>
          <input
            className={`${field} file:mr-3 file:rounded-full file:border file:border-border file:bg-bg-deep file:px-4 file:py-1.5 file:text-sm file:text-fg`}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return setPhoto("");
              const reader = new FileReader();
              reader.onload = () => setPhoto(String(reader.result ?? ""));
              reader.readAsDataURL(file);
            }}
          />
          {photo ? (
            <button
              type="button"
              onClick={onEstimate}
              disabled={estimating}
              className="btn-press mt-3 inline-flex items-center gap-2 text-sm underline decoration-gold/50 underline-offset-4 disabled:opacity-50"
            >
              {estimating ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Check this photo
            </button>
          ) : null}
        </label>
      </div>

      {aiEstimate ? (
        <p className="mt-4 rounded-2xl border border-border bg-bg-deep/40 p-4 text-sm">
          {aiEstimate}
        </p>
      ) : null}

      {/* Instant number. Computed on the spot from the pricebook — no waiting,
          no API key, same answer every time. Sits last, right above the
          button it exists to motivate. */}
      <div className="card-estimate mt-10 rounded-2xl p-6 sm:p-7">
        <p className="kicker">Your estimate</p>
        {quote.range ? (
          <>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-5xl font-bold leading-none tracking-tight">
                {formatRange(quote.range)}
              </span>
              {quote.discount > 0 && quote.beforeDiscount ? (
                <span className="text-base text-print/65 line-through">
                  {formatRange(quote.beforeDiscount)}
                </span>
              ) : null}
            </p>
            {quote.discount > 0 ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mahogany px-3.5 py-1.5 text-sm font-semibold text-paper">
                You save up to ${quote.discount}
              </p>
            ) : null}
            <ul className="mt-4 space-y-1.5 text-xs text-print/80">
              {quote.lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-4">
                  <span>{l.label}</span>
                  <span className="tabular-nums">{formatRange(l.range)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="mt-1.5 text-sm">
            Tell us what it is below and we'll price it the same day.
          </p>
        )}
        <div className="estimate-rule my-5" />
        <ul className="space-y-1.5 text-xs text-print/75">
          {quote.notes.map((n) => (
            <li key={n}>· {n}</li>
          ))}
        </ul>
      </div>

      {refused.length > 0 ? (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-gold" />
          <span>
            We can't take {refused.join(", ")}. Everything else in the pile is
            fine — leave those items out and we'll haul the rest.
          </span>
        </p>
      ) : null}

      <div className="mt-6">
        <Button
          type="submit"
          variant="cream"
          size="lg"
          className="h-14 w-full text-base font-semibold"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Request booking
          <ArrowRight className="size-4" />
        </Button>
      </div>
      <p className="mt-3 text-sm leading-[1.5] text-muted">
        $50 deposit holds the date. We'll text to confirm before we collect
        it.
      </p>
    </form>
  );
}
