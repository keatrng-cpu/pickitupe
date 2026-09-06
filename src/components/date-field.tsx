import { useEffect, useMemo, useState } from "react";
import { getScheduleFill } from "@/lib/bookings";
import {
  DAILY_SLOTS,
  dayOptions,
  firstOpenDay,
  formatDayLong,
  slotsFor,
} from "@/lib/schedule";
import type { ServiceKey } from "@/lib/pricebook";

type Props = {
  service: ServiceKey;
  size: string;
  day: string;
  asap: boolean;
  onChange: (next: { day: string; asap: boolean }) => void;
  refreshKey?: number;
};

export function DateField({ service, size, day, asap, onChange, refreshKey = 0 }: Props) {
  const [fill, setFill] = useState<{ day: string; used: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    getScheduleFill()
      .then((rows) => setFill(rows))
      .catch(() => setFill([]))
      .finally(() => setLoaded(true));
  }, [refreshKey, service, size]);

  const need = slotsFor(service, size);
  const options = useMemo(() => dayOptions(fill, need), [fill, need]);
  const asapDay = useMemo(() => firstOpenDay(fill, need), [fill, need]);
  const visible = options.slice(0, 10);

  return (
    <div>
      <p className="text-xs font-medium text-muted">Preferred date</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Date mode">
        <button
          type="button"
          onClick={() => onChange({ day: asapDay ?? "", asap: true })}
          disabled={loaded && !asapDay}
          aria-pressed={asap}
          className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
            asap
              ? "bg-gold text-ink"
              : "border border-border text-fg hover:bg-fg/8"
          }`}
        >
          ASAP
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              day: options.find((d) => d.open)?.day ?? day,
              asap: false,
            })
          }
          aria-pressed={!asap}
          className={`btn-press inline-flex min-h-11 items-center rounded-full px-4 text-sm ${
            !asap
              ? "bg-gold text-ink"
              : "border border-border text-fg hover:bg-fg/8"
          }`}
        >
          Pick a day
        </button>
      </div>

      {asap ? (
        <p className="mt-3 text-sm text-fg">
          {asapDay ? (
            <>
              First open day:{" "}
              <span className="font-medium text-gold">{formatDayLong(asapDay)}</span>
              . Tap a chip to lock a different one.
            </>
          ) : loaded ? (
            "We're booked out on the days we publish. Text us and we'll find a gap."
          ) : (
            "Checking the crew calendar…"
          )}
        </p>
      ) : null}

      <div
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
        role="listbox"
        aria-label="Open days"
      >
        {visible.map((d) => {
          const selected = !asap && day === d.day;
          const openLeft = Math.max(0, DAILY_SLOTS - d.used);
          return (
            <button
              key={d.day}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={!d.open}
              onClick={() => onChange({ day: d.day, asap: false })}
              className={`btn-press inline-flex min-h-14 flex-col items-start justify-center rounded-2xl px-3 py-2 text-left text-sm ${
                !d.open
                  ? "cursor-not-allowed border border-border/50 text-muted line-through opacity-60"
                  : selected
                    ? "bg-gold text-ink"
                    : "border border-border text-fg hover:bg-fg/8"
              }`}
            >
              <span>{d.label}</span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  selected ? "text-ink/70" : "text-muted"
                }`}
              >
                {d.open ? `${openLeft} OPEN` : "Full"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
