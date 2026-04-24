import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { getSessionUser, type SessionUser } from "./auth";

export type Context = {
  user: SessionUser | null;
  ratelimitKey?: string;
};

export async function createTRPCContext(opts?: { req?: Request }): Promise<Context> {
  const user = await getSessionUser();
  const ip = opts?.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  return {
    user,
    ratelimitKey: user?.id ?? `ip:${ip}`,
  };
}

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;

// ─── Simple in-memory rate limit (5 req/s, 20 coach msgs/hr) ─────────────

const buckets = new Map<string, { count: number; resetAt: number }>();

function takeToken(key: string, windowMs: number, max: number) {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || entry.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

const rateLimit = t.middleware(async ({ ctx, next, type }) => {
  if (type === "mutation") {
    const key = `m:${ctx.ratelimitKey}`;
    if (!takeToken(key, 1000, 5)) {
      throw new TRPCError({
        code: "TOO_MANY_REQUESTS",
        message: "Slow down a moment.",
      });
    }
  }
  return next();
});

const authed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = publicProcedure.use(authed).use(rateLimit);

// Coach-specific: 20 messages per hour per user
export function checkCoachRateLimit(userId: string): boolean {
  return takeToken(`coach:${userId}`, 60 * 60 * 1000, 20);
}
