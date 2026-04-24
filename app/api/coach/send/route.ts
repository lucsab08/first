import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getSessionUser } from "@/server/auth";
import {
  addCoachMessage,
  countCoachMessagesForUser,
  getOrCreateConversation,
  getSubscription,
} from "@/server/db/mock";
import { FREE_COACH_MESSAGE_LIMIT } from "@/lib/constants";
import { checkCoachRateLimit } from "@/server/trpc";
import { COACH_SYSTEM_PROMPT, COACH_TOOLS } from "@/server/ai/coach-prompt";
import {
  runCheckConflicts,
  runGetUserContext,
  runSearchClasses,
} from "@/server/ai/coach-tools";
import { streamMockResponse } from "@/server/ai/mock-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Input = z.object({
  prompt: z.string().min(1).max(2000),
  conversationId: z.string().nullish(),
});

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { prompt, conversationId } = parsed.data;

  // Sanitise: strip HTML & cap length (already enforced via zod).
  const sanitized = prompt.replace(/<[^>]*>/g, "").trim();

  // Access gating — §8.9
  const sub = getSubscription(user.id);
  const isPlus = sub.tier === "plus" && (sub.status === "active" || sub.status === "trialing");
  if (!isPlus) {
    const used = countCoachMessagesForUser(user.id, "user");
    if (used >= FREE_COACH_MESSAGE_LIMIT) {
      return NextResponse.json(
        { error: "UPGRADE_REQUIRED", reason: "Let Coach plan your week." },
        { status: 402 },
      );
    }
  }

  // Rate limit (20/hr per user, §8.8)
  if (!checkCoachRateLimit(user.id)) {
    return NextResponse.json(
      { error: "RATE_LIMITED", reason: "Give Coach a minute — you've asked a lot today." },
      { status: 429 },
    );
  }

  const convo = getOrCreateConversation(user.id, conversationId ?? undefined);
  addCoachMessage({
    conversationId: convo.id,
    userId: user.id,
    role: "user",
    content: { text: sanitized },
  });

  const encoder = new TextEncoder();
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const stream = new ReadableStream({
    async start(controller) {
      function send(obj: unknown) {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      }

      try {
        send({ type: "meta", conversationId: convo.id });

        if (apiKey) {
          await runAnthropic({
            apiKey,
            userId: user.id,
            conversationId: convo.id,
            prompt: sanitized,
            send,
          });
        } else {
          for await (const chunk of streamMockResponse(user.id, sanitized)) {
            send(chunk);
          }
        }

        send({ type: "done" });
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

async function runAnthropic({
  apiKey,
  userId,
  conversationId,
  prompt,
  send,
}: {
  apiKey: string;
  userId: string;
  conversationId: string;
  prompt: string;
  send: (obj: unknown) => void;
}) {
  const client = new Anthropic({ apiKey });

  type Msg = Anthropic.Messages.MessageParam;
  const messages: Msg[] = [{ role: "user", content: prompt }];
  let assistantText = "";

  for (let iter = 0; iter < 6; iter++) {
    const response = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      temperature: 0.4,
      system: COACH_SYSTEM_PROMPT,
      tools: COACH_TOOLS as unknown as Anthropic.Messages.Tool[],
      messages,
    });

    assistantText = "";
    for await (const event of response) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        assistantText += event.delta.text;
        send({ type: "text", data: event.delta.text });
      }
    }
    const finalMessage: Anthropic.Messages.Message = await response.finalMessage();

    // Check for tool calls
    const toolUses = finalMessage.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
    );
    if (toolUses.length === 0) {
      addCoachMessage({
        conversationId,
        userId,
        role: "assistant",
        content: { text: assistantText },
      });
      return;
    }

    // Append assistant turn
    messages.push({ role: "assistant", content: finalMessage.content });

    // Execute tools
    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const tu of toolUses) {
      let result: unknown;
      try {
        switch (tu.name) {
          case "get_user_context":
            result = runGetUserContext(userId);
            break;
          case "search_classes":
            result = runSearchClasses(tu.input as Parameters<typeof runSearchClasses>[0]);
            break;
          case "check_conflicts": {
            const input = tu.input as { session_ids: string[] };
            result = runCheckConflicts(userId, input.session_ids);
            break;
          }
          case "propose_plan": {
            const input = tu.input as { week_start: string; sessions: { session_id: string; reason: string }[] };
            send({ type: "plan", data: input });
            result = { accepted: true };
            break;
          }
          default:
            result = { error: "UNKNOWN_TOOL" };
        }
      } catch (err) {
        result = { error: err instanceof Error ? err.message : "error" };
      }
      toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: JSON.stringify(result),
      });

      addCoachMessage({
        conversationId,
        userId,
        role: "tool",
        content: { tool_name: tu.name, input: tu.input, result },
      });
    }
    messages.push({ role: "user", content: toolResults });

    if (finalMessage.stop_reason !== "tool_use") {
      addCoachMessage({
        conversationId,
        userId,
        role: "assistant",
        content: { text: assistantText },
      });
      return;
    }
  }
}
