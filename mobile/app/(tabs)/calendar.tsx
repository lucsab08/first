import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { addDays, addMonths, addWeeks, format, isSameDay, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { Card, SeaglassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { cn, formatTime, neighborhoodLabel } from "@/lib/utils";

type View = "day" | "week" | "month";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<View>("week");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const weekStart = useMemo(() => startOfWeek(anchor, { weekStartsOn: 1 }), [anchor]);

  return (
    <View className="flex-1 bg-paper" style={{ paddingTop: insets.top + 16 }}>
      <View className="px-5 pb-3">
        <Text className="font-display text-[28px] text-ink-primary">Calendar</Text>
      </View>

      <View className="px-5">
        <Segmented
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: "day", label: "Day" },
            { value: "week", label: "Week" },
            { value: "month", label: "Month" },
          ]}
        />
      </View>

      <View className="px-5 py-3 flex-row items-center justify-between">
        <Pressable
          onPress={() =>
            setAnchor((a) =>
              view === "month" ? addMonths(a, -1) : view === "week" ? addWeeks(a, -1) : addDays(a, -1),
            )
          }
          className="h-9 w-9 rounded-full bg-elevated items-center justify-center"
          accessibilityLabel="Previous"
        >
          <ChevronLeft size={16} color="#0A0A0A" />
        </Pressable>
        <Text
          className="text-[15px] font-sansMedium"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {view === "month"
            ? format(anchor, "MMMM yyyy")
            : view === "week"
            ? `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d")}`
            : format(anchor, "EEEE, MMM d")}
        </Text>
        <View className="flex-row items-center gap-2">
          <Pressable onPress={() => setAnchor(new Date())}>
            <Text className="text-sm text-ink-secondary underline">Today</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              setAnchor((a) =>
                view === "month" ? addMonths(a, 1) : view === "week" ? addWeeks(a, 1) : addDays(a, 1),
              )
            }
            className="h-9 w-9 rounded-full bg-elevated items-center justify-center"
            accessibilityLabel="Next"
          >
            <ChevronRight size={16} color="#0A0A0A" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 140 }}>
        {view === "week" ? (
          <WeekView weekStart={weekStart} />
        ) : view === "day" ? (
          <DayView date={anchor} />
        ) : (
          <MonthView
            year={anchor.getFullYear()}
            month={anchor.getMonth() + 1}
            onDayPress={(d) => {
              setAnchor(d);
              setView("day");
            }}
          />
        )}
      </ScrollView>

      <Pressable
        onPress={() => router.push("/(tabs)/discover")}
        className="absolute right-5 h-14 w-14 rounded-full bg-dusk items-center justify-center"
        style={{
          bottom: insets.bottom + 92,
          shadowColor: "#0A0A0A",
          shadowOpacity: 0.04,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 2 },
        }}
        accessibilityLabel="Add a class"
      >
        <Plus size={24} color="#FAFAF7" />
      </Pressable>
    </View>
  );
}

const START_HOUR = 6;
const END_HOUR = 21;
const HOUR_HEIGHT = 56;

function WeekView({ weekStart }: { weekStart: Date }) {
  const bookings = trpc.calendar.week.useQuery({ weekStart: weekStart.toISOString() });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const today = new Date();

  return (
    <View>
      {/* Header row */}
      <View className="flex-row mb-1">
        <View style={{ width: 40 }} />
        {days.map((d) => {
          const isToday = isSameDay(d, today);
          return (
            <View key={d.toISOString()} className="flex-1 items-center pb-1">
              <Text
                className={cn("text-[10px]", isToday ? "text-coral font-sansSemibold" : "text-ink-tertiary")}
              >
                {format(d, "EEE").toUpperCase()}
              </Text>
              <Text
                className={cn("text-sm", isToday ? "font-sansSemibold" : "")}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {format(d, "d")}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Hour grid */}
      <View>
        {Array.from({ length: END_HOUR - START_HOUR }).map((_, rowIdx) => {
          const hour = START_HOUR + rowIdx;
          return (
            <View
              key={rowIdx}
              className="flex-row border-t border-hairline"
              style={{ height: HOUR_HEIGHT }}
            >
              <View style={{ width: 40 }} className="items-end pr-1 pt-0.5">
                <Text
                  className="text-[10px] text-ink-tertiary"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {format(new Date(2000, 0, 1, hour), "ha").toLowerCase()}
                </Text>
              </View>
              {days.map((d) => (
                <View key={d.toISOString()} className="flex-1 border-l border-hairline" />
              ))}
            </View>
          );
        })}

        {/* Booking blocks overlay */}
        <View
          style={{
            position: "absolute",
            left: 40,
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: "row",
          }}
          pointerEvents="box-none"
        >
          {days.map((d) => (
            <View key={d.toISOString()} className="flex-1 relative">
              {(bookings.data ?? [])
                .filter((b) => isSameDay(new Date(b.session.startTime), d))
                .map((b) => {
                  const start = new Date(b.session.startTime);
                  const end = new Date(b.session.endTime);
                  const startMin = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
                  const durMin = (end.getTime() - start.getTime()) / 60000;
                  const top = (startMin / 60) * HOUR_HEIGHT;
                  const height = Math.max(28, (durMin / 60) * HOUR_HEIGHT);
                  const isWaitlist = b.status === "waitlisted";
                  return (
                    <View
                      key={b.id}
                      style={{
                        position: "absolute",
                        top,
                        height,
                        left: 2,
                        right: 2,
                        borderRadius: 6,
                        padding: 4,
                        backgroundColor: isWaitlist ? "#D4E4E8" : "#1B3A4B",
                        borderStyle: isWaitlist ? "dashed" : undefined,
                        borderWidth: isWaitlist ? 1 : 0,
                        borderColor: "#1B3A4B",
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9,
                          fontWeight: "600",
                          color: isWaitlist ? "#0A0A0A" : "#FAFAF7",
                        }}
                      >
                        {b.session.class.name}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9,
                          color: isWaitlist ? "#0A0A0A" : "#FAFAF7",
                          opacity: 0.8,
                          fontVariant: ["tabular-nums"],
                        }}
                      >
                        {format(start, "h:mma").toLowerCase()}
                      </Text>
                    </View>
                  );
                })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function DayView({ date }: { date: Date }) {
  const weekStartIso = startOfWeek(date, { weekStartsOn: 1 }).toISOString();
  const bookings = trpc.calendar.day.useQuery({ date: date.toISOString() });
  const balance = trpc.calendar.balance.useQuery({ weekStart: weekStartIso });

  return (
    <View className="gap-4">
      {balance.data ? (
        <SeaglassCard>
          <Text
            className="text-dusk font-sansSemibold uppercase"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            This week
          </Text>
          <Text className="text-[15px] mt-1" style={{ lineHeight: 22 }}>
            <Text style={{ fontVariant: ["tabular-nums"] }}>{balance.data.strength}</Text> strength ·{" "}
            <Text style={{ fontVariant: ["tabular-nums"] }}>{balance.data.cardio}</Text> cardio ·{" "}
            <Text style={{ fontVariant: ["tabular-nums"] }}>{balance.data.recovery}</Text> recovery.{" "}
            <Text className="text-ink-secondary">{balance.data.suggestion}.</Text>
          </Text>
        </SeaglassCard>
      ) : null}

      {(bookings.data ?? []).length === 0 ? (
        <Card className="bg-sand">
          <Text className="font-display text-[20px]">Nothing booked.</Text>
          <Text className="text-sm text-ink-secondary mt-1">
            Open up to {format(date, "EEEE")} by picking something now.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/discover")}
            className="mt-3"
          >
            <Button label="See what's open" />
          </Pressable>
        </Card>
      ) : (
        (bookings.data ?? []).map((b) => {
          const start = new Date(b.session.startTime);
          const end = new Date(b.session.endTime);
          return (
            <View
              key={b.id}
              className="rounded-2xl overflow-hidden"
              style={{
                shadowColor: "#0A0A0A",
                shadowOpacity: 0.04,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View className="bg-dusk p-5">
                <Text
                  className="text-paper/90 font-sansSemibold uppercase"
                  style={{ fontSize: 11, letterSpacing: 0.88, fontVariant: ["tabular-nums"] }}
                >
                  {formatTime(start)} — {formatTime(end)}
                </Text>
                <Text className="font-display text-[20px] text-paper mt-1" style={{ lineHeight: 24 }}>
                  {b.session.class.name}
                </Text>
                <Text className="text-sm text-paper/90 mt-0.5">
                  {b.session.studio.name} · {neighborhoodLabel(b.session.location.neighborhood)}
                  {b.session.instructor ? ` · ${b.session.instructor.name}` : ""}
                </Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

function MonthView({
  year,
  month,
  onDayPress,
}: {
  year: number;
  month: number;
  onDayPress: (d: Date) => void;
}) {
  const monthStart = startOfMonth(new Date(year, month - 1));
  const dim = new Date(year, month, 0).getDate();
  const startWeekday = (monthStart.getDay() + 6) % 7;
  const today = new Date();

  const days = trpc.calendar.month.useQuery({ year, month });
  const byDate = new Map((days.data ?? []).map((d) => [d.date, d]));

  return (
    <View>
      <View className="flex-row mb-1">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <View key={i} className="flex-1 items-center">
            <Text className="text-[11px] text-ink-tertiary">{d}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <View key={`pad-${i}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />
        ))}
        {Array.from({ length: dim }).map((_, i) => {
          const d = addDays(monthStart, i);
          const key = d.toISOString().slice(0, 10);
          const mix = byDate.get(key);
          const isToday = isSameDay(d, today);
          return (
            <Pressable
              key={key}
              onPress={() => onDayPress(d)}
              style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
              className={cn("items-center pt-2", isToday ? "bg-elevated rounded-xl" : "")}
            >
              <Text
                className={cn("text-sm", isToday ? "font-sansSemibold" : "")}
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {format(d, "d")}
              </Text>
              <View className="flex-row gap-0.5 mt-1">
                {mix?.strength ? <View className="h-1 w-1 rounded-full bg-dusk" /> : null}
                {mix?.cardio ? <View className="h-1 w-1 rounded-full bg-coral" /> : null}
                {mix?.recovery ? <View className="h-1 w-1 rounded-full bg-sage" /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
