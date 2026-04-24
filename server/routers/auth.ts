import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
import {
  getUser,
  getPreferences,
  upsertPreferences,
  markOnboarded,
} from "@/server/db/mock";

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
    .input(z.object({ preferences: preferencesSchema }))
    .mutation(({ ctx, input }) => {
      upsertPreferences(ctx.user.id, {
        goals: input.preferences.goals,
        workoutTypes: input.preferences.workoutTypes,
        neighborhoods: input.preferences.neighborhoods,
        experienceLevel: input.preferences.experienceLevel,
        weeklyGoal: input.preferences.weeklyGoal,
        unavailableStart: input.preferences.unavailableStart,
        unavailableEnd: input.preferences.unavailableEnd,
        unavailableDays: input.preferences.unavailableDays,
        injuries: input.preferences.injuries ?? null,
      });
      markOnboarded(ctx.user.id);
      return { ok: true };
    }),
});
