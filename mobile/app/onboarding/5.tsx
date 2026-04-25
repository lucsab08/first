import { Pressable, Text, View } from "react-native";
import { OnboardingShell } from "@/components/onboarding/shell";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";

const OPTIONS = [2, 3, 4, 5, 6];

function previewLine(goal: number) {
  if (goal <= 2) return `${goal} classes a week — a soft rhythm.`;
  if (goal === 3) return `${goal} classes a week — every other day-ish.`;
  if (goal === 4) return `${goal} classes a week, roughly every other day.`;
  if (goal === 5) return `${goal} classes a week — most days, one rest.`;
  return `${goal}+ classes a week — you'll want two recovery days.`;
}

export default function Step5() {
  const { weeklyGoal, setField } = useOnboarding();
  return (
    <OnboardingShell
      step={5}
      title="How many classes a week?"
      subhead="We'll target this when planning."
      onNext={() => {}}
    >
      <View className="rounded-2xl bg-elevated p-1 flex-row">
        {OPTIONS.map((v) => {
          const active = weeklyGoal === v;
          return (
            <Pressable
              key={v}
              onPress={() => setField("weeklyGoal", v)}
              className={cn(
                "flex-1 h-12 rounded-xl items-center justify-center",
                active ? "bg-surface" : "",
              )}
              style={
                active
                  ? {
                      shadowColor: "#0A0A0A",
                      shadowOpacity: 0.04,
                      shadowRadius: 20,
                      shadowOffset: { width: 0, height: 2 },
                    }
                  : undefined
              }
            >
              <Text
                className={cn("font-sansMedium", active ? "text-ink-primary" : "text-ink-secondary")}
                style={{ fontSize: 15, fontVariant: ["tabular-nums"] }}
              >
                {v === 6 ? "6+" : v}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text className="font-display text-[20px] mt-6" style={{ lineHeight: 24 }}>
        {previewLine(weeklyGoal)}
      </Text>
    </OnboardingShell>
  );
}
