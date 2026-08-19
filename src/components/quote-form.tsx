import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { estimateJob, submitBooking } from "@/lib/bookings";

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

export function QuoteForm({ remaining }: { remaining: number }) {
  const [done, setDone] = useState<{
    earlyBird: boolean;
    remaining: number;
  } | null>(null);
  const [estimate, setEstimate] = useState<string | null>(null);
  const [estimating, setEstimating] = useState(false);
  const [photo, setPhoto] = useState<string>("");

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
    },
  });

  async function onSubmit(values: Values) {
    try {
      const result = await submitBooking({ data: values });
      setDone({ earlyBird: result.earlyBird, remaining: result.remaining });
      toast.success("Request received — we'll text you back.");
    } catch {
      toast.error("Could not send. Call or text 218-779-2553.");
    }
  }

  async function onEstimate() {
    setEstimating(true);
    setEstimate(null);
    try {
      const values = form.getValues();
      const result = await estimateJob({
        data: {
          service: values.service,
          notes: values.notes,
          photoDataUrl: photo,
        },
      });
      if (result.ok) setEstimate(result.text);
      else toast.error(result.error);
    } catch {
      toast.error("Estimate unavailable — just book and we'll quote.");
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
            ? `$50 off is locked on this first cleanup. We'll text to confirm and collect a $50 date-hold deposit.`
            : `Request received. Early-bird slots are gone, but we'll still quote fast.`}
        </p>
        <p className="mt-4 text-sm text-gold">
          {done.remaining} early-bird spots left after yours
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
        {remaining > 0
          ? `${remaining} of 25 early-bird $50-off spots still open.`
          : "Early-bird is full — still booking at regular rates."}
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
        <label className="text-sm sm:col-span-2">
          Address
          <input
            className={field}
            autoComplete="street-address"
            {...form.register("address")}
          />
          {err.address ? (
            <span className="mt-1 block text-xs text-gold">
              {err.address.message}
            </span>
          ) : null}
        </label>
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
        <label className="text-sm sm:col-span-2">
          Notes
          <textarea
            className={`${field} min-h-24`}
            placeholder="How many bags, what's in the pile, stairs, etc."
            {...form.register("notes")}
          />
        </label>
        <label className="text-sm sm:col-span-2">
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

      {estimate ? (
        <p className="mt-4 rounded-2xl border border-gold/30 bg-bg-deep/40 p-4 text-sm">
          {estimate}
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
          Photo estimate
        </Button>
      </div>
      <p className="mt-3 text-xs text-muted">
        $50 deposit holds the date and comes off your invoice. We'll text to
        confirm before we collect it.
      </p>
    </form>
  );
}
