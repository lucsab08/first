"use client";

import { OnboardingShell } from "../shell";
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
  const {
    unavailableStart,
    unavailableEnd,
    unavailableDays,
    setField,
    toggleArrayField,
  } = useOnboarding();

  return (
    <OnboardingShell
      step={4}
      title="When are you usually busy?"
      subhead="Work hours, caregiving, commuting — anything we should work around."
      skippable
      onNext={() => {}}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-ink-tertiary mb-2 label-uppercase">Busy hours</p>
          <div className="flex items-center gap-3">
            <Input
              type="time"
              value={unavailableStart}
              onChange={(e) => setField("unavailableStart", e.target.value)}
              className="flex-1"
            />
            <span className="text-ink-tertiary text-sm">to</span>
            <Input
              type="time"
              value={unavailableEnd}
              onChange={(e) => setField("unavailableEnd", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div>
          <p className="text-xs text-ink-tertiary mb-2 label-uppercase">Busy days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => (
              <Chip
                key={d.n}
                active={unavailableDays.includes(d.n)}
                onClick={() => toggleArrayField("unavailableDays", d.n)}
              >
                {d.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>
    </OnboardingShell>
  );
}
