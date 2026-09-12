import { useRef, useState } from "react";
import { Camera, FileText, Loader2, Upload } from "lucide-react";
import { bookReceiptAnyway, scanReceipt, type ScanResult } from "@/lib/receipts";
import { prepareReceiptFile } from "@/lib/receipt-client";
import { categoryFor, PHASE_LABEL } from "@/lib/tax";
import { cn } from "@/lib/utils";
import { btnCls, ghostBtnCls, money } from "@/components/owner-shell";

/**
 * "Snap a receipt" — the one control the owner touches after every purchase.
 * Camera on a phone, file picker or drag-drop on a desktop; multiple files
 * queue up and scan one after another. Each result card says exactly what was
 * booked so a wrong category is caught on the spot, not in April.
 */
export function ReceiptDrop({ bookingId, onBooked, compact }: { bookingId?: number | null; onBooked?: () => void; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);
  const [queue, setQueue] = useState<{ name: string; state: "scanning" | "done"; result?: ScanResult }[]>([]);
  const [over, setOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    for (const file of Array.from(files)) {
      const idx = queue.length;
      setQueue((q) => [...q, { name: file.name || "photo", state: "scanning" }]);
      try {
        const prepared = await prepareReceiptFile(file);
        const result = await scanReceipt({ data: { dataUrl: prepared.dataUrl, bookingId: bookingId ?? null } });
        setQueue((q) => q.map((item, i) => (i === idx ? { ...item, state: "done", result } : item)));
        if (result.status === "booked" || result.status === "needs-review") onBooked?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Couldn't scan that one.";
        setQueue((q) => q.map((item, i) => (i === idx ? { ...item, state: "done", result: { status: "error", message } } : item)));
      }
    }
  }

  return (
    <section className={cn("rounded-3xl border border-gold/40 bg-bg-deep/40", compact ? "p-4" : "p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.25em] text-gold">SNAP A RECEIPT</p>
          <p className="mt-1 text-sm text-muted">
            Photo or PDF of any receipt, invoice or statement. It's read, categorized to a Schedule C line, tagged start-up / equipment / operating, and booked{bookingId ? " against this job" : ""}. Same receipt twice books nothing twice.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={btnCls} onClick={() => cameraRef.current?.click()}>
            <Camera className="mr-2 size-4" /> Take photo
          </button>
          <button type="button" className={ghostBtnCls} onClick={() => inputRef.current?.click()}>
            <Upload className="mr-2 size-4" /> Upload
          </button>
        </div>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />

      {!compact ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (e.dataTransfer.files?.length) void handleFiles(e.dataTransfer.files);
          }}
          className={cn(
            "mt-4 grid place-items-center rounded-2xl border border-dashed px-4 py-6 text-sm text-muted transition",
            over ? "border-gold bg-gold/10 text-fg" : "border-border",
          )}
        >
          Drop receipts here — several at once is fine
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-gold">{error}</p> : null}

      {queue.length ? (
        <ul className="mt-4 space-y-2">
          {queue.map((item, i) => (
            <li key={i} className="rounded-2xl bg-bg-deep/60 p-3 text-sm">
              {item.state === "scanning" ? (
                <p className="flex items-center gap-2 text-muted">
                  <Loader2 className="size-4 animate-spin" /> Reading {item.name}…
                </p>
              ) : item.result ? (
                <ResultCard result={item.result} onBooked={onBooked} bookingId={bookingId} />
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function ResultCard({ result, onBooked, bookingId }: { result: ScanResult; onBooked?: () => void; bookingId?: number | null }) {
  const [busy, setBusy] = useState(false);
  const [bookedAnyway, setBookedAnyway] = useState<number | null>(null);

  if (result.status === "error") return <p className="text-gold">{result.message}</p>;
  if (result.status === "not-a-receipt") return <p className="text-muted">{result.message}</p>;
  if (result.status === "duplicate") {
    return (
      <div>
        <p className="text-gold">{result.message}</p>
        {result.receiptId && result.extracted && !bookedAnyway ? (
          <button
            type="button"
            className={cn(ghostBtnCls, "mt-2 h-9")}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const r = await bookReceiptAnyway({ data: { receiptId: result.receiptId!, bookingId: bookingId ?? null } });
                setBookedAnyway(r.expenseId);
                onBooked?.();
              } finally {
                setBusy(false);
              }
            }}
          >
            Book anyway
          </button>
        ) : null}
        {bookedAnyway ? <p className="mt-2 text-muted">Booked as expense #{bookedAnyway}.</p> : null}
      </div>
    );
  }
  const x = result.extracted;
  const cat = categoryFor(x.category);
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium">
          {result.status === "booked" ? "Booked" : "Booked — check it"}: {x.vendor || "Unknown vendor"} · {money(x.totalCents)}
          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">{PHASE_LABEL[result.phase]}</span>
        </p>
        <p className="text-muted">
          {x.date ?? "date not read"} · {cat.label} (line {cat.line}) · {x.items.length} item{x.items.length === 1 ? "" : "s"}
          {x.taxCents ? ` · tax ${money(x.taxCents)}` : ""}
          {x.paidWith !== "unknown" ? ` · ${x.paidWith}` : ""}
        </p>
        {x.summary ? <p className="text-muted">{x.summary}</p> : null}
        {x.items.some((i) => i.serial) ? (
          <p className="text-xs text-muted">Serials: {x.items.filter((i) => i.serial).map((i) => `${i.description.slice(0, 30)} ${i.serial}`).join(" · ")}</p>
        ) : null}
        {result.status === "needs-review" ? (
          <p className="mt-1 text-xs text-gold">Low confidence or missing date — it's in the table below flagged "check", fix anything that's off.</p>
        ) : null}
      </div>
      <a href={`/api/receipt/${result.receiptId}`} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
        <FileText className="size-3.5" /> view receipt
      </a>
    </div>
  );
}
