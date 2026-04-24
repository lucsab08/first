"use client";

import { OnboardingShell } from "../shell";
import { Chip } from "@/components/ui/chip";
import { GOALS } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";

export default function Step1() {
  const { goals, toggleArrayField } = useOnboarding();
  const valid = goals.length >= 1 && goals.length <= 3;

  return (
    <OnboardingShell
      step={1}
      title="What brings you here?"
      subhead="Pick up to three."
      ctaDisabled={!valid}
      onNext={() => {}}
    >
      <div className="flex flex-wrap gap-2">
        {GOALS.map((g) => {
          const active = goals.includes(g.id);
          const disabled = !active && goals.length >= 3;
          return (
            <Chip
              key={g.id}
              active={active}
              onClick={() => toggleArrayField("goals", g.id)}
              disabled={disabled}
              className={disabled ? "opacity-40" : undefined}
            >
              {g.label}
            </Chip>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
