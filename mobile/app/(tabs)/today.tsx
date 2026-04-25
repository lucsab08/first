import { ScrollView, Text, View } from "react-native";
import { Link } from "expo-router";
import { startOfWeek } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sparkles } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Card, SandCard, SeaglassCard } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Wordmark } from "@/components/brand/mark";
import { SectionHeader } from "@/components/shared/section-header";
import { SessionCard, TodaysClassCard, type SessionSummary } from "@/components/shared/session-card";
import { WeekStrip } from "@/components/shared/week-strip";
import { StudioRow } from "@/components/shared/studio-row";
import { firstName, timeAwareGreeting } from "@/lib/utils";

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
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
  const todaysSession = (today.data?.[0]?.session as SessionSummary | undefined) ?? null;
  const weeklyTarget = me.data?.preferences?.weeklyGoal ?? 4;
  const completedThisWeek = weekDots.data?.filter((d) => d.completed).length ?? 0;
  const bookedThisWeek = weekDots.data?.filter((d) => d.booked || d.completed).length ?? 0;
  const todayCount = today.data?.length ?? 0;

  return (
    <ScrollView
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <View className="flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Wordmark size={14} />
          <Text
            className="font-display text-ink-primary text-[28px] mt-2"
            style={{ lineHeight: 32 }}
          >
            {greeting}, {name}.
          </Text>
          <Text className="text-[15px] text-ink-secondary mt-1">
            {bookedThisWeek} classes this week · {todayCount} today
          </Text>
        </View>
        <ProgressRing value={completedThisWeek} target={weeklyTarget} />
      </View>

      {/* Today's class or empty */}
      <View className="mt-8">
        {todaysSession ? (
          <TodaysClassCard session={todaysSession} />
        ) : (
          <SandCard>
            <Text className="font-display text-[20px] text-ink-primary">Rest day.</Text>
            <Text className="text-[15px] text-ink-secondary mt-1">
              Nothing booked for today. Want to add something?
            </Text>
            <View className="flex-row gap-2 mt-3">
              <Link href="/(tabs)/discover" asChild>
                <Button size="md" label="See what's open" />
              </Link>
              <Link href="/(tabs)/coach" asChild>
                <Button size="md" variant="ghost" label="Ask Coach" />
              </Link>
            </View>
          </SandCard>
        )}
      </View>

      {/* Recommended */}
      <View className="mt-8">
        <SectionHeader
          title="Recommended for you"
          action={{ label: "See all", href: "/(tabs)/discover" }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingRight: 20 }}
          style={{ marginHorizontal: -20, paddingLeft: 20 }}
        >
          {(recommended.data ?? []).map((s, i) => (
            <SessionCard
              key={(s as SessionSummary).id}
              session={s as unknown as SessionSummary}
              reason={reasonFor(s as SessionSummary, i)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Coach insight */}
      <View className="mt-8">
        <SeaglassCard>
          <View className="flex-row gap-3 items-start">
            <View className="h-9 w-9 rounded-full bg-paper items-center justify-center">
              <Sparkles size={16} color="#1B3A4B" />
            </View>
            <View className="flex-1">
              <Text
                className="font-display text-[20px] text-ink-primary"
                style={{ lineHeight: 24 }}
              >
                {coachInsight(stats.data?.currentStreak ?? 0, todaysSession)}
              </Text>
              <View className="flex-row gap-2 mt-3">
                <Link href="/(tabs)/discover" asChild>
                  <Chip>See options</Chip>
                </Link>
                <Link href="/(tabs)/coach" asChild>
                  <Chip active>Plan my week</Chip>
                </Link>
              </View>
            </View>
          </View>
        </SeaglassCard>
      </View>

      {/* Week strip */}
      <View className="mt-8">
        <SectionHeader title="This week" />
        <View className="mt-3">
          <WeekStrip weekStart={weekStart} dots={weekDots.data ?? []} />
        </View>
      </View>

      {/* Trending */}
      <View className="mt-8">
        <SectionHeader title="Trending in Miami" action={{ label: "See all", href: "/(tabs)/discover" }} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingTop: 12, paddingRight: 20 }}
          style={{ marginHorizontal: -20, paddingLeft: 20 }}
        >
          {(trending.data ?? []).map((s) => (
            <SessionCard key={(s as SessionSummary).id} session={s as unknown as SessionSummary} />
          ))}
        </ScrollView>
      </View>

      {/* Nearby */}
      <View className="mt-8">
        <SectionHeader title="Nearby studios" action={{ label: "See all", href: "/(tabs)/discover" }} />
        <View className="mt-2">
          {(nearby.data ?? []).slice(0, 3).map(({ studio, km, location }) => (
            <View key={studio.id} className="border-b border-hairline">
              <StudioRow studio={studio} neighborhood={location?.neighborhood ?? ""} distanceKm={km} />
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
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

function coachInsight(streak: number, todays: SessionSummary | null): string {
  if (todays && todays.class.intensity === "high") {
    return "Heavy session today. Pair it with a slow flow tomorrow.";
  }
  if (streak >= 3) return `${streak} weeks straight. That's a rhythm.`;
  return "Based on this week, try something low-impact tomorrow.";
}
