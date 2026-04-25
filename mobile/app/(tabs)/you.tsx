import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { Image } from "expo-image";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bell,
  Calendar,
  ChevronRight,
  CreditCard,
  Edit2,
  Flame,
  HelpCircle,
  LogOut,
  Settings2,
  Sparkles,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingMarkCentered } from "@/components/brand/loading-mark";
import { GOALS } from "@/lib/constants";
import { cn, formatCents, getApiBaseUrl, neighborhoodLabel } from "@/lib/utils";

export default function YouScreen() {
  const insets = useSafeAreaInsets();
  const me = trpc.auth.me.useQuery();
  const stats = trpc.user.stats.useQuery();
  const sub = trpc.subscription.status.useQuery();
  const saved = trpc.studio.savedList.useQuery();
  const history = trpc.booking.history.useQuery({ limit: 5 });

  if (me.isLoading || !me.data) return <LoadingMarkCentered />;

  const isPlus = sub.data?.tier === "plus" && (sub.data?.status === "active" || sub.data?.status === "trialing");
  const memberSince = me.data.onboardedAt ? format(new Date(me.data.onboardedAt), "MMMM yyyy") : null;

  function manageSubscription() {
    // §9.7 — Apple requires subscription management to live in iOS Settings.
    Linking.openURL("https://apps.apple.com/account/subscriptions").catch(() => {});
  }

  return (
    <ScrollView
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: 40,
        paddingHorizontal: 20,
        gap: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="flex-row items-center gap-4">
        <View
          className="bg-elevated"
          style={{ height: 72, width: 72, borderRadius: 36, overflow: "hidden" }}
        >
          {me.data.avatarUrl ? (
            <Image
              source={{ uri: me.data.avatarUrl }}
              style={{ height: 72, width: 72 }}
              contentFit="cover"
            />
          ) : null}
        </View>
        <View className="flex-1">
          <Text className="font-display text-[24px] text-ink-primary">{me.data.fullName ?? "Member"}</Text>
          {memberSince ? (
            <Text className="text-sm text-ink-tertiary">Member since {memberSince}</Text>
          ) : null}
        </View>
        <Pressable
          className="h-11 w-11 rounded-full bg-elevated items-center justify-center"
          accessibilityLabel="Edit profile"
        >
          <Edit2 size={16} color="#0A0A0A" />
        </Pressable>
      </View>

      {/* Membership */}
      {isPlus ? (
        <Card className="bg-dusk">
          <View className="flex-row items-start gap-3">
            <View className="h-11 w-11 rounded-2xl bg-paper/15 items-center justify-center">
              <Sparkles size={20} color="#FAFAF7" />
            </View>
            <View className="flex-1">
              <Text className="text-paper font-sansSemibold text-[15px]">SyncFit+</Text>
              {sub.data?.currentPeriodEnd ? (
                <Text className="text-paper/80 text-sm">
                  Renews {format(new Date(sub.data.currentPeriodEnd), "MMM d, yyyy")}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={manageSubscription} className="bg-paper/15 px-4 h-9 rounded-xl items-center justify-center">
              <Text className="text-paper text-sm font-sansMedium">Manage</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <Card>
          <Text className="font-display text-[20px]">Unlock Coach</Text>
          <Text className="text-sm text-ink-secondary mt-1">
            Let Coach plan your week around your job and recovery. $14.99/mo · 7-day trial.
          </Text>
          <View className="mt-3">
            <Button
              size="md"
              label="Start free trial"
              onPress={() => router.push("/(tabs)/coach")}
            />
          </View>
        </Card>
      )}

      {/* Stats */}
      <View className="flex-row gap-3">
        <StatCell label="Total classes" value={stats.data?.totalClasses ?? 0} />
        <StatCell label="Studios tried" value={stats.data?.studiosTried ?? 0} />
        <StatCell
          label="Streak"
          value={stats.data?.currentStreak ?? 0}
          suffix={`wk${(stats.data?.currentStreak ?? 0) === 1 ? "" : "s"}`}
          flame
        />
      </View>

      {/* Goals */}
      <Card>
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text
              className="text-ink-tertiary font-sansSemibold uppercase mb-1"
              style={{ fontSize: 11, letterSpacing: 0.88 }}
            >
              Goals
            </Text>
            <Text className="text-[15px] font-sansMedium">
              {(me.data.preferences?.goals ?? [])
                .map((g) => GOALS.find((x) => x.id === g)?.label)
                .filter(Boolean)
                .join(", ") || "—"}
            </Text>
            <Text className="text-sm text-ink-secondary mt-2">
              {me.data.preferences?.weeklyGoal ?? 4} classes / week ·{" "}
              {(me.data.preferences?.neighborhoods ?? []).map(neighborhoodLabel).join(" · ")}
            </Text>
          </View>
          <Pressable>
            <Text className="text-sm text-ink-primary underline">Edit</Text>
          </Pressable>
        </View>
      </Card>

      {/* Saved studios */}
      {saved.data && saved.data.length > 0 ? (
        <View>
          <Text className="text-[18px] font-sansSemibold mb-2">Saved studios</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {saved.data.map((s) => (
              <Link
                key={s.id}
                href={{ pathname: "/studio/[slug]", params: { slug: s.slug } }}
                asChild
              >
                <Pressable className="w-32">
                  <Image
                    source={{ uri: s.coverImageUrl ?? "" }}
                    style={{ aspectRatio: 4 / 5, borderRadius: 16, width: "100%" }}
                    contentFit="cover"
                  />
                  <Text className="text-sm font-sansMedium mt-2" numberOfLines={1}>
                    {s.name}
                  </Text>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* History */}
      <View>
        <Text className="text-[18px] font-sansSemibold mb-2">Recent bookings</Text>
        <View>
          {(history.data ?? []).length === 0 ? (
            <Text className="text-sm text-ink-tertiary py-3">
              Nothing completed yet. Book one and come back.
            </Text>
          ) : (
            (history.data ?? []).map((b) => (
              <View key={b.id} className="flex-row items-center gap-3 py-3 border-b border-hairline">
                <View className="flex-1">
                  <Text className="text-[15px] font-sansMedium" numberOfLines={1}>
                    {b.session.class.name}
                  </Text>
                  <Text className="text-xs text-ink-tertiary" numberOfLines={1}>
                    {b.session.studio.name} ·{" "}
                    <Text style={{ fontVariant: ["tabular-nums"] }}>
                      {format(new Date(b.session.startTime), "MMM d")}
                    </Text>
                  </Text>
                </View>
                <Text
                  className="text-sm text-ink-tertiary"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatCents(b.session.class.priceCents)}
                </Text>
                <Pressable>
                  <Text className="text-sm text-ink-primary underline">Rate</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Settings */}
      <View>
        <SettingsRow Icon={Bell} label="Notifications" />
        <SettingsRow Icon={Settings2} label="Preferences" />
        <SettingsRow Icon={CreditCard} label="Payment methods" />
        <SettingsRow Icon={Sparkles} label="Subscription" onPress={manageSubscription} />
        <SettingsRow Icon={Calendar} label="Calendar sync" />
        <SettingsRow Icon={HelpCircle} label="Help" />
        <SettingsRow
          Icon={LogOut}
          label="Sign out"
          onPress={() => Linking.openURL(`${getApiBaseUrl()}/api/signout`)}
        />
      </View>
    </ScrollView>
  );
}

function StatCell({
  label,
  value,
  suffix,
  flame,
}: {
  label: string;
  value: number;
  suffix?: string;
  flame?: boolean;
}) {
  return (
    <Card className="flex-1 p-4 items-start">
      <Text
        className="text-ink-tertiary font-sansSemibold uppercase"
        style={{ fontSize: 11, letterSpacing: 0.88 }}
      >
        {label}
      </Text>
      <View className="flex-row items-baseline gap-1 mt-2">
        {flame ? <Flame size={14} color="#8FA896" /> : null}
        <Text
          className="font-display text-[24px]"
          style={{ fontVariant: ["tabular-nums"], lineHeight: 24 }}
        >
          {value}
        </Text>
        {suffix ? (
          <Text
            className="text-sm text-ink-tertiary"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function SettingsRow({
  Icon,
  label,
  onPress,
}: {
  Icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 py-4 border-b border-hairline">
      <Icon size={20} color="#9A9A9A" />
      <Text className="flex-1 text-[15px]">{label}</Text>
      <ChevronRight size={16} color="#9A9A9A" />
    </Pressable>
  );
}
