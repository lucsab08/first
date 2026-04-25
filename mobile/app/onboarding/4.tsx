import { Text, TextInput, View } from "react-native";
import { OnboardingShell } from "@/components/onboarding/shell";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/lib/stores/onboarding";

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
  { n: 0, label: "Sun" },
];

export default function Step4() {
  const { unavailableStart, unavailableEnd, unavailableDays, setField, toggle } = useOnboarding();

  return (
    <OnboardingShell
      step={4}
      title="When are you usually busy?"
      subhead="Work hours, caregiving, commuting — anything we should work around."
      skippable
      onNext={() => {}}
    >
      <View className="gap-4">
        <View>
          <Text
            className="text-xs text-ink-tertiary mb-2 font-sansSemibold uppercase"
            style={{ letterSpacing: 0.88 }}
          >
            Busy hours
          </Text>
          <View className="flex-row items-center gap-3">
            <Input
              value={unavailableStart}
              onChangeText={(v) => setField("unavailableStart", v)}
              placeholder="09:00"
              className="flex-1"
            />
            <Text className="text-ink-tertiary">to</Text>
            <Input
              value={unavailableEnd}
              onChangeText={(v) => setField("unavailableEnd", v)}
              placeholder="18:00"
              className="flex-1"
            />
          </View>
        </View>
        <View>
          <Text
            className="text-xs text-ink-tertiary mb-2 font-sansSemibold uppercase"
            style={{ letterSpacing: 0.88 }}
          >
            Busy days
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DAYS.map((d) => (
              <Chip
                key={d.n}
                active={unavailableDays.includes(d.n)}
                onPress={() => toggle("unavailableDays", d.n)}
              >
                {d.label}
              </Chip>
            ))}
          </View>
        </View>
      </View>
    </OnboardingShell>
  );
}
