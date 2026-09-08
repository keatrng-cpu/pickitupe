import { Camera, Loader2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { assessJob, type RegionalComp } from "@/lib/assess-actions";
import {
  estimate,
  formatRange,
  isPromoActive,
  packService,
  type AddOnKey,
  type LandlordPack,
  type ServiceKey,
} from "@/lib/pricebook";

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("bad image"));
      el.src = url;
    });
    const max = 1280;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.72);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Props = {
  service: ServiceKey;
  pack?: LandlordPack;
  stops?: number;
  onApply: (next: { size: string; addOns: AddOnKey[] }) => void;
};

export function PhotoQuote({ service, pack, stops = 1, onApply }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    size: string | null;
    sizeLabel: string | null;
    addOns: AddOnKey[];
    reasoning: string;
    confidence: "high" | "medium" | "low";
    regional: RegionalComp | null;
    refused: string[];
  } | null>(null);

  const priced = useMemo(() => {
    if (!result?.size) return null;
    return estimate({
      service: pack ? packService(pack) : service,
      size: result.size,
      addOns: result.addOns,
      pack,
      stops,
      earlyBird: isPromoActive(),
    });
  }, [result, service, pack, stops]);

  async function addFiles(list: FileList | null) {
    if (!list?.length) return;
    const next = [...photos];
    for (const file of Array.from(list).slice(0, 3 - next.length)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        next.push(await shrink(file));
      } catch {
        /* skip */
      }
    }
    setPhotos(next.slice(0, 3));
    setResult(null);
    setError("");
  }

  async function run() {
    if (!photos.length) {
      setError("Add a photo of the pile or the yard.");
      return;
    }
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await assessJob({
        data: {
          service,
          pack,
          photos,
        },
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res);
      if (res.size) onApply({ size: res.size, addOns: res.addOns });
    } catch {
      setError("Couldn't size it up. Try again or text 701-213-3969.");
    } finally {
      setBusy(false);
    }
  }

  const under =
    priced?.range && result?.regional
      ? result.regional.low - priced.range.high
      : 0;

  return (
    <div className="mt-8 rounded-2xl border border-border/80 p-4 sm:p-5">
      <p className="kicker">Photos</p>
      <h3 className="mt-2 font-display text-2xl">Size it from the pile</h3>
      <p className="mt-2 text-sm text-muted">
        Drop a picture of the unit, the yard, or the curb pile. We read it
        against Grand Forks / Fargo averages, then the pricebook sets the
        number — the model never invents a dollar figure.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {photos.map((src, i) => (
          <div key={`${i}-${src.slice(-12)}`} className="relative size-20 overflow-hidden rounded-xl border border-border">
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={() => {
                setPhotos(photos.filter((_, n) => n !== i));
                setResult(null);
              }}
              className="btn-press absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-ink/80 text-fg"
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
        {photos.length < 3 ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-press grid size-20 place-items-center rounded-xl border border-dashed border-border text-muted hover:border-gold hover:text-gold"
          >
            <Camera className="size-5" />
            <span className="mt-1 text-[10px] uppercase tracking-wider">Add</span>
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => void run()}
        disabled={busy || !photos.length}
        className="btn-press mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink hover:bg-gold disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
        {busy ? "Reading the pile…" : "Price from photos"}
      </button>

      {error ? <p className="mt-3 text-sm text-gold">{error}</p> : null}

      {result ? (
        <div className="mt-5 border-t border-border/80 pt-4">
          {result.reasoning ? <p className="text-sm text-fg">{result.reasoning}</p> : null}
          {result.sizeLabel ? (
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-gold">
              Sized as {result.sizeLabel}
              {result.confidence === "low" ? " · low confidence" : ""}
            </p>
          ) : null}
          {priced?.range ? (
            <p className="mt-3 font-display text-3xl leading-none text-gold tabular-nums">
              {formatRange(priced.range)}
            </p>
          ) : null}
          {result.regional ? (
            <p className="mt-2 text-sm text-muted">
              Regional average — {result.regional.who}, {result.regional.what}:{" "}
              <span className="text-fg">{result.regional.price}</span>
              {under > 0 && priced?.range
                ? ` · you're about $${under} under the local high.`
                : "."}{" "}
              <span className="text-xs">({result.regional.source})</span>
            </p>
          ) : null}
          {result.refused.length ? (
            <p className="mt-2 text-sm text-gold">
              We can't take {result.refused.join(", ")}. Leave those out.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
