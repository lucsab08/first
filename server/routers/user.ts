import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { getPreferences, upsertPreferences, userStats, getUser } from "@/server/db/mock";

export const userRouter = createTRPCRouter({
  preferences: protectedProcedure.query(({ ctx }) => getPreferences(ctx.user.id)),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        goals: z.array(z.string()).optional(),
        workoutTypes: z.array(z.string()).optional(),
        neighborhoods: z.array(z.string()).optional(),
        experienceLevel: z.enum(["new", "intermediate", "advanced"]).optional(),
        weeklyGoal: z.number().int().min(2).max(7).optional(),
        unavailableStart: z.string().optional(),
        unavailableEnd: z.string().optional(),
        unavailableDays: z.array(z.number().int()).optional(),
        injuries: z.string().max(200).nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => upsertPreferences(ctx.user.id, input)),

  profile: protectedProcedure.query(({ ctx }) => getUser(ctx.user.id)),

  stats: protectedProcedure.query(({ ctx }) => userStats(ctx.user.id)),
});
