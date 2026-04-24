"use client";

import Link from "next/link";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Dot = {
  date: string;
  day: number;
  completed: boolean;
  booked: boolean;
};

export function WeekStrip({
  weekStart,
  dots,
}: {
  weekStart?: Date;
  dots: Dot[];
}) {
  const anchor = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = new Date();

  return (
    <div className="flex items-stretch gap-2 justify-between">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(anchor, i);
        const dot = dots.find((x) => isSameDay(new Date(x.date), d));
        const isToday = isSameDay(d, today);
        const label = format(d, "EEEEE");
        const dayNum = format(d, "d");

        return (
          <Link
            href={`/calendar?date=${d.toISOString().slice(0, 10)}`}
            key={i}
            className={cn(
              "flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl tap",
              isToday ? "bg-elevated" : "",
            )}
          >
            <span className="text-[11px] text-ink-tertiary">{label}</span>
            <span className="tabular text-sm font-medium">{dayNum}</span>
            {dot?.completed ? (
              <span className="h-5 w-5 rounded-full bg-sage flex items-center justify-center">
                <Check className="h-3 w-3 text-paper" />
              </span>
            ) : dot?.booked ? (
              <span className="h-5 w-5 rounded-full bg-dusk" />
            ) : (
              <span className="h-5 w-5 rounded-full border border-hairline" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
