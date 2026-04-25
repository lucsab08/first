import { Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/lib/stores/onboarding";
import { trpc } from "@/lib/trpc";
import { firstName, neighborhoodLabel } from "@/lib/utils";
import { GOALS } from "@/lib/constants";

export default function OnboardingComplete() {
  const insets = useSafeAreaInsets();
  const state = useOnboarding();
  const me = trpc.auth.me.useQuery();
  const name = firstName(me.data?.fullName ?? null);
  const goalLabels = state.goals
    .map((g) => GOALS.find((x) => x.id === g)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <View
      className="flex-1 bg-paper px-5"
      style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 16 }}
    >
      <Text className="font-display text-[32px]" style={{ lineHeight: 36 }}>
        You're in, {name}.
      </Text>
      <Text className="text-ink-secondary mt-2">
        Here's what we've got. You can tweak any of it later under You → Preferences.
      </Text>

      <View className="mt-6 gap-3">
        <Card>
          <Text
            className="text-ink-tertiary font-sansSemibold uppercase"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            Goals
          </Text>
          <Text className="font-sansMedium mt-1">{goalLabels || "—"}</Text>
        </Card>
        <Card>
          <Text
            className="text-ink-tertiary font-sansSemibold uppercase"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            Favorites
          </Text>
          <Text className="font-sansMedium mt-1 capitalize">
            {state.workoutTypes.join(" · ")}
          </Text>
        </Card>
        <Card>
          <Text
            className="text-ink-tertiary font-sansSemibold uppercase"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            Neighborhoods
          </Text>
          <Text className="font-sansMedium mt-1">
            {state.neighborhoods.map(neighborhoodLabel).join(" · ")}
          </Text>
        </Card>
        <Card>
          <Text
            className="text-ink-tertiary font-sansSemibold uppercase"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            Target
          </Text>
          <Text
            className="font-sansMedium mt-1"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {state.weeklyGoal} classes / week
          </Text>
        </Card>
      </View>

      <View className="flex-1" />

      <Button
        block
        label="Let's find your week"
        onPress={() => router.replace("/(tabs)/today")}
      />
    </View>
  );
}
