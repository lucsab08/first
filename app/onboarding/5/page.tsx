"use client";

import { OnboardingShell } from "../shell";
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
      <div className="rounded-2xl bg-elevated p-1 flex">
        {OPTIONS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setField("weeklyGoal", v)}
            className={cn(
              "flex-1 h-12 rounded-xl font-medium text-[15px] tabular transition-colors",
              weeklyGoal === v ? "bg-surface text-ink-primary shadow-card" : "text-ink-secondary",
            )}
          >
            {v === 6 ? "6+" : v}
          </button>
        ))}
      </div>
      <p className="mt-6 font-display text-[20px] leading-snug">{previewLine(weeklyGoal)}</p>
    </OnboardingShell>
  );
}
