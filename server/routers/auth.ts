import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
import { isDatabaseConnected } from "@/server/db/client";
import {
  getUser,
  getPreferences,
  upsertPreferences,
  markOnboarded,
} from "@/server/db/mock";
import {
  persistOnboardingPreferences,
  finalizeOnboardingForUser,
} from "@/server/services/onboarding";

const preferencesSchema = z.object({
  goals: z.array(z.string()).min(1).max(3),
  workoutTypes: z.array(z.string()).min(1),
  neighborhoods: z.array(z.string()).min(1),
  experienceLevel: z.enum(["new", "intermediate", "advanced"]),
  weeklyGoal: z.number().int().min(2).max(7),
  unavailableStart: z.string().regex(/^\d{2}:\d{2}$/),
  unavailableEnd: z.string().regex(/^\d{2}:\d{2}$/),
  unavailableDays: z.array(z.number().int().min(0).max(6)),
  injuries: z.string().max(200).nullable().optional(),
});

function toPreferencesPayload(preferences: z.infer<typeof preferencesSchema>) {
  return {
    goals: preferences.goals,
    workoutTypes: preferences.workoutTypes,
    neighborhoods: preferences.neighborhoods,
    experienceLevel: preferences.experienceLevel,
    weeklyGoal: preferences.weeklyGoal,
    unavailableStart: preferences.unavailableStart,
    unavailableEnd: preferences.unavailableEnd,
    unavailableDays: preferences.unavailableDays,
    injuries: preferences.injuries ?? null,
  };
}

export const authRouter = createTRPCRouter({
  me: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return null;
    const u = getUser(ctx.user.id);
    const prefs = getPreferences(ctx.user.id);
    return {
      id: ctx.user.id,
      email: ctx.user.email,
      fullName: u?.fullName ?? ctx.user.fullName,
      avatarUrl: u?.avatarUrl ?? null,
      homeNeighborhood: u?.homeNeighborhood ?? null,
      workNeighborhood: u?.workNeighborhood ?? null,
      onboardedAt: u?.onboardedAt ?? ctx.user.onboardedAt,
      preferences: prefs,
    };
  }),

  completeOnboarding: protectedProcedure
    .input(
      z.object({
        preferences: preferencesSchema,
        finalize: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const preferences = toPreferencesPayload(input.preferences);

      if (!isDatabaseConnected) {
        console.warn(
          "[onboarding] DATABASE_URL not detected, falling back to mock storage — preferences will NOT persist.",
        );
        upsertPreferences(ctx.user.id, preferences);
        if (input.finalize) {
          markOnboarded(ctx.user.id);
        }
        return { ok: true };
      }

      await persistOnboardingPreferences(ctx.user, preferences);

      if (input.finalize) {
        await finalizeOnboardingForUser(ctx.user);
      }

      return { ok: true };
    }),
});
