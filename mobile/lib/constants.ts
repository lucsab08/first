export const NEIGHBORHOODS = [
  "brickell",
  "wynwood",
  "south_beach",
  "mid_beach",
  "coconut_grove",
  "coral_gables",
  "midtown",
  "design_district",
  "edgewater",
  "downtown",
  "key_biscayne",
  "aventura",
] as const;

export type Neighborhood = (typeof NEIGHBORHOODS)[number];

export const WORKOUT_TYPES = [
  "pilates",
  "boxing",
  "yoga",
  "hiit",
  "strength",
  "bootcamp",
  "cycling",
  "run",
] as const;

export type WorkoutType = (typeof WORKOUT_TYPES)[number];

export const GOALS = [
  { id: "build_strength", label: "Build strength" },
  { id: "improve_flexibility", label: "Improve flexibility" },
  { id: "lose_weight", label: "Lose weight" },
  { id: "train_event", label: "Train for an event" },
  { id: "stress_relief", label: "Stress relief" },
  { id: "stay_consistent", label: "Stay consistent" },
] as const;

export const FREE_COACH_MESSAGE_LIMIT = 3;

export const SYNCFIT_PLUS_PRODUCT_ID = "syncfit_plus_monthly";
