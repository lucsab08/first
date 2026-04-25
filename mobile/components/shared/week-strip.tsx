import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { Check } from "lucide-react-native";
import { cn } from "@/lib/utils";

type Dot = { date: string; day: number; completed: boolean; booked: boolean };

export function WeekStrip({ weekStart, dots }: { weekStart?: Date; dots: Dot[] }) {
  const anchor = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  const today = new Date();

  return (
    <View className="flex-row gap-2 justify-between">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(anchor, i);
        const dot = dots.find((x) => isSameDay(new Date(x.date), d));
        const isToday = isSameDay(d, today);
        return (
          <Pressable
            key={i}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/calendar",
                params: { date: d.toISOString().slice(0, 10) },
              })
            }
            className={cn(
              "flex-1 items-center gap-1.5 py-2 rounded-xl",
              isToday ? "bg-elevated" : "",
            )}
          >
            <Text className="text-[11px] text-ink-tertiary">{format(d, "EEEEE")}</Text>
            <Text
              className="text-sm font-sansMedium text-ink-primary"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {format(d, "d")}
            </Text>
            {dot?.completed ? (
              <View className="h-5 w-5 rounded-full bg-sage items-center justify-center">
                <Check size={12} color="#FAFAF7" strokeWidth={3} />
              </View>
            ) : dot?.booked ? (
              <View className="h-5 w-5 rounded-full bg-dusk" />
            ) : (
              <View className="h-5 w-5 rounded-full border border-hairline" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
