"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ArrowLeft, MapPin, Navigation, Share2, Bookmark, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { LoadingMarkCentered } from "@/components/brand/loading-mark";
import { RatingBreakdown } from "@/components/shared/rating-breakdown";
import { StaticMap } from "@/components/shared/static-map";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { BookingSheet } from "@/components/screens/booking-sheet";
import { cn, formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";

export default function StudioPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const studioQ = trpc.studio.bySlug.useQuery({ slug });
  const savedQ = trpc.studio.savedList.useQuery();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [bookSessionId, setBookSessionId] = useState<string | null>(null);

  const favoritedIds = useMemo(
    () => new Set((savedQ.data ?? []).map((s) => s.id)),
    [savedQ.data],
  );

  const studio = studioQ.data;

  if (studioQ.isLoading) return <LoadingMarkCentered />;
  if (!studio)
    return (
      <div className="p-5">
        <p className="text-ink-secondary">Studio not found.</p>
      </div>
    );

  const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfDay(new Date()), i));
  const sessionsForDay = (studio.upcomingSessions ?? []).filter((s) =>
    isSameDay(new Date(s.startTime), selectedDate),
  );

  const primaryLocation = studio.locations[0];
  const classTypes = Array.from(new Set(studio.classes.map((c) => c.type)));

  return (
    <motion.div
      initial={{ y: 48, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.24, ease: [0.32, 0.72, 0.24, 1] }}
      className="bg-paper min-h-dvh relative -mb-[88px]"
    >
      {/* Hero */}
      <div className="relative h-72 -mt-[env(safe-area-inset-top)]">
        <img src={studio.coverImageUrl ?? ""} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="photo-overlay absolute inset-0" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 safe-top">
          <button
            aria-label="Back"
            onClick={() => router.back()}
            className="h-11 w-11 rounded-full bg-paper/90 flex items-center justify-center tap"
          >
            <ArrowLeft className="h-5 w-5 text-ink-primary" />
          </button>
          <FavoriteButton
            studioId={studio.id}
            initialFavorited={favoritedIds.has(studio.id)}
          />
        </div>
      </div>

      {/* Header */}
      <section className="px-5 pt-5">
        <h1 className="font-display text-[24px] font-semibold leading-tight">{studio.name}</h1>
        <p className="text-sm text-ink-secondary mt-1.5">
          {primaryLocation ? neighborhoodLabel(primaryLocation.neighborhood) : ""}
          {studio.locations.length > 1 ? ` · ${studio.locations.length} locations` : ""}
          {" · "}
          <span className="tabular">★ {Number(studio.ratingAvg).toFixed(1)}</span>
          <span className="tabular text-ink-tertiary"> ({studio.ratingCount})</span>
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {classTypes.slice(0, 4).map((t) => (
            <Chip key={t} asDiv className="capitalize">
              {t}
            </Chip>
          ))}
        </div>
      </section>

      {/* Quick actions row */}
      <section className="grid grid-cols-4 gap-2 px-5 mt-5">
        {[
          { label: "Book", Icon: Clock, onClick: () => document.getElementById("schedule")?.scrollIntoView({ behavior: "smooth" }) },
          { label: "Directions", Icon: Navigation, onClick: () => primaryLocation && window.open(`https://maps.google.com/?q=${encodeURIComponent(primaryLocation.address)}`) },
          { label: "Share", Icon: Share2, onClick: () => navigator.share?.({ title: studio.name, url: window.location.href }).catch(() => {}) },
          { label: "Save", Icon: Bookmark, onClick: () => {} },
        ].map(({ label, Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-elevated tap"
          >
            <Icon className="h-5 w-5 text-ink-primary" />
            <span className="text-xs text-ink-secondary">{label}</span>
          </button>
        ))}
      </section>

      {/* About */}
      <section className="px-5 mt-8">
        <h2 className="text-[18px] font-semibold mb-2">About</h2>
        <p className={cn("text-[15px] text-ink-secondary leading-relaxed", !aboutExpanded && "line-clamp-3")}>
          {studio.description}
        </p>
        <button
          onClick={() => setAboutExpanded((x) => !x)}
          className="mt-2 text-sm text-ink-primary underline underline-offset-4"
        >
          {aboutExpanded ? "Read less" : "Read more"}
        </button>
      </section>

      {/* Schedule */}
      <section id="schedule" className="mt-8">
        <h2 className="text-[18px] font-semibold px-5 mb-3">Schedule</h2>
        <div className="sticky top-0 z-10 bg-paper/95 backdrop-blur border-b border-hairline">
          <div className="px-5 py-3 flex gap-2 overflow-x-auto scroll-hide">
            {days.map((d) => {
              const active = isSameDay(d, selectedDate);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 h-16 min-w-[56px] rounded-2xl px-3 py-2 tap shrink-0",
                    active ? "bg-dusk text-paper" : "bg-elevated text-ink-primary",
                  )}
                >
                  <span className="text-[11px] opacity-80">{format(d, "EEE")}</span>
                  <span className="tabular text-[17px] font-semibold">{format(d, "d")}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="px-5 mt-3 divide-y divide-hairline">
          {sessionsForDay.length === 0 ? (
            <p className="text-sm text-ink-secondary py-6">
              Nothing on the schedule that day. Try another.
            </p>
          ) : (
            sessionsForDay.map((s) => {
              const cls = studio.classes.find((c) => c.id === s.classId);
              const instr = studio.instructors.find((i) => i.id === s.instructorId);
              const remaining = Math.max(0, s.capacity - s.spotsBooked);
              return (
                <div key={s.id} className="flex items-center gap-3 py-4">
                  <div className="shrink-0 w-16">
                    <p className="tabular text-[15px] font-medium">{formatTime(s.startTime)}</p>
                    <p className="text-xs text-ink-tertiary tabular">{cls?.durationMinutes ?? 0} min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[15px] truncate-1">{cls?.name}</p>
                    <p className="text-sm text-ink-secondary truncate-1">
                      {instr?.name ?? "Multiple instructors"}
                      {remaining <= 2 ? (
                        <>
                          {" · "}
                          <span className="text-coral">
                            {remaining === 0 ? "full — join waitlist" : `${remaining} spot${remaining === 1 ? "" : "s"} left`}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-sm tabular text-ink-tertiary">{formatCents(cls?.priceCents ?? 0)}</div>
                  <Button size="sm" onClick={() => setBookSessionId(s.id)}>
                    {remaining === 0 ? "Waitlist" : "Book"}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Instructors */}
      {studio.instructors.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-[18px] font-semibold px-5 mb-3">Instructors</h2>
          <div className="flex gap-3 overflow-x-auto scroll-hide px-5">
            {studio.instructors.map((i) => (
              <div key={i.id} className="shrink-0 w-24 text-center">
                {i.avatarUrl ? (
                  <img
                    src={i.avatarUrl}
                    alt=""
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-2xl bg-elevated" />
                )}
                <p className="text-sm font-medium mt-2 truncate-1">{i.name}</p>
                <p className="text-xs text-ink-tertiary truncate-1">{i.specialty}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Reviews */}
      <section className="mt-10 px-5">
        <h2 className="text-[18px] font-semibold mb-3">Reviews</h2>
        <RatingBreakdown average={Number(studio.ratingAvg)} total={studio.ratingCount} />
        <div className="mt-5 space-y-4">
          {(studio.reviews ?? []).slice(0, 3).map((r) => (
            <div key={r.id} className="border-t border-hairline pt-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-[15px]">{(r as { reviewerName?: string }).reviewerName ?? "Member"}</p>
                <p className="text-xs text-ink-tertiary">
                  {format(new Date(r.createdAt), "MMM d, yyyy")}
                </p>
              </div>
              <div className="flex items-center gap-0.5 mt-1 text-ink-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < r.rating ? "" : "opacity-20"}>
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[15px] text-ink-secondary mt-1 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Location */}
      {primaryLocation ? (
        <section className="mt-10 px-5">
          <h2 className="text-[18px] font-semibold mb-3">Location</h2>
          <StaticMap lat={Number(primaryLocation.lat)} lng={Number(primaryLocation.lng)} />
          <div className="flex items-start gap-3 mt-3">
            <MapPin className="h-5 w-5 text-ink-tertiary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[15px]">{primaryLocation.address}</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(primaryLocation.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-primary underline underline-offset-4"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {/* Sticky CTA */}
      <div className="sticky bottom-[88px] left-0 right-0 px-5 pb-3 pt-2 bg-gradient-to-t from-paper to-transparent">
        <Button
          block
          onClick={() => {
            const firstUpcoming = (studio.upcomingSessions ?? [])[0];
            if (firstUpcoming) setBookSessionId(firstUpcoming.id);
          }}
        >
          Book a class
        </Button>
      </div>

      {bookSessionId ? (
        <BookingSheet
          sessionId={bookSessionId}
          open={Boolean(bookSessionId)}
          onClose={() => setBookSessionId(null)}
        />
      ) : null}
    </motion.div>
  );
}
