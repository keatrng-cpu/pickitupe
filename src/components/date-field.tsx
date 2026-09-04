import { useEffect, useMemo, useState } from "react";
import { getScheduleFill } from "@/lib/bookings";
import {
  DAILY_SLOTS,
  dayOptions,
  firstOpenDay,
  formatDayLong,
  isSingleItem,
  slotsFor,
} from "@/lib/schedule";
import type { ServiceKey } from "@/lib/pricebook";

type Props = {
  service: ServiceKey;
  size: string;
  day: string;
  asap: boolean;
  onChange: (next: { day: string; asap: boolean }) => void;
};

export function DateField({ service, size, day, asap, onChange }: Props) {
  const [fill, setFill] = useState<{ day: string; used: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getScheduleFill()
      .then((rows) => setFill(rows))
      .catch(() => setFill([]))
      .finally(() => setLoaded(true));
  }, []);

  const need = slotsFor(service, size);
  const single = isSingleItem(service, size);
  const options = useMemo(() => dayOptions(fill, need), [fill, need]);
  const asapDay = useMemo(() => firstOpenDay(fill, need), [fill, need]);
  const visible = options.slice(0, 10);

  return (
    <div>
      <p className="text-xs font-medium text-muted">Preferred date</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange({ day: asapDay ?? "", asap: true })}
          disabled={loaded && !asapDay}
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
              {single ? " — typical for a single-item haul." : null}
            </>
          ) : loaded ? (
            "We're booked out on the days we publish. Text us and we'll find a gap."
          ) : (
            "Checking the crew calendar…"
          )}
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {visible.map((d) => (
            <button
              key={d.day}
              type="button"
              disabled={!d.open}
              onClick={() => onChange({ day: d.day, asap: false })}
              className={`btn-press inline-flex min-h-11 flex-col items-start rounded-xl px-3 py-2 text-left text-sm ${
                !d.open
                  ? "cursor-not-allowed border border-border/50 text-muted line-through opacity-60"
                  : day === d.day
                    ? "bg-gold text-ink"
                    : "border border-border text-fg hover:bg-fg/8"
              }`}
            >
              <span>{d.label}</span>
              <span
                className={`text-[10px] uppercase tracking-wider ${
                  day === d.day && d.open ? "text-ink/70" : "text-muted"
                }`}
              >
                {d.open ? `${DAILY_SLOTS - d.used} open` : "Full"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
