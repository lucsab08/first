"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, Apple, Leaf } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, SeaglassCard } from "@/components/ui/card";
import { Wordmark } from "@/components/brand/mark";
import { LoadingMark } from "@/components/brand/loading-mark";
import { PlanCard, type Plan } from "./plan-card";
import { useToast } from "@/components/ui/toast";

type StreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "text"; data: string }
  | { type: "plan"; data: Plan }
  | { type: "done" }
  | { type: "error"; message: string };

export default function CoachPage() {
  const access = trpc.coach.checkAccess.useQuery();
  const suggestions = trpc.coach.suggestions.useQuery();

  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [userTurn, setUserTurn] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();

  function autoGrow(el: HTMLTextAreaElement | null) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(160, Math.max(64, el.scrollHeight))}px`;
  }

  async function send(text?: string) {
    const p = (text ?? prompt).trim();
    if (!p || streaming) return;
    if (access.data && !access.data.isPlus && access.data.remaining <= 0) return;
    setUserTurn(p);
    setPrompt("");
    setAssistantText("");
    setPlan(null);
    setStreaming(true);

    try {
      const res = await fetch("/api/coach/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, conversationId }),
      });

      if (res.status === 402) {
        toast.show({
          title: "Let Coach plan your week.",
          description: "SyncFit+ unlocks unlimited chats.",
          tone: "coral",
        });
        setStreaming(false);
        access.refetch();
        return;
      }
      if (res.status === 429) {
        toast.show({
          title: "Give Coach a minute —",
          description: "you've asked a lot today. Try again in an hour.",
        });
        setStreaming(false);
        return;
      }
      if (!res.body) {
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const evt = JSON.parse(line) as StreamEvent;
            if (evt.type === "meta") setConversationId(evt.conversationId);
            else if (evt.type === "text") setAssistantText((t) => t + evt.data);
            else if (evt.type === "plan") setPlan(evt.data);
            else if (evt.type === "error") {
              toast.show({ title: "Coach stalled", description: evt.message, tone: "coral" });
            }
          } catch {
            // ignore bad chunk
          }
        }
      }
    } catch (err) {
      toast.show({
        title: "Couldn't reach Coach",
        description: err instanceof Error ? err.message : "Try again in a moment.",
        tone: "coral",
      });
    } finally {
      setStreaming(false);
      access.refetch();
    }
  }

  if (access.isLoading) {
    return (
      <div className="min-h-[60dvh] flex items-center justify-center">
        <LoadingMark />
      </div>
    );
  }

  // Free-tier paywall state
  if (access.data && !access.data.isPlus && access.data.remaining <= 0) {
    return (
      <div className="min-h-dvh flex flex-col px-5 pt-8 pb-10 coach-wash">
        <div className="flex items-center gap-2 text-ink-tertiary">
          <Wordmark size={14} />
        </div>
        <h1 className="font-display text-[28px] font-semibold mt-6">Let Coach plan your week.</h1>
        <p className="text-[15px] text-ink-secondary mt-2 max-w-xs">
          Less tab-switching. More classes. Coach talks to your calendar and studios directly.
        </p>

        <div className="mt-8 space-y-3">
          <BenefitRow Icon={Sparkles} title="Weekly planning" body="Ask for a week, get specific classes and times." />
          <BenefitRow Icon={Apple} title="Meal ideas" body="Simple Miami-friendly meals tuned to your week." />
          <BenefitRow Icon={Leaf} title="Recovery recommendations" body="Coach notices overload before your body does." />
        </div>

        <div className="flex-1" />

        <div className="space-y-2">
          <Button block onClick={async () => {
            const mutate = await (await fetch("/api/stripe/checkout", { method: "POST" })).json();
            if (mutate.url) window.location.href = mutate.url;
          }}>
            Try SyncFit+ free for 7 days · $14.99/mo after
          </Button>
          <Button block variant="text" asChild>
            <Link href="/today">Maybe later</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Paid (or has free messages remaining) state
  return (
    <div className="flex flex-col min-h-dvh">
      <div className="coach-wash pt-6 pb-4 px-5">
        <div className="flex items-center gap-2 text-ink-tertiary">
          <Wordmark size={14} />
        </div>
        <h1 className="font-display text-[28px] font-semibold mt-3 flex items-center gap-2">
          Coach
          <Sparkles className="h-6 w-6 text-dusk" />
        </h1>
        {!access.data?.isPlus ? (
          <p className="text-xs text-ink-tertiary mt-1 tabular">
            {access.data?.remaining} free message{access.data?.remaining === 1 ? "" : "s"} left
          </p>
        ) : null}
      </div>

      <div className="flex-1 px-5 pb-4 pt-2 space-y-4">
        {userTurn ? (
          <div className="flex justify-end">
            <div className="max-w-[88%] rounded-2xl bg-dusk text-paper px-4 py-3 text-[15px] leading-snug">
              {userTurn}
            </div>
          </div>
        ) : (
          <p className="font-display text-[22px] font-semibold text-ink-primary leading-snug mt-6">
            Tell me what you want this week to look like.
          </p>
        )}

        <AnimatePresence>
          {assistantText ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="text-[15px] leading-relaxed text-ink-primary whitespace-pre-wrap"
            >
              {assistantText}
              {streaming ? <span className="inline-block w-1.5 h-4 align-middle ml-0.5 bg-dusk animate-pulse" /> : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {plan ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
            >
              <PlanCard plan={plan} conversationId={conversationId ?? "*"} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {plan ? (
          <div className="space-y-3">
            <ExpandableCard
              title="Meal ideas for this week"
              locked={!access.data?.isPlus}
              Icon={Apple}
            >
              <ul className="text-[15px] text-ink-secondary leading-relaxed list-disc pl-5">
                <li>Mon · Grilled fish tacos + slaw, after Reformer</li>
                <li>Wed · Ropa vieja bowl, big greens</li>
                <li>Fri · Salmon + plantains, early carbs</li>
              </ul>
            </ExpandableCard>
            <RecoveryCheckIn />
          </div>
        ) : null}
      </div>

      {/* Input */}
      <div className="sticky bottom-[68px] left-0 right-0 bg-paper/90 backdrop-blur pt-2 pb-3 px-5 border-t border-hairline safe-bottom">
        {!userTurn && suggestions.data ? (
          <div className="flex gap-2 overflow-x-auto scroll-hide -mx-5 px-5 mb-2 pb-1">
            {suggestions.data.map((s) => (
              <Chip key={s} onClick={() => send(s)} className="shrink-0">
                {s}
              </Chip>
            ))}
          </div>
        ) : null}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              autoGrow(e.currentTarget);
            }}
            placeholder="Ask Coach anything."
            disabled={streaming}
            className="flex-1 min-h-[56px] max-h-[160px] resize-none rounded-3xl bg-surface shadow-card px-5 py-4 text-[15px] text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
          />
          <button
            onClick={() => send()}
            disabled={!prompt.trim() || streaming}
            aria-label="Send"
            className="h-[56px] w-[56px] rounded-full bg-dusk text-paper flex items-center justify-center tap disabled:opacity-40"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BenefitRow({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="h-11 w-11 rounded-2xl bg-paper flex items-center justify-center">
        <Icon className="h-5 w-5 text-dusk" />
      </div>
      <div>
        <p className="font-medium text-[15px]">{title}</p>
        <p className="text-sm text-ink-secondary">{body}</p>
      </div>
    </div>
  );
}

function ExpandableCard({
  title,
  children,
  locked,
  Icon,
}: {
  title: string;
  children: React.ReactNode;
  locked?: boolean;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-0 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 tap"
      >
        <span className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-dusk" />
          <span className="font-medium">{title}</span>
          {locked ? (
            <span className="label-uppercase text-coral">Premium</span>
          ) : null}
        </span>
        <span className="text-ink-tertiary">{open ? "−" : "+"}</span>
      </button>
      {open ? (
        <div className="px-5 pb-5">
          {locked ? (
            <p className="text-sm text-ink-secondary">
              Upgrade to SyncFit+ to get the full meal plan each week.
            </p>
          ) : (
            children
          )}
        </div>
      ) : null}
    </Card>
  );
}

function RecoveryCheckIn() {
  const [pick, setPick] = useState<"easy" | "solid" | "too_much" | null>(null);
  return (
    <SeaglassCard>
      <p className="label-uppercase text-dusk">Recovery check-in</p>
      <p className="text-[15px] mt-1">How did this week feel?</p>
      <div className="flex gap-2 mt-3">
        {(["easy", "solid", "too_much"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setPick(v)}
            className={`flex-1 h-10 rounded-xl text-sm font-medium capitalize ${
              pick === v ? "bg-dusk text-paper" : "bg-paper text-ink-primary"
            }`}
          >
            {v === "too_much" ? "Too much" : v}
          </button>
        ))}
      </div>
      {pick ? (
        <p className="text-xs text-ink-secondary mt-3">
          Got it. I&apos;ll {pick === "easy" ? "bump intensity" : pick === "solid" ? "keep the pace" : "ease up next week"}.
        </p>
      ) : null}
    </SeaglassCard>
  );
}
