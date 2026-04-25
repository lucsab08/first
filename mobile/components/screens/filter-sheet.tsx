import { Pressable, ScrollView, Text, View } from "react-native";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { Chip } from "@/components/ui/chip";
import { Button } from "@/components/ui/button";
import { NEIGHBORHOODS, WORKOUT_TYPES } from "@/lib/constants";
import { useFilters } from "@/lib/stores/filters";
import { neighborhoodLabel } from "@/lib/utils";

const TIME_OF_DAY = [
  { id: "early_am", label: "Early AM" },
  { id: "am", label: "AM" },
  { id: "midday", label: "Midday" },
  { id: "pm", label: "PM" },
  { id: "evening", label: "Evening" },
] as const;

export function FilterSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useFilters();

  return (
    <Sheet open={open} onClose={onClose} heightFraction={0.9}>
      <View className="flex-1">
        <View className="px-5 pt-2 flex-row items-center justify-between">
          <Pressable onPress={() => s.reset()}>
            <Text className="text-sm text-ink-secondary underline">Reset</Text>
          </Pressable>
          <Text className="font-display text-[20px] text-ink-primary">Filters</Text>
          <Pressable onPress={onClose} accessibilityLabel="Close">
            <Text className="text-base text-ink-secondary px-2">✕</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-5" contentContainerStyle={{ gap: 28 }}>
          <Group label="Neighborhood">
            <View className="flex-row flex-wrap gap-2">
              {NEIGHBORHOODS.map((n) => (
                <Chip key={n} active={s.neighborhoods.includes(n)} onPress={() => s.toggle("neighborhoods", n)}>
                  {neighborhoodLabel(n)}
                </Chip>
              ))}
            </View>
          </Group>

          <Group label="Class type">
            <View className="flex-row flex-wrap gap-2">
              {WORKOUT_TYPES.map((t) => (
                <Chip key={t} active={s.types.includes(t)} onPress={() => s.toggle("types", t)} className="capitalize">
                  {t}
                </Chip>
              ))}
            </View>
          </Group>

          <Group label="Time of day">
            <View className="flex-row flex-wrap gap-2">
              {TIME_OF_DAY.map((t) => (
                <Chip
                  key={t.id}
                  active={s.timeOfDay === t.id}
                  onPress={() => s.set({ timeOfDay: s.timeOfDay === t.id ? null : t.id })}
                >
                  {t.label}
                </Chip>
              ))}
            </View>
          </Group>

          <Group label="Intensity">
            <View className="flex-row flex-wrap gap-2">
              {(["low", "medium", "high"] as const).map((i) => (
                <Chip
                  key={i}
                  active={s.intensity === i}
                  onPress={() => s.set({ intensity: s.intensity === i ? null : i })}
                  className="capitalize"
                >
                  {i}
                </Chip>
              ))}
            </View>
          </Group>

          <Group label="Beginner-friendly">
            <Pressable
              onPress={() => s.set({ beginnerFriendly: !s.beginnerFriendly })}
              className="flex-row items-center justify-between"
            >
              <Text className="text-[15px] text-ink-secondary">
                Show classes that welcome new folks
              </Text>
              <View
                className={`h-7 w-12 rounded-full justify-center px-0.5 ${
                  s.beginnerFriendly ? "bg-dusk" : "bg-hairline"
                }`}
              >
                <View
                  className="h-6 w-6 rounded-full bg-paper"
                  style={{ transform: [{ translateX: s.beginnerFriendly ? 20 : 0 }] }}
                />
              </View>
            </Pressable>
          </Group>
        </ScrollView>

        <View className="px-5 py-4 border-t border-hairline bg-surface">
          <Button block label="Apply filters" onPress={onClose} />
        </View>
      </View>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text
        className="text-ink-tertiary font-sansSemibold uppercase mb-3"
        style={{ fontSize: 11, letterSpacing: 0.88 }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
