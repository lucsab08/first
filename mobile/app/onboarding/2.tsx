import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { OnboardingShell } from "@/components/onboarding/shell";
import { WORKOUT_TYPES } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";

const CARDS: Array<{ id: (typeof WORKOUT_TYPES)[number]; label: string; image: string }> = [
  { id: "pilates", label: "Pilates", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&q=80" },
  { id: "boxing", label: "Boxing", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80" },
  { id: "yoga", label: "Yoga", image: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=600&q=80" },
  { id: "hiit", label: "HIIT", image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=600&q=80" },
  { id: "strength", label: "Strength", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&q=80" },
  { id: "bootcamp", label: "Bootcamp", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80" },
  { id: "cycling", label: "Cycling", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&q=80" },
  { id: "run", label: "Run Club", image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=600&q=80" },
];

export default function Step2() {
  const { workoutTypes, toggle } = useOnboarding();
  const valid = workoutTypes.length >= 1;

  return (
    <OnboardingShell
      step={2}
      title="What do you like to do?"
      subhead="Pick anything that sounds right. You can change it later."
      ctaDisabled={!valid}
      onNext={() => {}}
    >
      <View className="flex-row flex-wrap" style={{ gap: 12 }}>
        {CARDS.map((c) => {
          const active = workoutTypes.includes(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => toggle("workoutTypes", c.id)}
              style={{ width: "48%", aspectRatio: 3 / 4 }}
              className={cn(
                "rounded-2xl overflow-hidden relative",
                active ? "border-2 border-dusk" : "",
              )}
            >
              <Image
                source={{ uri: c.image }}
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <View
                className="absolute inset-0"
                style={{ backgroundColor: "rgba(10,10,10,0.35)" }}
              />
              <View className="absolute bottom-0 left-0 right-0 p-3">
                <Text className="text-paper font-sansMedium text-[15px]">{c.label}</Text>
              </View>
              {active ? (
                <View className="absolute top-3 right-3 h-6 w-6 rounded-full bg-paper items-center justify-center">
                  <View className="h-3 w-3 rounded-full bg-dusk" />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </OnboardingShell>
  );
}
