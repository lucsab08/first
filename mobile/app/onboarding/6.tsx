import { Pressable, Text, View } from "react-native";
import { OnboardingShell } from "@/components/onboarding/shell";
import { Textarea } from "@/components/ui/input";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/components/ui/toast";

const LEVELS: Array<{ id: "new" | "intermediate" | "advanced"; label: string; hint: string }> = [
  { id: "new", label: "New to fitness", hint: "Starting or returning." },
  { id: "intermediate", label: "Intermediate", hint: "You move a few times a week." },
  { id: "advanced", label: "Advanced", hint: "Training hard, often." },
];

export default function Step6() {
  const state = useOnboarding();
  const { experienceLevel, injuries, setField } = state;
  const toast = useToast();
  const completeOnboarding = trpc.auth.completeOnboarding.useMutation({
    onError: (err) => toast.show({ title: "Something went wrong", description: err.message, tone: "coral" }),
  });

  async function save() {
    await completeOnboarding.mutateAsync({
      preferences: {
        goals: state.goals,
        workoutTypes: state.workoutTypes,
        neighborhoods: state.neighborhoods,
        experienceLevel: state.experienceLevel,
        weeklyGoal: state.weeklyGoal,
        unavailableStart: state.unavailableStart,
        unavailableEnd: state.unavailableEnd,
        unavailableDays: state.unavailableDays,
        injuries: state.injuries || null,
      },
    });
  }

  return (
    <OnboardingShell
      step={6}
      title="You"
      subhead="Tell us where you are — it'll help us pick the right classes."
      skippable
      ctaLabel="Find my week"
      onNext={save}
    >
      <View className="gap-3">
        {LEVELS.map((l) => (
          <Pressable
            key={l.id}
            onPress={() => setField("experienceLevel", l.id)}
            className={cn(
              "rounded-2xl px-5 py-4",
              experienceLevel === l.id ? "bg-dusk" : "bg-elevated",
            )}
          >
            <Text
              className={cn(
                "font-sansMedium text-[15px]",
                experienceLevel === l.id ? "text-paper" : "text-ink-primary",
              )}
            >
              {l.label}
            </Text>
            <Text
              className={cn(
                "text-sm",
                experienceLevel === l.id ? "text-paper/80" : "text-ink-secondary",
              )}
            >
              {l.hint}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-6">
        <Text
          className="text-xs text-ink-tertiary mb-2 font-sansSemibold uppercase"
          style={{ letterSpacing: 0.88 }}
        >
          Injuries or limits (optional)
        </Text>
        <Textarea
          value={injuries}
          onChangeText={(v) => setField("injuries", v.slice(0, 200))}
          placeholder="e.g. left knee — low impact preferred"
          maxLength={200}
        />
        <Text
          className="text-xs text-ink-tertiary mt-1 self-end"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {injuries.length}/200
        </Text>
      </View>
    </OnboardingShell>
  );
}
