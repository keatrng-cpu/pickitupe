import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AddressField } from "@/components/address-field";
import { estimateJob, submitBooking } from "@/lib/bookings";
import {
  addOnsFor,
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
    "garage-basement",
    "furniture-appliances",
    "single-item",
    "other",
  ]),
  notes: z.string().optional(),
  preferredDate: z.string().optional(),
  urgency: z.enum(["before-vacuum", "this-week", "flexible"]),
  neighborOf: z.string().optional(),
});

type Values = z.infer<typeof schema>;

const SERVICES = [
  { value: "leaf-cleanup", label: "Fall leaf cleanup" },
  { value: "junk-removal", label: "Junk removal" },
  { value: "garage-basement", label: "Garage / basement" },
  { value: "furniture-appliances", label: "Furniture & appliances" },
  { value: "single-item", label: "Single-item pickup" },
  { value: "other", label: "Something else" },
] as const;

const URGENCY = [
  {
    value: "before-vacuum",
    label: "Before city vacuum",
    hint: "Mid-Oct to mid-Nov rush",
  },
  { value: "this-week", label: "This week", hint: "Soon as you can" },
  { value: "flexible", label: "I'm flexible", hint: "Whenever you're nearby" },
] as const;

export type PromoStatus = {
  active: boolean;
  percent: number;
  cap: number;
  deadlineLabel: string;
};

export function QuoteForm({ promo }: { promo: PromoStatus }) {
  const [done, setDone] = useState<{ earlyBird: boolean } | null>(null);
  const [aiEstimate, setAiEstimate] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [photo, setPhoto] = useState<string>("");
  const [size, setSize] = useState<string>("medium");
  const [addOns, setAddOns] = useState<AddOnKey[]>([]);
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
      service: "leaf-cleanup",
      notes: "",
      preferredDate: "",
      urgency: "before-vacuum",
      neighborOf: "",
    },
  });

  const service = form.watch("service") as ServiceKey;
  const notes = form.watch("notes") ?? "";
  const address = form.watch("address") ?? "";

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
      }),
    [service, activeSize, activeAddOns, promo.active, notes],
  );

  const refused = refusedItemsIn(notes);

  async function onSubmit(values: Values) {
    try {
      const result = await submitBooking({
        data: {
          ...values,
          jobSize: activeSize,
          addOns: activeAddOns,
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
      <div className="card-green rounded-3xl p-8 text-center">
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
    "mt-1.5 w-full rounded-xl border border-border bg-bg-deep/50 px-3 py-2.5 text-fg outline-none placeholder:text-muted/70 focus:border-gold";
  const err = form.formState.errors;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="card-green rounded-3xl p-6 sm:p-8"
    >
      <p className="text-xs tracking-[0.25em] text-gold">FREE ESTIMATE</p>
      <h3 className="mt-2 font-display text-3xl">Hold your date</h3>
      <p className="mt-2 text-sm text-muted">
        {promo.active
          ? `Book by ${promo.deadlineLabel} for ${Math.round(promo.percent * 100)}% off, up to $${promo.cap}.`
          : `The ${PROMO_DEADLINE_LABEL} rate has closed — still booking at regular rates.`}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Name
          <input
            className={field}
            autoComplete="name"
            {...form.register("name")}
          />
          {err.name ? (
            <span className="mt-1 block text-xs text-gold">{err.name.message}</span>
          ) : null}
        </label>
        <label className="text-sm">
          Phone
          <input
            className={field}
            type="tel"
            autoComplete="tel"
            {...form.register("phone")}
          />
          {err.phone ? (
            <span className="mt-1 block text-xs text-gold">{err.phone.message}</span>
          ) : null}
        </label>
        <label className="text-sm">
          Email (optional)
          <input
            className={field}
            type="email"
            autoComplete="email"
            {...form.register("email")}
          />
          {err.email ? (
            <span className="mt-1 block text-xs text-gold">{err.email.message}</span>
          ) : null}
        </label>
        <label className="text-sm">
          Preferred date
          <input
            className={field}
            type="date"
            {...form.register("preferredDate")}
          />
        </label>

        <div className="text-sm sm:col-span-2">
          Address
          <AddressField
            className={field}
            value={address}
            onChange={(v) =>
              form.setValue("address", v, { shouldValidate: true })
            }
            onResolve={setGeo}
            error={err.address?.message}
          />
        </div>

        <label className="text-sm sm:col-span-2">
          Service
          <select className={field} {...form.register("service")}>
            {SERVICES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {service !== "other" ? (
        <fieldset className="mt-5">
          <legend className="text-sm">
            {service === "leaf-cleanup" ? "How big is the yard?" : "How much is there?"}
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {sizes.map((s) => (
              <label
                key={s.value}
                className={`btn-press cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition ${
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
        <fieldset className="mt-5">
          <legend className="text-sm">Anything else we should know?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {availableAddOns.map((a) => {
              const on = activeAddOns.includes(a.key);
              return (
                <label
                  key={a.key}
                  title={a.hint}
                  className={`btn-press cursor-pointer rounded-full border px-3.5 py-1.5 text-xs transition ${
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

      <fieldset className="mt-5">
        <legend className="text-sm">When do you need it?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {URGENCY.map((u) => (
            <label
              key={u.value}
              className="btn-press cursor-pointer rounded-xl border border-border bg-bg-deep/30 px-3 py-2.5 text-sm transition has-checked:border-gold has-checked:bg-bg-deep/60 hover:border-gold/50"
            >
              <input
                type="radio"
                className="sr-only"
                value={u.value}
                {...form.register("urgency")}
              />
              <span className="block font-medium">{u.label}</span>
              <span className="block text-xs text-muted">{u.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Instant number. Computed on the spot from the pricebook — no waiting,
          no API key, same answer every time. */}
      <div className="card-estimate mt-6 rounded-2xl p-5">
        <p className="kicker">Your estimate</p>
        {quote.range ? (
          <>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-4xl leading-none tracking-tight">
                {formatRange(quote.range)}
              </span>
              {quote.discount > 0 && quote.beforeDiscount ? (
                <span className="text-base text-print/45 line-through">
                  {formatRange(quote.beforeDiscount)}
                </span>
              ) : null}
            </p>
            {quote.discount > 0 ? (
              <p className="mt-2 inline-flex rounded-full bg-mahogany px-3 py-1 text-xs font-medium text-paper">
                You save up to ${quote.discount}
              </p>
            ) : null}
            <div className="estimate-rule my-4" />
            <ul className="space-y-1.5 text-xs text-print/70">
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
        <div className="estimate-rule my-4" />
        <ul className="space-y-1.5 text-xs text-print/65">
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

      <div className="mt-5 grid gap-4">
        <label className="text-sm">
          Notes
          <textarea
            className={`${field} min-h-24`}
            placeholder="How many bags, what's in the pile, stairs, etc."
            {...form.register("notes")}
          />
        </label>
        <label className="text-sm">
          Neighbor booking with you? (optional)
          <input
            className={field}
            placeholder="Their address — you both get $25 off the same day"
            {...form.register("neighborOf")}
          />
        </label>
        <label className="text-sm">
          Photo of the pile (optional)
          <input
            className={`${field} file:mr-3 file:rounded-full file:border-0 file:bg-sioux file:px-3 file:py-1 file:text-fg`}
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
        </label>
      </div>

      {aiEstimate ? (
        <p className="mt-4 rounded-2xl border border-border bg-bg-deep/40 p-4 text-sm">
          {aiEstimate}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="submit" variant="cream" size="lg" className="flex-1">
          {form.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          Request booking
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onEstimate}
          disabled={estimating}
        >
          {estimating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Check my photo
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        $50 deposit holds the date and comes off your invoice. We'll text to
        confirm before we collect it. If the pile is bigger than described, we
        stop and re-quote — we never load first and bill later.
      </p>
    </form>
  );
}
