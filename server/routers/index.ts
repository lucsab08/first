import { createTRPCRouter } from "@/server/trpc";
import { authRouter } from "./auth";
import { userRouter } from "./user";
import { studioRouter } from "./studio";
import { classRouter } from "./class";
import { bookingRouter } from "./booking";
import { calendarRouter } from "./calendar";
import { coachRouter } from "./coach";
import { subscriptionRouter } from "./subscription";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  studio: studioRouter,
  class: classRouter,
  booking: bookingRouter,
  calendar: calendarRouter,
  coach: coachRouter,
  subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;
