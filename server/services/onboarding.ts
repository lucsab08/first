import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users, userPreferences } from "@/server/db/schema";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

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

type AuthUser = {
  id: string;
  email: string;
  fullName?: string | null;
};

export async function ensureUserRow(user: AuthUser): Promise<void> {
  if (!db) return;
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email,
      fullName: user.fullName ?? null,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email: user.email,
        updatedAt: new Date(),
      },
    });
}

export async function upsertUserPreferences(
  userId: string,
  prefs: OnboardingPreferences
): Promise<void> {
  if (!db) return;
  await db
    .insert(userPreferences)
    .values({
      userId: userId,
      goals: prefs.goals,
      workoutTypes: prefs.workoutTypes,
      neighborhoods: prefs.neighborhoods,
      experienceLevel: prefs.experienceLevel,
      weeklyGoal: prefs.weeklyGoal,
      unavailableStart: prefs.unavailableStart,
      unavailableEnd: prefs.unavailableEnd,
      unavailableDays: prefs.unavailableDays,
      injuries: prefs.injuries,
    })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: {
        goals: prefs.goals,
        workoutTypes: prefs.workoutTypes,
        neighborhoods: prefs.neighborhoods,
        experienceLevel: prefs.experienceLevel,
        weeklyGoal: prefs.weeklyGoal,
        unavailableStart: prefs.unavailableStart,
        unavailableEnd: prefs.unavailableEnd,
        unavailableDays: prefs.unavailableDays,
        injuries: prefs.injuries,
        updatedAt: new Date(),
      },
    });
}

export async function persistOnboardingPreferences(
  user: AuthUser,
  prefs: OnboardingPreferences
): Promise<void> {
  await ensureUserRow(user);
  await upsertUserPreferences(user.id, prefs);
}

export async function finalizeOnboardingForUser(user: AuthUser): Promise<void> {
  const now = new Date();

  if (db) {
    await db
      .update(users)
      .set({ onboardedAt: now, updatedAt: now })
      .where(eq(users.id, user.id));
  }

  const supabase = createSupabaseServiceClient();
  if (!supabase) {
    throw new Error(
      "[onboarding] SUPABASE_SERVICE_ROLE_KEY not configured — cannot finalize onboarding."
    );
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { onboarded_at: now.toISOString() },
  });

  if (error) {
    throw new Error(`[onboarding] Failed to set auth metadata: ${error.message}`);
  }
}