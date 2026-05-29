import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { db, schema } from "@/server/db/client";
import type { SessionUser } from "@/server/auth";

export type OnboardingPreferencesInput = {
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

async function ensureUserRow(user: SessionUser) {
  await db
    .insert(schema.users)
    .values({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: user.email,
        fullName: user.fullName,
        updatedAt: new Date(),
      },
    });
}

async function upsertUserPreferences(userId: string, preferences: OnboardingPreferencesInput) {
  await db
    .insert(schema.userPreferences)
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
      target: schema.userPreferences.userId,
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
        updatedAt: new Date(),
      },
    });
}

async function finalizeOnboarding(user: SessionUser) {
  const onboardedAt = new Date();

  const supabase = createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.updateUser({
      data: { onboarded_at: onboardedAt.toISOString() },
    });
    if (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message,
      });
    }
  }

  await db
    .update(schema.users)
    .set({ onboardedAt, updatedAt: onboardedAt })
    .where(eq(schema.users.id, user.id));
}

export async function persistOnboardingPreferences(
  user: SessionUser,
  preferences: OnboardingPreferencesInput,
) {
  await ensureUserRow(user);
  await upsertUserPreferences(user.id, preferences);
}

export async function finalizeOnboardingForUser(user: SessionUser) {
  await finalizeOnboarding(user);
}
