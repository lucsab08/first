"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, addMonths, format, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { WeekView } from "./week-view";
import { DayView } from "./day-view";
import { MonthView } from "./month-view";

type View = "day" | "week" | "month";

export default function CalendarPage() {
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());

  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);

  return (
    <div className="px-5 pt-4 pb-24 relative">
      <header className="flex items-center justify-between mb-4">
        <h1 className="font-display text-[28px] font-semibold">Calendar</h1>
      </header>

      <Segmented
        value={view}
        onChange={(v) => setView(v as View)}
        options={[
          { value: "day", label: "Day" },
          { value: "week", label: "Week" },
          { value: "month", label: "Month" },
        ]}
        className="mb-4"
      />

      <div className="sticky top-0 bg-paper z-10 py-2 flex items-center justify-between">
        <button
          aria-label="Previous"
          onClick={() =>
            setAnchor((a) =>
              view === "month" ? addMonths(a, -1) : view === "week" ? addDays(a, -7) : addDays(a, -1),
            )
          }
          className="h-9 w-9 rounded-full bg-elevated flex items-center justify-center tap"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="font-medium tabular text-[15px]">
          {view === "month"
            ? format(anchor, "MMMM yyyy")
            : view === "week"
            ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`
            : format(anchor, "EEEE, MMM d")}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAnchor(new Date())}
            className="text-sm text-ink-secondary underline underline-offset-4"
          >
            Today
          </button>
          <button
            aria-label="Next"
            onClick={() =>
              setAnchor((a) =>
                view === "month" ? addMonths(a, 1) : view === "week" ? addDays(a, 7) : addDays(a, 1),
              )
            }
            className="h-9 w-9 rounded-full bg-elevated flex items-center justify-center tap"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3">
        {view === "week" ? (
          <WeekView weekStart={weekStart} />
        ) : view === "day" ? (
          <DayView date={anchor} />
        ) : (
          <MonthView
            year={anchor.getFullYear()}
            month={anchor.getMonth() + 1}
            onDayClick={(d) => {
              setAnchor(d);
              setView("day");
            }}
          />
        )}
      </div>

      <Link
        href="/discover"
        aria-label="Add a class"
        className="fixed right-5 bottom-[96px] h-14 w-14 rounded-full bg-dusk text-paper flex items-center justify-center shadow-card tap z-20"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
