import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Bike,
  Crown,
  Dumbbell,
  Flame,
  Footprints,
  Leaf,
  Mountain,
  Search,
  SlidersHorizontal,
  Zap,
} from "lucide-react-native";
import { trpc } from "@/lib/trpc";
import { Card, SandCard } from "@/components/ui/card";
import { LabelTag } from "@/components/ui/chip";
import { SectionHeader } from "@/components/shared/section-header";
import { SessionCard, type SessionSummary } from "@/components/shared/session-card";
import { StudioRow } from "@/components/shared/studio-row";
import { WORKOUT_TYPES } from "@/lib/constants";
import { useFilters, activeFilterCount } from "@/lib/stores/filters";
import { FilterSheet } from "@/components/screens/filter-sheet";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  pilates: Crown,
  boxing: Flame,
  yoga: Leaf,
  hiit: Zap,
  strength: Dumbbell,
  bootcamp: Mountain,
  cycling: Bike,
  run: Footprints,
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = useFilters();
  const filterCount = useMemo(() => activeFilterCount(filters), [filters]);

  const trending = trpc.class.trending.useQuery({ limit: 5 });
  const studios = trpc.studio.list.useQuery({ limit: 50 });
  const search = trpc.studio.search.useQuery({ q: query }, { enabled: query.trim().length >= 2 });
  const studioList = query.trim().length >= 2 ? search.data ?? [] : studios.data?.items ?? [];

  return (
    <>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search + filter */}
        <View className="flex-row items-center gap-2">
          <View className="flex-1 relative">
            <Search
              size={18}
              color="#9A9A9A"
              style={{ position: "absolute", left: 14, top: 13, zIndex: 1 }}
            />
            <TextInput
              className="h-12 rounded-2xl bg-elevated px-5 pl-11 text-ink-primary"
              placeholder="Classes, studios, neighborhoods."
              placeholderTextColor="#9A9A9A"
              value={query}
              onChangeText={setQuery}
              style={{ fontSize: 15 }}
            />
          </View>
          <Pressable
            onPress={() => setFilterOpen(true)}
            className="h-12 w-12 rounded-2xl bg-elevated items-center justify-center"
            accessibilityLabel="Filters"
          >
            <SlidersHorizontal size={20} color="#0A0A0A" />
            {filterCount > 0 ? (
              <View className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-coral items-center justify-center">
                <Text
                  className="text-paper font-sansSemibold"
                  style={{ fontSize: 11, fontVariant: ["tabular-nums"] }}
                >
                  {filterCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingTop: 24, paddingRight: 20 }}
          style={{ marginHorizontal: -20, paddingLeft: 20 }}
        >
          {WORKOUT_TYPES.map((t) => {
            const Icon = CATEGORY_ICONS[t] ?? Dumbbell;
            const active = filters.types.includes(t);
            return (
              <Pressable
                key={t}
                onPress={() => filters.toggle("types", t)}
                className="items-center gap-1.5"
              >
                <View
                  className={`h-16 w-16 rounded-full items-center justify-center ${
                    active ? "bg-dusk" : "bg-elevated"
                  }`}
                >
                  <Icon size={24} color={active ? "#FAFAF7" : "#0A0A0A"} />
                </View>
                <Text className="text-xs text-ink-secondary capitalize">{t}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Trending */}
        <View className="mt-8">
          <SectionHeader title="Trending Miami classes" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingTop: 12, paddingRight: 20 }}
            style={{ marginHorizontal: -20, paddingLeft: 20 }}
          >
            {(trending.data ?? []).map((s) => (
              <View key={(s as SessionSummary).id}>
                <View
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 10,
                    backgroundColor: "rgba(250,250,247,0.95)",
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                  }}
                >
                  <LabelTag>Trending</LabelTag>
                </View>
                <SessionCard session={s as unknown as SessionSummary} width={300} height={380} />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* New / pop-ups */}
        <View className="mt-8 gap-3">
          <SectionHeader title="Pop-ups & new studios" />
          <SandCard>
            <View className="absolute top-4 right-4">
              <LabelTag>New</LabelTag>
            </View>
            <Text className="font-display text-[20px] text-ink-primary">
              Third House — Sunrise Breathwork
            </Text>
            <Text className="text-sm text-ink-secondary mt-1">
              45 minutes of guided breathwork at sunrise, in a Design District courtyard.
            </Text>
            <Link
              href="/studio/third-house"
              className="mt-3 text-sm text-ink-primary underline"
            >
              See the pop-up
            </Link>
          </SandCard>
        </View>

        {/* All studios */}
        <View className="mt-8">
          <SectionHeader title="All studios" />
          <View className="mt-2">
            {studioList.length === 0 ? (
              <Card className="mt-3">
                <Text className="font-display text-[18px]">No match for "{query}".</Text>
                <Text className="text-sm text-ink-secondary mt-1">
                  Try a neighborhood — "Brickell," "Wynwood," "Coral Gables."
                </Text>
              </Card>
            ) : (
              studioList.map((st) => (
                <View key={st.id} className="border-b border-hairline">
                  <StudioRow
                    studio={st}
                    neighborhood={deriveNeighborhood(st.slug)}
                    primaryType={deriveType(st.slug)}
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </>
  );
}

function deriveNeighborhood(slug: string): string {
  switch (slug) {
    case "legacy-fit":
      return "wynwood";
    case "soulcycle":
      return "coconut_grove";
    case "rumble-boxing":
      return "brickell";
    case "third-house":
      return "design_district";
    default:
      return "brickell";
  }
}

function deriveType(slug: string): string | undefined {
  const map: Record<string, string> = {
    "jetset-pilates": "pilates",
    solidcore: "pilates",
    barrys: "hiit",
    anatomy: "yoga",
    "legacy-fit": "strength",
    "modo-yoga-miami": "yoga",
    "rumble-boxing": "boxing",
    soulcycle: "cycling",
    "f45-training": "hiit",
    sweat440: "hiit",
    "green-monkey-yoga": "yoga",
    "third-house": "breathwork",
  };
  return map[slug];
}
