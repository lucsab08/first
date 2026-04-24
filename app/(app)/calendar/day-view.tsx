"use client";

import Link from "next/link";
import { format } from "date-fns";
import { trpc } from "@/lib/trpc/client";
import { Card, SeaglassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatTime, neighborhoodLabel } from "@/lib/utils";

export function DayView({ date }: { date: Date }) {
  const weekStartIso = (() => {
    const d = new Date(date);
    const day = d.getDay() === 0 ? 6 : d.getDay() - 1;
    d.setDate(d.getDate() - day);
    return d.toISOString();
  })();

  const bookings = trpc.calendar.day.useQuery({ date: date.toISOString() });
  const balance = trpc.calendar.balance.useQuery({ weekStart: weekStartIso });

  return (
    <div className="space-y-4">
      {balance.data ? (
        <SeaglassCard className="flex items-start gap-3">
          <div className="flex-1">
            <p className="label-uppercase text-dusk mb-1">This week</p>
            <p className="text-[15px] leading-snug">
              <span className="tabular">{balance.data.strength}</span> strength ·{" "}
              <span className="tabular">{balance.data.cardio}</span> cardio ·{" "}
              <span className="tabular">{balance.data.recovery}</span> recovery.{" "}
              <span className="text-ink-secondary">{balance.data.suggestion}.</span>
            </p>
          </div>
          <Button asChild size="sm" variant="ghost">
            <Link href="/discover?intensity=low">See options</Link>
          </Button>
        </SeaglassCard>
      ) : null}

      {(bookings.data ?? []).length === 0 ? (
        <Card className="bg-sand">
          <p className="font-display text-[20px] font-semibold">Nothing booked.</p>
          <p className="text-sm text-ink-secondary mt-1">
            Open up to {format(date, "EEEE")} by picking something now.
          </p>
          <Button asChild size="md" className="mt-3">
            <Link href="/discover">See what's open</Link>
          </Button>
        </Card>
      ) : (
        (bookings.data ?? []).map((b) => {
          const start = new Date(b.session.startTime);
          const end = new Date(b.session.endTime);
          return (
            <Link
              key={b.id}
              href={`/studio/${b.session.studio.slug}`}
              className="block tap"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-card">
                <img
                  src={b.session.studio.coverImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="photo-overlay absolute inset-0" />
                <div className="relative p-5 text-paper min-h-[140px] flex flex-col justify-end">
                  <p className="label-uppercase text-paper/90 tabular">
                    {formatTime(start)} — {formatTime(end)}
                  </p>
                  <p className="font-display text-[20px] font-semibold mt-1 leading-tight">
                    {b.session.class.name}
                  </p>
                  <p className="text-sm opacity-90 mt-0.5">
                    {b.session.studio.name} · {neighborhoodLabel(b.session.location.neighborhood)}
                    {b.session.instructor ? ` · ${b.session.instructor.name}` : ""}
                  </p>
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
