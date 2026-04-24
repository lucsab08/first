"use client";

import { addDays, endOfMonth, format, getDaysInMonth, isSameDay, startOfMonth } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";

export function MonthView({ year, month, onDayClick }: { year: number; month: number; onDayClick?: (d: Date) => void }) {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const dim = getDaysInMonth(monthStart);
  const startWeekday = (monthStart.getDay() + 6) % 7; // Monday = 0
  const today = new Date();

  const days = trpc.calendar.month.useQuery({ year, month });
  const byDate = new Map((days.data ?? []).map((d) => [d.date, d]));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="text-[11px] text-ink-tertiary pb-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: dim }).map((_, i) => {
          const d = addDays(monthStart, i);
          const key = d.toISOString().slice(0, 10);
          const mix = byDate.get(key);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={key}
              onClick={() => onDayClick?.(d)}
              className={cn(
                "aspect-square rounded-xl flex flex-col items-center justify-start pt-2 gap-1 tap",
                isToday ? "bg-elevated" : "",
              )}
            >
              <span className={cn("tabular text-sm", isToday ? "font-semibold" : "")}>
                {format(d, "d")}
              </span>
              <div className="flex gap-0.5">
                {mix ? (
                  <>
                    {mix.strength ? <span className="h-1 w-1 rounded-full bg-dusk" /> : null}
                    {mix.cardio ? <span className="h-1 w-1 rounded-full bg-coral" /> : null}
                    {mix.recovery ? <span className="h-1 w-1 rounded-full bg-sage" /> : null}
                  </>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-ink-tertiary">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-dusk" /> Strength
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" /> Cardio
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" /> Recovery
        </span>
      </div>
    </div>
  );
}
