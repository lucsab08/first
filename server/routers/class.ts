import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
import {
  allSessions,
  getSessionById,
  getTrendingSessions,
  rankedRecommendations,
} from "@/server/db/mock";
import { CLASSES, LOCATIONS, INSTRUCTORS, STUDIOS } from "@/server/db/fixtures";
import { isAfter, isSameDay } from "date-fns";

const hydrateSession = (s: ReturnType<typeof getSessionById>) => {
  if (!s) return null;
  const cls = CLASSES.find((c) => c.id === s.classId)!;
  const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
  const inst = INSTRUCTORS.find((i) => i.id === s.instructorId) ?? null;
  const studio = STUDIOS.find((st) => st.id === cls.studioId)!;
  return {
    ...s,
    class: cls,
    location: loc,
    instructor: inst,
    studio,
  };
};

export const classRouter = createTRPCRouter({
  search: publicProcedure
    .input(
      z
        .object({
          types: z.array(z.string()).optional(),
          neighborhoods: z.array(z.string()).optional(),
          intensity: z.enum(["low", "medium", "high"]).optional(),
          day: z.string().optional(), // ISO date
          timeOfDay: z.enum(["early_am", "am", "midday", "pm", "evening"]).optional(),
          beginnerFriendly: z.boolean().optional(),
          priceMaxCents: z.number().int().optional(),
          cursor: z.string().nullish(),
          limit: z.number().int().max(50).default(30),
        })
        .optional(),
    )
    .query(({ input }) => {
      const now = new Date();
      const i = input ?? {};
      let sessions = allSessions().filter((s) => isAfter(s.endTime, now));
      sessions = sessions.filter((s) => {
        const cls = CLASSES.find((c) => c.id === s.classId)!;
        const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
        if (i.types?.length && !i.types.includes(cls.type)) return false;
        if (i.neighborhoods?.length && !i.neighborhoods.includes(loc.neighborhood)) return false;
        if (i.intensity && cls.intensity !== i.intensity) return false;
        if (i.beginnerFriendly && !cls.beginnerFriendly) return false;
        if (i.priceMaxCents && cls.priceCents > i.priceMaxCents) return false;
        if (i.day) {
          const target = new Date(i.day);
          if (!isSameDay(s.startTime, target)) return false;
        }
        if (i.timeOfDay) {
          const h = s.startTime.getHours();
          const bucket =
            h < 8 ? "early_am" : h < 11 ? "am" : h < 14 ? "midday" : h < 17 ? "pm" : "evening";
          if (bucket !== i.timeOfDay) return false;
        }
        return true;
      });
      sessions = sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      const items = sessions.slice(0, i.limit ?? 30).map((s) => hydrateSession(s)!);
      return { items, nextCursor: null };
    }),

  sessionById: publicProcedure.input(z.object({ id: z.string() })).query(({ input }) => {
    return hydrateSession(getSessionById(input.id));
  }),

  trending: publicProcedure
    .input(z.object({ limit: z.number().int().default(10) }).optional())
    .query(({ input }) =>
      getTrendingSessions(input?.limit ?? 10).map((s) => hydrateSession(s)!),
    ),

  recommendedFor: protectedProcedure
    .input(z.object({ limit: z.number().int().default(5) }).optional())
    .query(({ ctx, input }) =>
      rankedRecommendations(ctx.user.id, input?.limit ?? 5).map((s) => hydrateSession(s)!),
    ),
});
