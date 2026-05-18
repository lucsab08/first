"use client";

import { OnboardingShell } from "../shell";
import { WORKOUT_TYPES } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";

const CHIPS: Array<{ id: (typeof WORKOUT_TYPES)[number]; label: string }> = [
  { id: "pilates", label: "Pilates" },
  { id: "boxing", label: "Boxing" },
  { id: "yoga", label: "Yoga" },
  { id: "hiit", label: "HIIT" },
  { id: "strength", label: "Strength" },
  { id: "bootcamp", label: "Bootcamp" },
  { id: "cycling", label: "Cycling" },
  { id: "run", label: "Run" },
];

export default function Step2() {
  const { workoutTypes, toggleArrayField } = useOnboarding();
  const valid = workoutTypes.length >= 1;

  return (
    <OnboardingShell
      step={2}
      title="What do you like to do?"
      subhead="Pick anything that sounds right. You can change it later."
      ctaDisabled={!valid}
      onNext={() => {}}
    >
      <div className="flex flex-wrap gap-2">
        {CHIPS.map((c) => {
          const active = workoutTypes.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleArrayField("workoutTypes", c.id)}
              className={cn(
                "rounded-full px-4 py-2.5 text-[15px] font-medium tap transition-colors duration-[120ms] ease-ios",
                active ? "bg-dusk text-paper" : "bg-elevated text-ink-primary",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
