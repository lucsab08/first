import { View } from "react-native";
import { OnboardingShell } from "@/components/onboarding/shell";
import { Chip } from "@/components/ui/chip";
import { NEIGHBORHOODS } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";
import { neighborhoodLabel } from "@/lib/utils";

export default function Step3() {
  const { neighborhoods, toggle } = useOnboarding();
  const valid = neighborhoods.length >= 1;

  return (
    <OnboardingShell
      step={3}
      title="Where are you moving?"
      subhead="We'll surface studios nearby."
      ctaDisabled={!valid}
      onNext={() => {}}
    >
      <View className="flex-row flex-wrap gap-2">
        {NEIGHBORHOODS.map((n) => (
          <Chip
            key={n}
            active={neighborhoods.includes(n)}
            onPress={() => toggle("neighborhoods", n)}
          >
            {neighborhoodLabel(n)}
          </Chip>
        ))}
      </View>
    </OnboardingShell>
  );
}
