"use client";

import { OnboardingShell } from "../shell";
import { WORKOUT_TYPES } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";
import { cn } from "@/lib/utils";

const CARDS: Array<{ id: (typeof WORKOUT_TYPES)[number]; label: string; image: string }> = [
  { id: "pilates", label: "Pilates", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80" },
  { id: "boxing", label: "Boxing", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80" },
  { id: "yoga", label: "Yoga", image: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80" },
  { id: "hiit", label: "HIIT", image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&q=80" },
  { id: "strength", label: "Strength", image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&q=80" },
  { id: "bootcamp", label: "Bootcamp", image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80" },
  { id: "cycling", label: "Cycling", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80" },
  { id: "run", label: "Run Club", image: "https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&q=80" },
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
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((c) => {
          const active = workoutTypes.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleArrayField("workoutTypes", c.id)}
              className={cn(
                "relative aspect-[3/4] rounded-2xl overflow-hidden tap transition-all duration-[120ms] ease-ios",
                active ? "ring-2 ring-dusk scale-[1.02]" : "ring-0",
              )}
            >
              <img src={c.image} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
              <div className="photo-overlay absolute inset-0" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                <span className="text-paper font-medium text-[15px]">{c.label}</span>
              </div>
              {active ? (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-paper flex items-center justify-center">
                  <div className="h-3 w-3 rounded-full bg-dusk" />
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </OnboardingShell>
  );
}
