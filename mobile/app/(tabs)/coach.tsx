import { useRef, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link, router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Apple, Leaf, Send, Sparkles } from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card, SeaglassCard } from "@/components/ui/card";
import { Wordmark } from "@/components/brand/mark";
import { LoadingMark } from "@/components/brand/loading-mark";
import { useToast } from "@/components/ui/toast";
import { buySyncFitPlus, restorePurchases } from "@/lib/storekit";
import { getApiBaseUrl, neighborhoodLabel } from "@/lib/utils";
import { format } from "date-fns";

type StreamEvent =
  | { type: "meta"; conversationId: string }
  | { type: "text"; data: string }
  | {
      type: "plan";
      data: {
        week_start: string;
        sessions: { session_id: string; reason: string }[];
        rows?: PlanRow[];
      };
    }
  | { type: "done" }
  | { type: "error"; message: string };

type PlanRow = {
  session_id: string;
  day?: string;
  class_name?: string;
  studio_name?: string;
  studio_slug?: string;
  neighborhood?: string;
  time?: string;
  reason: string;
};

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const access = trpc.coach.checkAccess.useQuery();
  const suggestions = trpc.coach.suggestions.useQuery();
  const acceptPlan = trpc.coach.acceptPlan.useMutation();
  const utils = trpc.useUtils();
  const toast = useToast();

  const [prompt, setPrompt] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [assistantText, setAssistantText] = useState("");
  const [plan, setPlan] = useState<{ week_start: string; sessions: { session_id: string; reason: string }[]; rows?: PlanRow[] } | null>(null);
  const [userTurn, setUserTurn] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [bookedAll, setBookedAll] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  if (access.isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <LoadingMark />
      </View>
    );
  }

  // Free-tier paywall — primary CTA fires StoreKit (v4.1 §9.5)
  if (access.data && !access.data.isPlus && access.data.remaining <= 0) {
    return (
      <PaywallScreen
        onSubscribe={async () => {
          setPurchasing(true);
          const res = await buySyncFitPlus();
          setPurchasing(false);
          if (res.ok) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            toast.show({ title: "You're in. Coach is unlocked.", tone: "success" });
            await access.refetch();
          } else {
            toast.show({
              title: "Couldn't subscribe",
              description: res.reason ?? "Try again",
              tone: "coral",
            });
          }
        }}
        onRestore={async () => {
          const r = await restorePurchases();
          toast.show({
            title: r.activated ? "Subscription restored" : "Nothing to restore",
            tone: r.activated ? "success" : "default",
          });
          await access.refetch();
        }}
        purchasing={purchasing}
      />
    );
  }

  async function send(text?: string) {
    const p = (text ?? prompt).trim();
    if (!p || streaming) return;
    setUserTurn(p);
    setPrompt("");
    setAssistantText("");
    setPlan(null);
    setBookedAll(false);
    setStreaming(true);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/coach/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: p, conversationId }),
      });
      if (res.status === 402) {
        toast.show({ title: "Let Coach plan your week.", description: "Upgrade to keep chatting.", tone: "coral" });
        return;
      }
      if (res.status === 429) {
        toast.show({ title: "Give Coach a minute —", description: "you've asked a lot today." });
        return;
      }
      if (!res.body) return;

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
          } catch {
            // ignore malformed chunk
          }
        }
        scrollRef.current?.scrollToEnd({ animated: true });
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

  async function handleBookAll() {
    if (!plan) return;
    const r = await acceptPlan.mutateAsync({
      conversationId: conversationId ?? "*",
      sessionIds: plan.sessions.map((s) => s.session_id),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setBookedAll(true);
    toast.show({
      title: `Booked ${r.booked} of ${r.total}`,
      description: "We'll remind you 90 minutes before each.",
      tone: "success",
    });
    utils.booking.upcoming.invalidate();
    utils.calendar.week.invalidate();
    utils.calendar.weekDots.invalidate();
  }

  return (
    <View className="flex-1 bg-paper">
      <View
        className="px-5 pb-4"
        style={{
          paddingTop: insets.top + 16,
          backgroundColor: "transparent",
        }}
      >
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "transparent",
          }}
        />
        <Wordmark size={14} />
        <View className="flex-row items-center gap-2 mt-3">
          <Text className="font-display text-[28px]">Coach</Text>
          <Sparkles size={20} color="#1B3A4B" />
        </View>
        {!access.data?.isPlus ? (
          <Text
            className="text-xs text-ink-tertiary mt-1"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {access.data?.remaining} free message{access.data?.remaining === 1 ? "" : "s"} left
          </Text>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 200, gap: 16 }}
      >
        {userTurn ? (
          <View className="self-end max-w-[88%] rounded-2xl bg-dusk px-4 py-3">
            <Text className="text-paper text-[15px]" style={{ lineHeight: 20 }}>
              {userTurn}
            </Text>
          </View>
        ) : (
          <Text
            className="font-display text-[22px] text-ink-primary mt-6"
            style={{ lineHeight: 26 }}
          >
            Tell me what you want this week to look like.
          </Text>
        )}

        {assistantText ? (
          <Text className="text-[15px] text-ink-primary" style={{ lineHeight: 22 }}>
            {assistantText}
            {streaming ? (
              <Text className="text-dusk"> ▍</Text>
            ) : null}
          </Text>
        ) : null}

        {plan ? (
          <PlanCard plan={plan} bookedAll={bookedAll} onBookAll={handleBookAll} pending={acceptPlan.isPending} />
        ) : null}

        {plan ? (
          <>
            <ExpandableCard title="Meal ideas for this week" Icon={Apple} locked={!access.data?.isPlus}>
              <View>
                <Text className="text-[15px] text-ink-secondary" style={{ lineHeight: 22 }}>
                  · Mon — Grilled fish tacos + slaw, after Reformer{"\n"}
                  · Wed — Ropa vieja bowl, big greens{"\n"}
                  · Fri — Salmon + plantains, early carbs
                </Text>
              </View>
            </ExpandableCard>
            <RecoveryCheckIn />
          </>
        ) : null}
      </ScrollView>

      <View
        className="absolute left-0 right-0 bg-paper px-5 pt-2 border-t border-hairline"
        style={{ bottom: insets.bottom + 86, paddingBottom: 12 }}
      >
        {!userTurn && suggestions.data ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
            style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
          >
            {suggestions.data.map((s) => (
              <Chip key={s} onPress={() => send(s)}>
                {s}
              </Chip>
            ))}
          </ScrollView>
        ) : null}
        <View className="flex-row gap-2 items-end">
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask Coach anything."
            placeholderTextColor="#9A9A9A"
            multiline
            editable={!streaming}
            className="flex-1 bg-surface px-5 py-4 rounded-3xl text-ink-primary"
            style={{
              fontSize: 15,
              minHeight: 56,
              maxHeight: 160,
              shadowColor: "#0A0A0A",
              shadowOpacity: 0.04,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 2 },
            }}
          />
          <Pressable
            onPress={() => send()}
            disabled={!prompt.trim() || streaming}
            accessibilityLabel="Send"
            className="h-14 w-14 rounded-full bg-dusk items-center justify-center"
            style={{ opacity: !prompt.trim() || streaming ? 0.4 : 1 }}
          >
            <Send size={20} color="#FAFAF7" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PaywallScreen({
  onSubscribe,
  onRestore,
  purchasing,
}: {
  onSubscribe: () => void;
  onRestore: () => void;
  purchasing: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 bg-paper px-5"
      style={{ paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }}
    >
      <Wordmark size={14} />
      <Text className="font-display text-[28px] mt-6">Let Coach plan your week.</Text>
      <Text className="text-[15px] text-ink-secondary mt-2 max-w-xs">
        Less tab-switching. More classes. Coach talks to your calendar and studios directly.
      </Text>

      <View className="mt-8 gap-4">
        <BenefitRow Icon={Sparkles} title="Weekly planning" body="Ask for a week, get specific classes and times." />
        <BenefitRow Icon={Apple} title="Meal ideas" body="Simple Miami-friendly meals tuned to your week." />
        <BenefitRow Icon={Leaf} title="Recovery recommendations" body="Coach notices overload before your body does." />
      </View>

      <View className="flex-1" />

      <View className="gap-2">
        <Button
          block
          label={purchasing ? "Opening App Store…" : "Try SyncFit+ free for 7 days · $14.99/mo after"}
          onPress={onSubscribe}
          disabled={purchasing}
        />
        <Pressable onPress={onRestore} className="self-center py-2">
          <Text className="text-sm text-ink-secondary underline">Restore purchase</Text>
        </Pressable>
        <Pressable onPress={() => router.push("/(tabs)/today")} className="self-center py-2">
          <Text className="text-sm text-ink-tertiary">Maybe later</Text>
        </Pressable>
      </View>
    </View>
  );
}

function BenefitRow({
  Icon,
  title,
  body,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="h-11 w-11 rounded-2xl bg-paper items-center justify-center" style={{ borderWidth: 1, borderColor: "#ECEAE4" }}>
        <Icon size={20} color="#1B3A4B" />
      </View>
      <View className="flex-1">
        <Text className="font-sansMedium text-[15px]">{title}</Text>
        <Text className="text-sm text-ink-secondary">{body}</Text>
      </View>
    </View>
  );
}

function PlanCard({
  plan,
  onBookAll,
  bookedAll,
  pending,
}: {
  plan: { week_start: string; sessions: { session_id: string; reason: string }[]; rows?: PlanRow[] };
  onBookAll: () => void;
  bookedAll: boolean;
  pending: boolean;
}) {
  const rows = plan.rows ?? [];
  return (
    <Card className="p-0">
      <View className="px-5 pt-5 pb-2">
        <Text className="text-dusk font-sansSemibold uppercase" style={{ fontSize: 11, letterSpacing: 0.88 }}>
          Week of {format(new Date(plan.week_start), "MMM d")}
        </Text>
      </View>
      <View>
        {rows.map((r) => (
          <View key={r.session_id} className="flex-row items-start gap-4 px-5 py-3 border-t border-hairline">
            <View className="w-12">
              <Text className="text-[11px] text-ink-tertiary uppercase">{r.day?.slice(0, 3)}</Text>
              <Text
                className="text-[15px] font-sansMedium mt-0.5"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {r.time}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sansMedium text-[15px]" numberOfLines={1}>
                {r.studio_slug ? (
                  <Link href={{ pathname: "/studio/[slug]", params: { slug: r.studio_slug } }}>
                    {r.class_name}
                  </Link>
                ) : (
                  r.class_name
                )}
              </Text>
              <Text className="text-sm text-ink-secondary" numberOfLines={1}>
                {r.studio_name}
                {r.neighborhood ? ` · ${neighborhoodLabel(r.neighborhood)}` : ""}
              </Text>
              <Text
                className="text-xs text-ink-tertiary mt-1"
                style={{ fontStyle: "italic", lineHeight: 16 }}
              >
                {r.reason}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <View className="flex-row gap-3 px-5 py-4 border-t border-hairline bg-elevated">
        <Button
          label={bookedAll ? "Booked" : pending ? "Booking…" : "Book all"}
          onPress={onBookAll}
          disabled={bookedAll || pending}
        />
        <Button variant="ghost" label="Tweak" disabled={bookedAll} />
      </View>
    </Card>
  );
}

function ExpandableCard({
  title,
  children,
  Icon,
  locked,
}: {
  title: string;
  children: React.ReactNode;
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  locked?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="p-0">
      <Pressable onPress={() => setOpen(!open)} className="flex-row items-center justify-between px-5 py-4">
        <View className="flex-row items-center gap-3">
          <Icon size={20} color="#1B3A4B" />
          <Text className="font-sansMedium">{title}</Text>
          {locked ? (
            <Text
              className="text-coral font-sansSemibold uppercase"
              style={{ fontSize: 11, letterSpacing: 0.88 }}
            >
              Premium
            </Text>
          ) : null}
        </View>
        <Text className="text-ink-tertiary">{open ? "−" : "+"}</Text>
      </Pressable>
      {open ? (
        <View className="px-5 pb-5">
          {locked ? (
            <Text className="text-sm text-ink-secondary">
              Upgrade to SyncFit+ to get the full meal plan each week.
            </Text>
          ) : (
            children
          )}
        </View>
      ) : null}
    </Card>
  );
}

function RecoveryCheckIn() {
  const [pick, setPick] = useState<"easy" | "solid" | "too_much" | null>(null);
  return (
    <SeaglassCard>
      <Text
        className="text-dusk font-sansSemibold uppercase"
        style={{ fontSize: 11, letterSpacing: 0.88 }}
      >
        Recovery check-in
      </Text>
      <Text className="text-[15px] mt-1">How did this week feel?</Text>
      <View className="flex-row gap-2 mt-3">
        {(["easy", "solid", "too_much"] as const).map((v) => (
          <Pressable
            key={v}
            onPress={() => setPick(v)}
            className={`flex-1 h-10 rounded-xl items-center justify-center ${
              pick === v ? "bg-dusk" : "bg-paper"
            }`}
          >
            <Text
              className={`text-sm font-sansMedium ${pick === v ? "text-paper" : "text-ink-primary"}`}
            >
              {v === "too_much" ? "Too much" : v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      {pick ? (
        <Text className="text-xs text-ink-secondary mt-3">
          Got it. I'll{" "}
          {pick === "easy" ? "bump intensity" : pick === "solid" ? "keep the pace" : "ease up next week"}.
        </Text>
      ) : null}
    </SeaglassCard>
  );
}
