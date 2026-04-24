import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  cancelBooking,
  createBooking,
  findConflicts,
  getSessionById,
  listBookingsForUser,
  upcomingBookingsForUser,
} from "@/server/db/mock";
import { CLASSES, INSTRUCTORS, LOCATIONS, STUDIOS } from "@/server/db/fixtures";

function hydrate(b: ReturnType<typeof listBookingsForUser>[number]) {
  const s = getSessionById(b.sessionId);
  if (!s) return null;
  const cls = CLASSES.find((c) => c.id === s.classId)!;
  const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
  const inst = INSTRUCTORS.find((i) => i.id === s.instructorId) ?? null;
  const studio = STUDIOS.find((x) => x.id === cls.studioId)!;
  return { ...b, session: { ...s, class: cls, location: loc, instructor: inst, studio } };
}

export const bookingRouter = createTRPCRouter({
  checkConflicts: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(({ ctx, input }) => {
      const conflicts = findConflicts(ctx.user.id, input.sessionId).map(hydrate).filter((b): b is NonNullable<ReturnType<typeof hydrate>> => b !== null);
      return { conflicts };
    }),

  create: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(({ ctx, input }) => {
      return createBooking(ctx.user.id, input.sessionId);
    }),

  cancel: protectedProcedure
    .input(z.object({ bookingId: z.string() }))
    .mutation(({ ctx, input }) => {
      cancelBooking(ctx.user.id, input.bookingId);
      return { ok: true };
    }),

  upcoming: protectedProcedure.query(({ ctx }) =>
    upcomingBookingsForUser(ctx.user.id)
      .map(hydrate)
      .filter((b): b is NonNullable<ReturnType<typeof hydrate>> => b !== null),
  ),

  history: protectedProcedure
    .input(z.object({ limit: z.number().int().default(20) }).optional())
    .query(({ ctx, input }) =>
      listBookingsForUser(ctx.user.id)
        .filter((b) => {
          const s = getSessionById(b.sessionId);
          return s && s.endTime < new Date();
        })
        .slice(0, input?.limit ?? 20)
        .map(hydrate)
        .filter((b): b is NonNullable<ReturnType<typeof hydrate>> => b !== null),
    ),
});
