import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "@/server/trpc";
import {
  getClassesForStudio,
  getInstructorsForStudio,
  getLocationsForStudio,
  getReviewsForStudio,
  getStudioBySlug,
  getStudioById,
  getUpcomingSessionsForStudio,
  listFavoritesForUser,
  listStudios,
  toggleFavorite,
} from "@/server/db/mock";
import { CLASSES, LOCATIONS } from "@/server/db/fixtures";

export const studioRouter = createTRPCRouter({
  list: publicProcedure
    .input(
      z
        .object({
          neighborhood: z.string().optional(),
          type: z.string().optional(),
          limit: z.number().int().max(100).optional(),
          cursor: z.string().nullish(),
        })
        .optional(),
    )
    .query(({ input }) => {
      const items = listStudios({
        neighborhood: input?.neighborhood,
        type: input?.type,
        limit: input?.limit ?? 20,
      });
      return { items, nextCursor: null };
    }),

  bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => {
    const studio = getStudioBySlug(input.slug);
    if (!studio) return null;
    const locations = getLocationsForStudio(studio.id);
    const instructors = getInstructorsForStudio(studio.id);
    const classes = getClassesForStudio(studio.id);
    const upcomingSessions = getUpcomingSessionsForStudio(studio.id, 40);
    const reviews = getReviewsForStudio(studio.id);
    return { ...studio, locations, instructors, classes, upcomingSessions, reviews };
  }),

  byId: publicProcedure.input(z.object({ id: z.string().uuid() })).query(({ input }) => {
    return getStudioById(input.id);
  }),

  nearby: publicProcedure
    .input(z.object({ lat: z.number(), lng: z.number(), radiusKm: z.number().default(2) }))
    .query(({ input }) => {
      const items = listStudios();
      const withDistance = items
        .map((s) => {
          const locs = getLocationsForStudio(s.id);
          const closest = locs.reduce<{ loc: (typeof locs)[number] | null; km: number }>(
            (acc, l) => {
              const km = haversineKm(input.lat, input.lng, l.lat, l.lng);
              return km < acc.km ? { loc: l, km } : acc;
            },
            { loc: null, km: Number.POSITIVE_INFINITY },
          );
          return { studio: s, km: closest.km, location: closest.loc };
        })
        .filter((x) => x.km <= input.radiusKm * 20) // loose radius for Miami demo
        .sort((a, b) => a.km - b.km)
        .slice(0, 10);
      return withDistance;
    }),

  search: publicProcedure.input(z.object({ q: z.string() })).query(({ input }) => {
    const q = input.q.toLowerCase();
    const studios = listStudios();
    const matched = studios.filter((s) => {
      if (s.name.toLowerCase().includes(q)) return true;
      if (LOCATIONS.some((l) => l.studioId === s.id && l.neighborhood.includes(q))) return true;
      if (CLASSES.some((c) => c.studioId === s.id && c.name.toLowerCase().includes(q))) return true;
      return false;
    });
    return matched;
  }),

  favorite: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .mutation(({ ctx, input }) => {
      toggleFavorite(ctx.user.id, input.studioId, true);
      return { ok: true };
    }),

  unfavorite: protectedProcedure
    .input(z.object({ studioId: z.string() }))
    .mutation(({ ctx, input }) => {
      toggleFavorite(ctx.user.id, input.studioId, false);
      return { ok: true };
    }),

  savedList: protectedProcedure.query(({ ctx }) => listFavoritesForUser(ctx.user.id)),
});

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
