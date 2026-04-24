"use client";

import { OnboardingShell } from "../shell";
import { Textarea } from "@/components/ui/input";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
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

  async function handleSave() {
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
      onNext={handleSave}
    >
      <div className="space-y-3">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setField("experienceLevel", l.id)}
            className={cn(
              "w-full flex flex-col items-start gap-0.5 rounded-2xl px-5 py-4 text-left tap transition-colors",
              experienceLevel === l.id ? "bg-dusk text-paper" : "bg-elevated text-ink-primary",
            )}
          >
            <span className="font-medium text-[15px]">{l.label}</span>
            <span
              className={cn(
                "text-sm",
                experienceLevel === l.id ? "text-paper/80" : "text-ink-secondary",
              )}
            >
              {l.hint}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-xs text-ink-tertiary mb-2 label-uppercase">Injuries or limits (optional)</p>
        <Textarea
          placeholder="e.g. left knee — low impact preferred"
          maxLength={200}
          value={injuries}
          onChange={(e) => setField("injuries", e.target.value)}
        />
        <p className="text-xs text-ink-tertiary mt-1 text-right tabular">{injuries.length}/200</p>
      </div>
    </OnboardingShell>
  );
}
