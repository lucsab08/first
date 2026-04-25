import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";
import { Image } from "expo-image";
import { Heart, Star } from "lucide-react-native";
import { neighborhoodLabel } from "@/lib/utils";

export function StudioRow({
  studio,
  neighborhood,
  primaryType,
  distanceKm,
  favorited,
  onToggleFavorite,
}: {
  studio: { id: string; slug: string; name: string; coverImageUrl: string; ratingAvg: number | string };
  neighborhood: string;
  primaryType?: string;
  distanceKm?: number;
  favorited?: boolean;
  onToggleFavorite?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 py-3">
      <Link
        href={{ pathname: "/studio/[slug]", params: { slug: studio.slug } }}
        asChild
        style={{ flex: 1 }}
      >
        <Pressable className="flex-row items-center gap-3 flex-1">
          <Image
            source={{ uri: studio.coverImageUrl }}
            style={{ height: 56, width: 56, borderRadius: 12 }}
            contentFit="cover"
          />
          <View className="flex-1">
            <Text className="text-[15px] font-sansMedium text-ink-primary" numberOfLines={1}>
              {studio.name}
            </Text>
            <Text className="text-sm text-ink-secondary" numberOfLines={1}>
              {distanceKm != null ? `${distanceKm.toFixed(1)} km · ` : ""}
              {primaryType ? `${primaryType} · ` : ""}
              {neighborhoodLabel(neighborhood)}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Star size={14} color="#9A9A9A" fill="#9A9A9A" />
            <Text
              className="text-sm text-ink-tertiary"
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {Number(studio.ratingAvg).toFixed(1)}
            </Text>
          </View>
        </Pressable>
      </Link>
      {onToggleFavorite ? (
        <Pressable
          onPress={onToggleFavorite}
          className="h-9 w-9 rounded-full items-center justify-center"
          accessibilityLabel={favorited ? "Remove from saved" : "Save studio"}
        >
          <Heart
            size={20}
            color={favorited ? "#E87B5F" : "#9A9A9A"}
            fill={favorited ? "#E87B5F" : "transparent"}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
