import { z } from "zod";
import { addDays, isAfter, isBefore, isSameDay, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { getSessionById, listBookingsForUser, upcomingBookingsForUser, weekBalance } from "@/server/db/mock";
import { CLASSES, INSTRUCTORS, LOCATIONS, STUDIOS } from "@/server/db/fixtures";

function hydrateBookings(bookings: ReturnType<typeof listBookingsForUser>) {
  return bookings
    .map((b) => {
      const s = getSessionById(b.sessionId);
      if (!s) return null;
      const cls = CLASSES.find((c) => c.id === s.classId)!;
      const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
      const inst = INSTRUCTORS.find((i) => i.id === s.instructorId) ?? null;
      const studio = STUDIOS.find((x) => x.id === cls.studioId)!;
      return { ...b, session: { ...s, class: cls, location: loc, instructor: inst, studio } };
    })
    .filter((b): b is NonNullable<ReturnType<typeof hydrateBookings>[number]> => b !== null);
}

export const calendarRouter = createTRPCRouter({
  week: protectedProcedure
    .input(z.object({ weekStart: z.string() }))
    .query(({ ctx, input }) => {
      const weekStart = startOfDay(new Date(input.weekStart));
      const weekEnd = addDays(weekStart, 7);
      const all = listBookingsForUser(ctx.user.id);
      const inWeek = all.filter((b) => {
        const s = getSessionById(b.sessionId);
        return s && isAfter(s.startTime, weekStart) && isBefore(s.startTime, weekEnd);
      });
      return hydrateBookings(inWeek);
    }),

  day: protectedProcedure.input(z.object({ date: z.string() })).query(({ ctx, input }) => {
    const d = new Date(input.date);
    const all = listBookingsForUser(ctx.user.id);
    const onDay = all.filter((b) => {
      const s = getSessionById(b.sessionId);
      return s && isSameDay(s.startTime, d);
    });
    return hydrateBookings(onDay);
  }),

  month: protectedProcedure
    .input(z.object({ year: z.number().int(), month: z.number().int().min(1).max(12) }))
    .query(({ ctx, input }) => {
      const monthStart = startOfMonth(new Date(input.year, input.month - 1, 1));
      const monthEnd = endOfMonth(monthStart);
      const all = listBookingsForUser(ctx.user.id);
      const inMonth = all.filter((b) => {
        const s = getSessionById(b.sessionId);
        return s && isAfter(s.startTime, monthStart) && isBefore(s.startTime, monthEnd);
      });

      const byDay = new Map<string, { count: number; strength: number; cardio: number; recovery: number }>();
      for (const b of inMonth) {
        const s = getSessionById(b.sessionId);
        if (!s) continue;
        const cls = CLASSES.find((c) => c.id === s.classId)!;
        const key = s.startTime.toISOString().slice(0, 10);
        const cur = byDay.get(key) ?? { count: 0, strength: 0, cardio: 0, recovery: 0 };
        cur.count++;
        if (cls.type === "strength" || cls.type === "pilates") cur.strength++;
        else if (["hiit", "boxing", "cycling", "run"].includes(cls.type)) cur.cardio++;
        else cur.recovery++;
        byDay.set(key, cur);
      }
      return Array.from(byDay.entries()).map(([date, mix]) => ({ date, ...mix }));
    }),

  balance: protectedProcedure.input(z.object({ weekStart: z.string() })).query(({ ctx, input }) => {
    return weekBalance(ctx.user.id, new Date(input.weekStart));
  }),

  upcomingToday: protectedProcedure.query(({ ctx }) => {
    const today = new Date();
    const upcoming = upcomingBookingsForUser(ctx.user.id).filter((b) => {
      const s = getSessionById(b.sessionId);
      return s && isSameDay(s.startTime, today);
    });
    return hydrateBookings(upcoming);
  }),

  weekDots: protectedProcedure
    .input(z.object({ weekStart: z.string() }))
    .query(({ ctx, input }) => {
      const weekStart = startOfDay(new Date(input.weekStart));
      const bookings = listBookingsForUser(ctx.user.id);
      return Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(weekStart, i);
        const dayBookings = bookings.filter((b) => {
          const s = getSessionById(b.sessionId);
          return s && isSameDay(s.startTime, d);
        });
        const completed = dayBookings.some((b) => b.status === "completed");
        const booked = dayBookings.some((b) => b.status === "confirmed" || b.status === "waitlisted");
        return {
          date: d.toISOString(),
          day: d.getDay(),
          completed,
          booked,
        };
      });
    }),
});
