"use client";

import { create } from "zustand";

export type FilterState = {
  neighborhoods: string[];
  types: string[];
  intensity: "low" | "medium" | "high" | null;
  timeOfDay: "early_am" | "am" | "midday" | "pm" | "evening" | null;
  priceMinCents: number;
  priceMaxCents: number;
  beginnerFriendly: boolean;
};

type FilterStore = FilterState & {
  set: (patch: Partial<FilterState>) => void;
  toggle: (key: "neighborhoods" | "types", v: string) => void;
  reset: () => void;
};

const DEFAULTS: FilterState = {
  neighborhoods: [],
  types: [],
  intensity: null,
  timeOfDay: null,
  priceMinCents: 1000,
  priceMaxCents: 6000,
  beginnerFriendly: false,
};

export const useFilters = create<FilterStore>((set) => ({
  ...DEFAULTS,
  set: (patch) => set((s) => ({ ...s, ...patch })),
  toggle: (key, v) =>
    set((s) => {
      const current = s[key];
      return {
        [key]: current.includes(v) ? current.filter((x) => x !== v) : [...current, v],
      } as Partial<FilterState>;
    }),
  reset: () => set(DEFAULTS),
}));

export function activeFilterCount(s: FilterState): number {
  let n = 0;
  n += s.neighborhoods.length;
  n += s.types.length;
  if (s.intensity) n += 1;
  if (s.timeOfDay) n += 1;
  if (s.priceMaxCents < 6000) n += 1;
  if (s.beginnerFriendly) n += 1;
  return n;
}
