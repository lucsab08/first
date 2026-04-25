import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, Linking } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bookmark,
  Clock,
  MapPin,
  Navigation,
  Share2,
  Heart,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { LoadingMarkCentered } from "@/components/brand/loading-mark";
import { BookingSheet } from "@/components/screens/booking-sheet";
import { cn, formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function StudioScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const studioQ = trpc.studio.bySlug.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug) });
  const savedQ = trpc.studio.savedList.useQuery();
  const fav = trpc.studio.favorite.useMutation();
  const unfav = trpc.studio.unfavorite.useMutation();
  const utils = trpc.useUtils();
  const toast = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [bookSessionId, setBookSessionId] = useState<string | null>(null);
  const [favorited, setFavorited] = useState(false);

  const studio = studioQ.data;
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(startOfDay(new Date()), i)), []);

  const sessionsForDay = (studio?.upcomingSessions ?? []).filter((s) =>
    isSameDay(new Date(s.startTime), selectedDate),
  );

  const isFavorited = useMemo(
    () => favorited || (savedQ.data ?? []).some((s) => s.id === studio?.id),
    [favorited, savedQ.data, studio?.id],
  );

  async function handleFavorite() {
    if (!studio) return;
    const next = !isFavorited;
    setFavorited(next);
    try {
      if (next) await fav.mutateAsync({ studioId: studio.id });
      else await unfav.mutateAsync({ studioId: studio.id });
      utils.studio.savedList.invalidate();
      toast.show({ title: next ? "Saved" : "Removed from saved" });
    } catch {
      setFavorited(!next);
    }
  }

  if (studioQ.isLoading) return <LoadingMarkCentered />;
  if (!studio)
    return (
      <View className="p-5">
        <Text className="text-ink-secondary">Studio not found.</Text>
      </View>
    );

  const primaryLocation = studio.locations[0];
  const classTypes = Array.from(new Set(studio.classes.map((c) => c.type)));

  return (
    <>
      <ScrollView className="bg-paper" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Hero */}
        <View className="relative" style={{ height: 280 }}>
          <Image
            source={{ uri: studio.coverImageUrl ?? "" }}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
            contentFit="cover"
          />
          <View className="absolute inset-0" style={{ backgroundColor: "rgba(10,10,10,0.25)" }} />
          <View
            style={{ paddingTop: insets.top + 8 }}
            className="flex-row items-center justify-between px-4"
          >
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 rounded-full bg-paper/90 items-center justify-center"
              accessibilityLabel="Back"
            >
              <ArrowLeft size={20} color="#0A0A0A" />
            </Pressable>
            <Pressable
              onPress={handleFavorite}
              className="h-11 w-11 rounded-full bg-paper/90 items-center justify-center"
              accessibilityLabel={isFavorited ? "Unsave" : "Save"}
            >
              <Heart
                size={20}
                color={isFavorited ? "#E87B5F" : "#0A0A0A"}
                fill={isFavorited ? "#E87B5F" : "transparent"}
              />
            </Pressable>
          </View>
        </View>

        {/* Header */}
        <View className="px-5 pt-5">
          <Text className="font-display text-[24px] text-ink-primary" style={{ lineHeight: 28 }}>
            {studio.name}
          </Text>
          <Text className="text-sm text-ink-secondary mt-1.5">
            {primaryLocation ? neighborhoodLabel(primaryLocation.neighborhood) : ""}
            {studio.locations.length > 1 ? ` · ${studio.locations.length} locations` : ""}
            {" · "}★ {Number(studio.ratingAvg).toFixed(1)}
            <Text className="text-ink-tertiary"> ({studio.ratingCount})</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2 mt-3">
            {classTypes.slice(0, 4).map((t) => (
              <Chip key={t} className="capitalize">
                {t}
              </Chip>
            ))}
          </View>
        </View>

        {/* Quick actions */}
        <View className="flex-row gap-2 px-5 mt-5">
          {[
            { label: "Book", Icon: Clock, onPress: () => {} },
            {
              label: "Directions",
              Icon: Navigation,
              onPress: () =>
                primaryLocation &&
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(primaryLocation.address)}`),
            },
            { label: "Share", Icon: Share2, onPress: () => {} },
            { label: "Save", Icon: Bookmark, onPress: handleFavorite },
          ].map(({ label, Icon, onPress }) => (
            <Pressable
              key={label}
              onPress={onPress}
              className="flex-1 items-center gap-1 py-3 rounded-2xl bg-elevated"
            >
              <Icon size={20} color="#0A0A0A" />
              <Text className="text-xs text-ink-secondary">{label}</Text>
            </Pressable>
          ))}
        </View>

        {/* About */}
        <View className="px-5 mt-8">
          <Text className="text-[18px] font-sansSemibold mb-2">About</Text>
          <Text
            className="text-[15px] text-ink-secondary"
            style={{ lineHeight: 22 }}
            numberOfLines={aboutExpanded ? undefined : 3}
          >
            {studio.description}
          </Text>
          <Pressable onPress={() => setAboutExpanded((x) => !x)}>
            <Text className="mt-2 text-sm text-ink-primary underline">
              {aboutExpanded ? "Read less" : "Read more"}
            </Text>
          </Pressable>
        </View>

        {/* Schedule */}
        <View className="mt-8">
          <Text className="text-[18px] font-sansSemibold px-5 mb-3">Schedule</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}
          >
            {days.map((d) => {
              const active = isSameDay(d, selectedDate);
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => setSelectedDate(d)}
                  className={cn(
                    "h-16 min-w-[56px] rounded-2xl items-center justify-center px-3",
                    active ? "bg-dusk" : "bg-elevated",
                  )}
                >
                  <Text className={cn("text-[11px]", active ? "text-paper/80" : "text-ink-tertiary")}>
                    {format(d, "EEE")}
                  </Text>
                  <Text
                    className={cn(
                      "text-[17px] font-sansSemibold mt-0.5",
                      active ? "text-paper" : "text-ink-primary",
                    )}
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {format(d, "d")}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="px-5 mt-3">
            {sessionsForDay.length === 0 ? (
              <Text className="text-sm text-ink-secondary py-6">
                Nothing on the schedule that day. Try another.
              </Text>
            ) : (
              sessionsForDay.map((s) => {
                const cls = studio.classes.find((c) => c.id === s.classId);
                const instr = studio.instructors.find((i) => i.id === s.instructorId);
                const remaining = Math.max(0, s.capacity - s.spotsBooked);
                return (
                  <View
                    key={s.id}
                    className="flex-row items-center gap-3 py-4 border-b border-hairline"
                  >
                    <View className="w-16">
                      <Text
                        className="text-[15px] font-sansMedium"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {formatTime(s.startTime)}
                      </Text>
                      <Text
                        className="text-xs text-ink-tertiary"
                        style={{ fontVariant: ["tabular-nums"] }}
                      >
                        {cls?.durationMinutes} min
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="font-sansMedium text-[15px]" numberOfLines={1}>
                        {cls?.name}
                      </Text>
                      <Text className="text-sm text-ink-secondary" numberOfLines={1}>
                        {instr?.name ?? "Multiple instructors"}
                        {remaining <= 2 ? (
                          <Text className="text-coral">
                            {" · "}
                            {remaining === 0 ? "full — waitlist" : `${remaining} left`}
                          </Text>
                        ) : null}
                      </Text>
                    </View>
                    <Text
                      className="text-sm text-ink-tertiary"
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {formatCents(cls?.priceCents ?? 0)}
                    </Text>
                    <Button
                      size="sm"
                      label={remaining === 0 ? "Waitlist" : "Book"}
                      onPress={() => setBookSessionId(s.id)}
                    />
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Instructors */}
        {studio.instructors.length > 0 ? (
          <View className="mt-10">
            <Text className="text-[18px] font-sansSemibold px-5 mb-3">Instructors</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
            >
              {studio.instructors.map((i) => (
                <View key={i.id} className="w-24 items-center">
                  {i.avatarUrl ? (
                    <Image
                      source={{ uri: i.avatarUrl }}
                      style={{ height: 96, width: 96, borderRadius: 16 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View className="h-24 w-24 rounded-2xl bg-elevated" />
                  )}
                  <Text className="text-sm font-sansMedium mt-2" numberOfLines={1}>
                    {i.name}
                  </Text>
                  <Text className="text-xs text-ink-tertiary text-center" numberOfLines={1}>
                    {i.specialty}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Reviews */}
        <View className="mt-10 px-5">
          <Text className="text-[18px] font-sansSemibold mb-3">Reviews</Text>
          <View className="flex-row items-end gap-2">
            <Text
              className="font-display text-[32px]"
              style={{ fontVariant: ["tabular-nums"], lineHeight: 32 }}
            >
              {Number(studio.ratingAvg).toFixed(1)}
            </Text>
            <Text className="text-xs text-ink-tertiary mb-1">{studio.ratingCount} reviews</Text>
          </View>
          <View className="mt-4 gap-4">
            {(studio.reviews ?? []).slice(0, 3).map((r) => (
              <View key={r.id} className="border-t border-hairline pt-4">
                <View className="flex-row items-center justify-between">
                  <Text className="font-sansMedium text-[15px]">
                    {(r as { reviewerName?: string }).reviewerName ?? "Member"}
                  </Text>
                  <Text className="text-xs text-ink-tertiary">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </Text>
                </View>
                <Text className="text-[15px] text-ink-secondary mt-1" style={{ lineHeight: 22 }}>
                  {r.comment}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location */}
        {primaryLocation ? (
          <View className="mt-10 px-5">
            <Text className="text-[18px] font-sansSemibold mb-3">Location</Text>
            <View className="flex-row items-start gap-3">
              <MapPin size={20} color="#9A9A9A" />
              <View className="flex-1">
                <Text className="text-[15px]">{primaryLocation.address}</Text>
                <Pressable
                  onPress={() =>
                    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(primaryLocation.address)}`)
                  }
                >
                  <Text className="text-sm text-ink-primary underline">Open in Maps</Text>
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      <View
        className="absolute left-0 right-0 px-5 pt-2 pb-3 bg-paper"
        style={{ bottom: insets.bottom }}
      >
        <Button
          block
          label="Book a class"
          onPress={() => {
            const firstUpcoming = (studio.upcomingSessions ?? [])[0];
            if (firstUpcoming) setBookSessionId(firstUpcoming.id);
          }}
        />
      </View>

      {bookSessionId ? (
        <BookingSheet
          sessionId={bookSessionId}
          open={Boolean(bookSessionId)}
          onClose={() => setBookSessionId(null)}
        />
      ) : null}
    </>
  );
}
