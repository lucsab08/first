import { Text, View } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { Star } from "lucide-react-native";
import { cn, countdownTo, formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";

export type SessionSummary = {
  id: string;
  startTime: string | Date;
  endTime: string | Date;
  spotsBooked: number;
  capacity: number;
  class: {
    id: string;
    name: string;
    type: string;
    intensity: "low" | "medium" | "high";
    durationMinutes: number;
    priceCents: number;
    beginnerFriendly?: boolean;
  };
  studio: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string;
    ratingAvg: number | string;
  };
  location: {
    neighborhood: string;
    name: string | null;
  };
  instructor: { name: string } | null;
};

export function SessionCard({
  session,
  reason,
  width = 280,
  height = 320,
}: {
  session: SessionSummary;
  reason?: string;
  width?: number;
  height?: number;
}) {
  return (
    <Link href={{ pathname: "/studio/[slug]", params: { slug: session.studio.slug } }} asChild>
      <View
        className="rounded-2xl bg-surface overflow-hidden"
        style={{
          width,
          height,
          shadowColor: "#0A0A0A",
          shadowOpacity: 0.04,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <View className="relative" style={{ height: height * 0.55 }}>
          <Image
            source={{ uri: session.studio.coverImageUrl }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View
            className="absolute inset-0"
            style={{
              backgroundColor: "transparent",
              shadowColor: "#0A0A0A",
            }}
          />
          {reason ? (
            <View className="absolute top-3 left-3 rounded-full bg-paper/95 px-3 py-1">
              <Text className="text-xs text-ink-primary font-sansMedium">{reason}</Text>
            </View>
          ) : null}
        </View>
        <View className="p-4 gap-1">
          <Text className="text-[15px] font-sansMedium text-ink-primary" numberOfLines={1}>
            {session.class.name}
          </Text>
          <Text className="text-sm text-ink-secondary" numberOfLines={1}>
            {session.studio.name} · {neighborhoodLabel(session.location.neighborhood)}
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <Text
              className="text-sm text-ink-secondary"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {formatTime(session.startTime)}
            </Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-row items-center gap-0.5">
                <Star size={14} color="#9A9A9A" fill="#9A9A9A" />
                <Text
                  className="text-sm text-ink-tertiary"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {Number(session.studio.ratingAvg).toFixed(1)}
                </Text>
              </View>
              <Text
                className="text-sm font-sansMedium text-ink-primary"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCents(session.class.priceCents)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Link>
  );
}

export function TodaysClassCard({ session }: { session: SessionSummary }) {
  return (
    <Link href={{ pathname: "/studio/[slug]", params: { slug: session.studio.slug } }} asChild>
      <View className="rounded-3xl overflow-hidden" style={{ aspectRatio: 16 / 9 }}>
        <Image
          source={{ uri: session.studio.coverImageUrl }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          contentFit="cover"
        />
        <View
          className="absolute inset-0"
          style={{ backgroundColor: "rgba(10,10,10,0.45)" }}
        />
        <View className="absolute inset-x-0 bottom-0 p-5">
          <Text
            className="font-sansSemibold uppercase text-paper/90"
            style={{ fontSize: 11, letterSpacing: 0.88 }}
          >
            next up
          </Text>
          <Text className="font-display text-paper text-[24px] mt-1" style={{ lineHeight: 28 }}>
            {session.class.name}
          </Text>
          <Text className="text-paper/90 text-[15px] mt-0.5">
            {session.studio.name} · {neighborhoodLabel(session.location.neighborhood)}
            {session.instructor ? ` · ${session.instructor.name}` : ""}
          </Text>
          <Text
            className="font-display text-paper text-[24px] mt-3"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {countdownTo(session.startTime)}
          </Text>
        </View>
      </View>
    </Link>
  );
}
