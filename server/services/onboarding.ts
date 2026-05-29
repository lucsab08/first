import { eq, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, userPreferences } from "@/server/db/schema";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/server/auth";

export type OnboardingPreferences = {
  goals: string[];
  workoutTypes: string[];
  neighborhoods: string[];
  experienceLevel: "new" | "intermediate" | "advanced";
  weeklyGoal: number;
  unavailableStart: string;
  unavailableEnd: string;
  unavailableDays: number[];
  injuries: string | null;
};

export async function ensureUserRow(user: SessionUser): Promise<void> {
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        fullName: user.fullName,
        updatedAt: sql`now()`,
      },
    });
}

export async function upsertUserPreferences(
  userId: string,
  preferences: OnboardingPreferences,
): Promise<void> {
  await db
    .insert(userPreferences)
    .values({
      userId,
      goals: preferences.goals,
      workoutTypes: preferences.workoutTypes,
      neighborhoods: preferences.neighborhoods,
      experienceLevel: preferences.experienceLevel,
      weeklyGoal: preferences.weeklyGoal,
      unavailableStart: preferences.unavailableStart,
      unavailableEnd: preferences.unavailableEnd,
      unavailableDays: preferences.unavailableDays,
      injuries: preferences.injuries,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        goals: preferences.goals,
        workoutTypes: preferences.workoutTypes,
        neighborhoods: preferences.neighborhoods,
        experienceLevel: preferences.experienceLevel,
        weeklyGoal: preferences.weeklyGoal,
        unavailableStart: preferences.unavailableStart,
        unavailableEnd: preferences.unavailableEnd,
        unavailableDays: preferences.unavailableDays,
        injuries: preferences.injuries,
        updatedAt: sql`now()`,
      },
    });
}

export async function persistOnboardingPreferences(
  user: SessionUser,
  preferences: OnboardingPreferences,
): Promise<void> {
  await ensureUserRow(user);
  await upsertUserPreferences(user.id, preferences);
}

export async function finalizeOnboardingForUser(user: SessionUser): Promise<void> {
  const onboardedAt = new Date();
  const onboardedAtIso = onboardedAt.toISOString();

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error(
      "Supabase service client unavailable — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { onboarded_at: onboardedAtIso },
  });
  if (error) throw error;

  await db
    .update(users)
    .set({ onboardedAt, updatedAt: onboardedAt })
    .where(eq(users.id, user.id));
}
