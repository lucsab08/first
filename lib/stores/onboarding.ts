"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingData = {
  goals: string[];
  workoutTypes: string[];
  neighborhoods: string[];
  unavailableStart: string;
  unavailableEnd: string;
  unavailableDays: number[];
  weeklyGoal: number;
  experienceLevel: "new" | "intermediate" | "advanced";
  injuries: string;
};

type OnboardingStore = OnboardingData & {
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  toggleArrayField: (key: "goals" | "workoutTypes" | "neighborhoods" | "unavailableDays", v: string | number) => void;
  reset: () => void;
};

const DEFAULTS: OnboardingData = {
  goals: [],
  workoutTypes: [],
  neighborhoods: [],
  unavailableStart: "09:00",
  unavailableEnd: "18:00",
  unavailableDays: [1, 2, 3, 4, 5],
  weeklyGoal: 4,
  experienceLevel: "intermediate",
  injuries: "",
};

export const useOnboarding = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setField: (key, value) => set({ [key]: value } as Partial<OnboardingData>),
      toggleArrayField: (key, v) =>
        set((state) => {
          const current = state[key] as (string | number)[];
          const exists = current.includes(v);
          return {
            [key]: exists ? current.filter((x) => x !== v) : [...current, v],
          } as Partial<OnboardingData>;
        }),
      reset: () => set(DEFAULTS),
    }),
    { name: "syncfit-onboarding" },
  ),
);
