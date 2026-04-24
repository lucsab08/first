import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { getSubscription } from "@/server/db/mock";

export const subscriptionRouter = createTRPCRouter({
  status: protectedProcedure.query(({ ctx }) => getSubscription(ctx.user.id)),

  checkoutUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/stripe/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: ctx.user.id, email: ctx.user.email }),
    });
    if (!res.ok) return { url: null as string | null };
    const data = (await res.json()) as { url: string | null };
    return data;
  }),

  portalUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const res = await fetch(`${appUrl}/api/stripe/portal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: ctx.user.id }),
    });
    if (!res.ok) return { url: null as string | null };
    const data = (await res.json()) as { url: string | null };
    return data;
  }),
});
