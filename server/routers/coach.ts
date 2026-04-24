import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import {
  addCoachMessage,
  countCoachMessagesForUser,
  createBooking,
  getConversationMessages,
  getOrCreateConversation,
  getSubscription,
  listConversations,
} from "@/server/db/mock";
import { FREE_COACH_MESSAGE_LIMIT } from "@/lib/constants";

const ROTATING_SUGGESTIONS = [
  "Plan my week",
  "Low-impact workout after work",
  "What should I do tomorrow?",
  "Build a 4-week strength plan",
  "A yoga class near my office",
  "Recovery idea for tired legs",
];

export const coachRouter = createTRPCRouter({
  conversations: protectedProcedure.query(({ ctx }) => listConversations(ctx.user.id)),

  messages: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .query(({ input }) => getConversationMessages(input.conversationId)),

  suggestions: protectedProcedure.query(() => {
    const now = Date.now();
    const hour = Math.floor(now / (60 * 60 * 1000));
    const offset = hour % ROTATING_SUGGESTIONS.length;
    return [
      ROTATING_SUGGESTIONS[offset]!,
      ROTATING_SUGGESTIONS[(offset + 1) % ROTATING_SUGGESTIONS.length]!,
      ROTATING_SUGGESTIONS[(offset + 2) % ROTATING_SUGGESTIONS.length]!,
      ROTATING_SUGGESTIONS[(offset + 3) % ROTATING_SUGGESTIONS.length]!,
    ];
  }),

  /**
   * Used by the Coach UI to verify premium + remaining-message state before
   * opening the streaming /api/coach/send endpoint.
   */
  checkAccess: protectedProcedure.query(({ ctx }) => {
    const sub = getSubscription(ctx.user.id);
    const userMsgCount = countCoachMessagesForUser(ctx.user.id, "user");
    const isPlus = sub.tier === "plus" && (sub.status === "active" || sub.status === "trialing");
    return {
      isPlus,
      freeLimit: FREE_COACH_MESSAGE_LIMIT,
      freeUsed: userMsgCount,
      remaining: isPlus ? Infinity : Math.max(0, FREE_COACH_MESSAGE_LIMIT - userMsgCount),
    };
  }),

  acceptPlan: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        sessionIds: z.array(z.string()),
      }),
    )
    .mutation(({ ctx, input }) => {
      const bookings = input.sessionIds.map((sid) => {
        try {
          return createBooking(ctx.user.id, sid);
        } catch {
          return null;
        }
      });
      return {
        booked: bookings.filter((b): b is NonNullable<typeof b> => b !== null).length,
        total: input.sessionIds.length,
      };
    }),

  /** Non-streaming stub that records a user message. Streaming happens via /api/coach/send. */
  recordUserMessage: protectedProcedure
    .input(z.object({ conversationId: z.string().optional(), prompt: z.string().max(2000) }))
    .mutation(({ ctx, input }) => {
      const sub = getSubscription(ctx.user.id);
      const isPlus = sub.tier === "plus" && (sub.status === "active" || sub.status === "trialing");
      if (!isPlus) {
        const used = countCoachMessagesForUser(ctx.user.id, "user");
        if (used >= FREE_COACH_MESSAGE_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Let Coach plan your week. SyncFit+ unlocks unlimited chats.",
          });
        }
      }
      const convo = getOrCreateConversation(ctx.user.id, input.conversationId);
      const msg = addCoachMessage({
        conversationId: convo.id,
        userId: ctx.user.id,
        role: "user",
        content: { text: input.prompt },
      });
      return { conversationId: convo.id, messageId: msg.id };
    }),
});
