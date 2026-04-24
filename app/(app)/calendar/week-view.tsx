"use client";

import { useMemo } from "react";
import Link from "next/link";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

const START_HOUR = 6;
const END_HOUR = 21;
const ROWS = END_HOUR - START_HOUR;

export function WeekView({
  weekStart,
  onBookingClick,
}: {
  weekStart: Date;
  onBookingClick?: (bookingId: string) => void;
}) {
  const bookings = trpc.calendar.week.useQuery({ weekStart: weekStart.toISOString() });
  const days = useMemo(
    () => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const today = new Date();

  return (
    <div className="grid grid-cols-[36px_repeat(7,1fr)] gap-px bg-hairline rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="bg-surface h-12" />
      {days.map((d) => {
        const isToday = isSameDay(d, today);
        return (
          <div key={d.toISOString()} className="bg-surface h-12 flex flex-col items-center justify-center">
            <p
              className={cn(
                "text-[11px]",
                isToday ? "text-coral font-semibold" : "text-ink-tertiary",
              )}
            >
              {format(d, "EEE").toUpperCase()}
            </p>
            <p className={cn("tabular text-sm", isToday ? "font-semibold" : "")}>{format(d, "d")}</p>
          </div>
        );
      })}

      {/* Hour rows */}
      {Array.from({ length: ROWS }).map((_, rowIdx) => {
        const hour = START_HOUR + rowIdx;
        return (
          <div className="contents" key={rowIdx}>
            <div className="bg-surface h-16 flex items-start justify-end pr-1 pt-0.5 text-[10px] text-ink-tertiary tabular">
              {format(new Date(2000, 0, 1, hour), "h a").toLowerCase()}
            </div>
            {days.map((d) => (
              <div key={`${rowIdx}-${d.toISOString()}`} className="bg-surface h-16 relative" />
            ))}
          </div>
        );
      })}

      {/* Overlay: booking blocks */}
      <div className="col-span-8 row-start-2 row-end-[17] grid grid-cols-[36px_repeat(7,1fr)] pointer-events-none">
        <div />
        {days.map((d) => (
          <div key={d.toISOString()} className="relative pointer-events-auto">
            {(bookings.data ?? [])
              .filter((b) => isSameDay(new Date(b.session.startTime), d))
              .map((b) => {
                const start = new Date(b.session.startTime);
                const end = new Date(b.session.endTime);
                const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                const durMin = (end.getTime() - start.getTime()) / 60000;
                const top = (startMin / 60) * 64;
                const height = Math.max(28, (durMin / 60) * 64);
                const isWaitlist = b.status === "waitlisted";
                const isConflict = b.session.startTime < start && false;

                return (
                  <button
                    key={b.id}
                    onClick={() => onBookingClick?.(b.id)}
                    style={{ top, height }}
                    className={cn(
                      "absolute left-0.5 right-0.5 rounded-md px-1.5 py-1 text-left overflow-hidden",
                      isWaitlist
                        ? "bg-seaglass border border-dashed border-dusk text-ink-primary"
                        : "bg-dusk text-paper",
                      isConflict && "border-l-2 border-coral",
                    )}
                  >
                    <p className="text-[10px] font-semibold truncate-1 leading-tight">
                      {b.session.class.name}
                    </p>
                    <p className="text-[10px] opacity-80 tabular truncate-1">
                      {format(start, "h:mma").toLowerCase()}
                    </p>
                    {isConflict ? (
                      <AlertTriangle className="h-3 w-3 text-coral absolute bottom-0.5 right-0.5" />
                    ) : null}
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
