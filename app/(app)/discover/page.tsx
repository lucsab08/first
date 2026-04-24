"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { Input } from "@/components/ui/input";
import { Card, SandCard } from "@/components/ui/card";
import { Chip, LabelTag } from "@/components/ui/chip";
import { SectionHeader } from "@/components/shared/section-header";
import { HorizontalScroller } from "@/components/shared/horizontal-scroller";
import { SessionCard, type SessionSummary } from "@/components/shared/session-card";
import { StudioRow } from "@/components/shared/studio-row";
import { FilterSheet } from "@/components/screens/filter-sheet";
import { activeFilterCount, useFilters } from "@/lib/stores/filters";
import { WORKOUT_TYPES } from "@/lib/constants";
import {
  Dumbbell,
  Bike,
  Flame,
  Mountain,
  Footprints,
  Crown,
  Zap,
  Leaf,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pilates: Crown,
  boxing: Flame,
  yoga: Leaf,
  hiit: Zap,
  strength: Dumbbell,
  bootcamp: Mountain,
  cycling: Bike,
  run: Footprints,
};

export default function DiscoverPage() {
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const filters = useFilters();

  const trending = trpc.class.trending.useQuery({ limit: 5 });
  const searchSessions = trpc.class.search.useQuery({
    types: filters.types.length ? filters.types : undefined,
    neighborhoods: filters.neighborhoods.length ? filters.neighborhoods : undefined,
    intensity: filters.intensity ?? undefined,
    timeOfDay: filters.timeOfDay ?? undefined,
    beginnerFriendly: filters.beginnerFriendly || undefined,
    priceMaxCents: filters.priceMaxCents < 6000 ? filters.priceMaxCents : undefined,
    limit: 30,
  });
  const studios = trpc.studio.list.useQuery({ limit: 50 });
  const searchResults = trpc.studio.search.useQuery(
    { q: query },
    { enabled: query.trim().length >= 2 },
  );

  const filterCount = useMemo(() => activeFilterCount(filters), [filters]);

  const studioList = query.trim().length >= 2 ? searchResults.data ?? [] : studios.data?.items ?? [];

  return (
    <div className="px-5 pt-4 pb-8">
      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-tertiary" />
          <Input
            className="pl-11 h-12"
            placeholder="Classes, studios, neighborhoods."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setFilterOpen(true)}
          className="relative h-12 w-12 rounded-2xl bg-elevated flex items-center justify-center tap"
          aria-label="Filters"
        >
          <SlidersHorizontal className="h-5 w-5 text-ink-primary" />
          {filterCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-coral text-paper text-[11px] font-semibold tabular flex items-center justify-center">
              {filterCount}
            </span>
          ) : null}
        </button>
      </div>

      {/* Category row */}
      <section className="mt-6">
        <div className="flex gap-4 overflow-x-auto scroll-hide -mx-5 px-5">
          {WORKOUT_TYPES.map((t) => {
            const Icon = CATEGORY_ICONS[t] ?? Dumbbell;
            const active = filters.types.includes(t);
            return (
              <button
                key={t}
                onClick={() => filters.toggle("types", t)}
                className="flex flex-col items-center gap-1.5 tap shrink-0"
              >
                <span
                  className={`h-16 w-16 rounded-full flex items-center justify-center ${
                    active ? "bg-dusk text-paper" : "bg-elevated text-ink-primary"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <span className="text-xs capitalize">{t}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trending */}
      <section className="mt-8">
        <SectionHeader title="Trending Miami classes" />
        <div className="mt-3">
          <HorizontalScroller>
            {(trending.data ?? []).map((s) => {
              const session = s as unknown as SessionSummary;
              return (
                <div key={session.id} className="relative snap-start shrink-0">
                  <LabelTag className="absolute top-3 right-3 z-10 bg-paper/95 px-2 py-0.5 rounded-full">
                    Trending
                  </LabelTag>
                  <SessionCard session={session} width={300} height={380} />
                </div>
              );
            })}
          </HorizontalScroller>
        </div>
      </section>

      {/* New / pop-ups */}
      <section className="mt-8 space-y-3">
        <SectionHeader title="Pop-ups & new studios" />
        <SandCard className="relative">
          <LabelTag className="absolute top-4 right-4">New</LabelTag>
          <p className="font-display text-[20px] font-semibold mt-0.5">Third House — Sunrise Breathwork</p>
          <p className="text-sm text-ink-secondary mt-1">
            45 minutes of guided breathwork at sunrise, in a Design District courtyard.
          </p>
          <Link
            href="/studio/third-house"
            className="inline-block mt-3 text-sm text-ink-primary underline underline-offset-4"
          >
            See the pop-up
          </Link>
        </SandCard>
        <SandCard className="relative">
          <LabelTag className="absolute top-4 right-4">New</LabelTag>
          <p className="font-display text-[20px] font-semibold mt-0.5">F45 Coral Gables</p>
          <p className="text-sm text-ink-secondary mt-1">
            F45's Gables location just opened. Launch week pricing.
          </p>
          <Link
            href="/studio/f45-training"
            className="inline-block mt-3 text-sm text-ink-primary underline underline-offset-4"
          >
            See studio
          </Link>
        </SandCard>
      </section>

      {/* Filtered sessions (if filters are active) */}
      {filterCount > 0 ? (
        <section className="mt-8">
          <SectionHeader title="Matching your filters" />
          <div className="mt-3 space-y-3">
            {(searchSessions.data?.items ?? []).slice(0, 10).map((s) => (
              <SessionCard
                key={s.id}
                session={s as unknown as SessionSummary}
                width={400}
                height={120}
                className="w-full !h-auto"
              />
            ))}
            {searchSessions.data?.items.length === 0 ? (
              <Card>
                <p className="font-display text-[18px] font-semibold">Nothing's an exact match.</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Try dropping one filter or widening the time window.
                </p>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* All studios */}
      <section className="mt-8">
        <SectionHeader title="All studios" />
        <div className="mt-2 divide-y divide-hairline">
          {studioList.length === 0 ? (
            <Card className="mt-3">
              <p className="font-display text-[18px] font-semibold">No match for "{query}".</p>
              <p className="text-sm text-ink-secondary mt-1">
                Try a neighborhood — "Brickell," "Wynwood," "Coral Gables."
              </p>
            </Card>
          ) : (
            studioList.map((st) => (
              <StudioRow
                key={st.id}
                studio={st}
                neighborhood={deriveNeighborhood(st.slug)}
                primaryType={deriveType(st.slug)}
              />
            ))
          )}
        </div>
      </section>

      <FilterSheet open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
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
    "barrys": "hiit",
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
