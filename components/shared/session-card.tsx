"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { cn, countdownTo, formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";

export type SessionSummary = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  spotsBooked: number;
  capacity: number;
  class: {
    id: string;
    name: string;
    type: string;
    intensity: "low" | "medium" | "high";
    durationMinutes: number;
    priceCents: number;
    beginnerFriendly?: boolean;
  };
  studio: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string;
    ratingAvg: number | string;
  };
  location: {
    neighborhood: string;
    name: string | null;
  };
  instructor: { name: string } | null;
  _reason?: string;
};

/**
 * Recommended / trending horizontal-scroll card.
 * 280px wide · 320px tall — §9.2 item 3.
 */
export function SessionCard({
  session,
  className,
  reason,
  width = 280,
  height = 320,
}: {
  session: SessionSummary;
  className?: string;
  reason?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Link
      href={`/studio/${session.studio.slug}`}
      className={cn(
        "group shrink-0 block rounded-2xl overflow-hidden bg-surface shadow-card relative tap",
        className,
      )}
      style={{ width, height }}
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={session.studio.coverImageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
        <div className="photo-overlay absolute inset-0" />
        {reason ? (
          <span className="absolute top-3 left-3 rounded-full bg-paper/95 px-3 py-1 text-xs font-medium text-ink-primary">
            {reason}
          </span>
        ) : null}
      </div>
      <div className="p-4 flex flex-col gap-1">
        <p className="font-medium text-[15px] leading-snug truncate-1">{session.class.name}</p>
        <p className="text-sm text-ink-secondary truncate-1">
          {session.studio.name} · {neighborhoodLabel(session.location.neighborhood)}
        </p>
        <div className="flex items-center justify-between mt-1 text-sm">
          <span className="text-ink-secondary tabular">{formatTime(session.startTime)}</span>
          <span className="flex items-center gap-2">
            <span className="inline-flex items-center gap-0.5 text-ink-tertiary">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span className="tabular">{Number(session.studio.ratingAvg).toFixed(1)}</span>
            </span>
            <span className="text-ink-primary font-medium tabular">
              {formatCents(session.class.priceCents)}
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * Full-bleed Today's-class card. §9.2 item 2.
 */
export function TodaysClassCard({ session }: { session: SessionSummary }) {
  return (
    <Link
      href={`/studio/${session.studio.slug}`}
      className="relative block rounded-3xl overflow-hidden tap"
      style={{ aspectRatio: "16/9" }}
    >
      <img
        src={session.studio.coverImageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-primary/75 via-ink-primary/20 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-end p-5 text-paper">
        <p className="label-uppercase text-paper/90">next up</p>
        <p className="font-display text-[24px] font-semibold leading-tight mt-1">
          {session.class.name}
        </p>
        <p className="text-[15px] opacity-90 mt-0.5">
          {session.studio.name} · {neighborhoodLabel(session.location.neighborhood)}
          {session.instructor ? ` · ${session.instructor.name}` : ""}
        </p>
        <div className="flex items-end justify-between mt-3">
          <p className="font-display text-[24px] font-semibold tabular">
            {countdownTo(session.startTime)}
          </p>
          <span className="inline-flex items-center gap-2 text-sm bg-paper/15 backdrop-blur rounded-full px-3 py-1.5">
            get directions
          </span>
        </div>
      </div>
    </Link>
  );
}
