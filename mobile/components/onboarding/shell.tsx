import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OnboardingProgress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <View className="flex-row gap-1.5 flex-1">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full",
            i < step ? "bg-dusk" : "bg-hairline",
          )}
        />
      ))}
    </View>
  );
}

export function OnboardingShell({
  step,
  total = 6,
  title,
  subhead,
  children,
  skippable,
  ctaLabel,
  ctaDisabled,
  onNext,
}: {
  step: number;
  total?: number;
  title: string;
  subhead?: string;
  children: React.ReactNode;
  skippable?: boolean;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  onNext: () => Promise<void> | void;
}) {
  const insets = useSafeAreaInsets();
  const nextPath = step < total ? `/onboarding/${step + 1}` : "/onboarding/complete";

  async function handleNext() {
    await onNext();
    router.push(nextPath as never);
  }

  return (
    <View
      className="flex-1 px-5 bg-paper"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
    >
      <View className="flex-row items-center gap-4 pt-2 pb-2">
        <OnboardingProgress step={step} total={total} />
        {skippable ? (
          <Pressable onPress={() => router.push(nextPath as never)}>
            <Text className="text-sm text-ink-tertiary">Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          className="font-display text-[28px] text-ink-primary"
          style={{ lineHeight: 32 }}
        >
          {title}
        </Text>
        {subhead ? (
          <Text className="text-[15px] text-ink-secondary mt-2" style={{ lineHeight: 20 }}>
            {subhead}
          </Text>
        ) : null}
        <View className="mt-8">{children}</View>
      </ScrollView>

      <Button block label={ctaLabel ?? "Continue"} onPress={handleNext} disabled={ctaDisabled} />
    </View>
  );
}
