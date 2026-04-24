"use client";

import Link from "next/link";
import { startOfWeek } from "date-fns";
import { Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Card, SandCard, SeaglassCard } from "@/components/ui/card";
import { Chip, LabelTag } from "@/components/ui/chip";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Wordmark } from "@/components/brand/mark";
import { SectionHeader } from "@/components/shared/section-header";
import { HorizontalScroller } from "@/components/shared/horizontal-scroller";
import {
  SessionCard,
  TodaysClassCard,
  type SessionSummary,
} from "@/components/shared/session-card";
import { WeekStrip } from "@/components/shared/week-strip";
import { StudioRow } from "@/components/shared/studio-row";
import { Button } from "@/components/ui/button";
import { firstName, timeAwareGreeting } from "@/lib/utils";

export default function TodayPage() {
  const me = trpc.auth.me.useQuery();
  const stats = trpc.user.stats.useQuery(undefined, { staleTime: 60_000 });
  const today = trpc.calendar.upcomingToday.useQuery();
  const recommended = trpc.class.recommendedFor.useQuery({ limit: 5 });
  const trending = trpc.class.trending.useQuery({ limit: 6 });
  const nearby = trpc.studio.nearby.useQuery({ lat: 25.7617, lng: -80.1918, radiusKm: 5 });
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDots = trpc.calendar.weekDots.useQuery({ weekStart: weekStart.toISOString() });

  const name = firstName(me.data?.fullName);
  const greeting = timeAwareGreeting();

  const todaysSession: SessionSummary | null =
    (today.data?.[0]?.session as SessionSummary | undefined) ?? null;

  const weeklyTarget = me.data?.preferences?.weeklyGoal ?? 4;
  const completedThisWeek = weekDots.data?.filter((d) => d.completed).length ?? 0;
  const bookedThisWeek = weekDots.data?.filter((d) => d.booked || d.completed).length ?? 0;
  const todayCount = today.data?.length ?? 0;

  return (
    <div className="px-5 pt-4 pb-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-ink-tertiary mb-2">
            <Wordmark size={14} />
          </div>
          <h1 className="font-display text-[28px] font-semibold leading-[1.1]">
            {greeting}, {name}.
          </h1>
          <p className="text-[15px] text-ink-secondary mt-1">
            {bookedThisWeek} classes this week · {todayCount} today
          </p>
        </div>
        <ProgressRing value={completedThisWeek} target={weeklyTarget} />
      </header>

      <section className="mt-8">
        {todaysSession ? (
          <TodaysClassCard session={todaysSession} />
        ) : (
          <SandCard className="flex flex-col gap-2">
            <p className="font-display text-[20px] font-semibold">Rest day.</p>
            <p className="text-[15px] text-ink-secondary">
              Nothing booked for today. Want to add something?
            </p>
            <div className="flex gap-2 mt-2">
              <Button asChild size="md">
                <Link href="/discover">See what's open</Link>
              </Button>
              <Button asChild size="md" variant="ghost">
                <Link href="/coach">Ask Coach</Link>
              </Button>
            </div>
          </SandCard>
        )}
      </section>

      <section className="mt-8">
        <SectionHeader title="Recommended for you" action={{ label: "See all", href: "/discover" }} />
        <div className="mt-3">
          <HorizontalScroller>
            {(recommended.data ?? []).map((s, i) => {
              const session = s as unknown as SessionSummary;
              return (
                <SessionCard
                  key={session.id}
                  session={session}
                  reason={reasonFor(session, i)}
                  className="snap-start"
                />
              );
            })}
            {(recommended.data ?? []).length === 0 ? (
              <Card className="w-full">
                <p className="text-sm text-ink-secondary">
                  Nothing obvious yet. Add a neighborhood under{" "}
                  <Link href="/you" className="underline">
                    You
                  </Link>{" "}
                  to sharpen recs.
                </p>
              </Card>
            ) : null}
          </HorizontalScroller>
        </div>
      </section>

      <section className="mt-8">
        <SeaglassCard className="flex gap-3 items-start">
          <div className="h-9 w-9 rounded-full bg-paper flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-dusk" />
          </div>
          <div className="flex-1">
            <p className="font-display text-[20px] font-semibold leading-tight">
              {coachInsight(stats.data?.currentStreak ?? 0, todaysSession)}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Chip asDiv>
                <Link href="/discover?intensity=low">See options</Link>
              </Chip>
              <Chip asDiv variant="active">
                <Link href="/coach">Plan my week</Link>
              </Chip>
            </div>
          </div>
        </SeaglassCard>
      </section>

      <section className="mt-8">
        <SectionHeader title="This week" />
        <div className="mt-3">
          <WeekStrip weekStart={weekStart} dots={weekDots.data ?? []} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center gap-3">
          <SectionHeader
            title="Trending in Miami"
            action={{ label: "See all", href: "/discover" }}
            className="flex-1"
          />
        </div>
        <div className="mt-3">
          <HorizontalScroller>
            {(trending.data ?? []).map((s) => {
              const session = s as unknown as SessionSummary;
              return (
                <div key={session.id} className="relative snap-start shrink-0">
                  <LabelTag className="absolute top-3 right-3 z-10 bg-paper/95 px-2 py-0.5 rounded-full">
                    Trending
                  </LabelTag>
                  <SessionCard session={session} />
                </div>
              );
            })}
          </HorizontalScroller>
        </div>
      </section>

      <section className="mt-8">
        <SectionHeader
          title="Nearby studios"
          action={{ label: "See all", href: "/discover" }}
        />
        <div className="mt-2 divide-y divide-hairline">
          {(nearby.data ?? []).slice(0, 3).map(({ studio, km, location }) => (
            <StudioRow
              key={studio.id}
              studio={studio}
              neighborhood={location?.neighborhood ?? ""}
              distanceKm={km}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function reasonFor(s: SessionSummary, i: number): string | undefined {
  const reasons = [
    "matches your week",
    "3 min from your office",
    "you love Pilates",
    "beginner-friendly",
    "open slot in your schedule",
  ];
  if (s.class.beginnerFriendly) return "beginner-friendly";
  return reasons[i] ?? undefined;
}

function coachInsight(
  streak: number,
  todays: SessionSummary | null,
): string {
  if (todays && todays.class.intensity === "high") {
    return "Heavy session today. Pair it with a slow flow tomorrow.";
  }
  if (streak >= 3) {
    return `${streak} weeks straight. That's a rhythm.`;
  }
  return "Based on this week, try something low-impact tomorrow.";
}
