import { create } from "zustand";

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
  setField: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
  toggle: (k: "goals" | "workoutTypes" | "neighborhoods" | "unavailableDays", v: string | number) => void;
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

export const useOnboarding = create<OnboardingStore>((set) => ({
  ...DEFAULTS,
  setField: (k, v) => set({ [k]: v } as Partial<OnboardingData>),
  toggle: (k, v) =>
    set((s) => {
      const cur = s[k] as (string | number)[];
      const exists = cur.includes(v);
      return {
        [k]: exists ? cur.filter((x) => x !== v) : [...cur, v],
      } as Partial<OnboardingData>;
    }),
  reset: () => set(DEFAULTS),
}));
