"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { cn, neighborhoodLabel } from "@/lib/utils";

export type StudioRowProps = {
  studio: {
    id: string;
    slug: string;
    name: string;
    coverImageUrl: string;
    ratingAvg: number | string;
  };
  neighborhood: string;
  primaryType?: string;
  distanceKm?: number;
  favorited?: boolean;
  onToggleFavorite?: () => void;
};

export function StudioRow({
  studio,
  neighborhood,
  primaryType,
  distanceKm,
  favorited,
  onToggleFavorite,
}: StudioRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <Link href={`/studio/${studio.slug}`} className="flex items-center gap-3 flex-1 min-w-0 tap">
        <img
          src={studio.coverImageUrl}
          alt=""
          className="h-14 w-14 rounded-xl object-cover shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[15px] truncate-1">{studio.name}</p>
          <p className="text-sm text-ink-secondary truncate-1">
            {distanceKm != null ? <>{distanceKm.toFixed(1)} km · </> : null}
            {primaryType ? <span className="capitalize">{primaryType} · </span> : null}
            {neighborhoodLabel(neighborhood)}
          </p>
        </div>
        <span className="flex items-center gap-0.5 text-sm text-ink-tertiary">
          <Star className="h-3.5 w-3.5 fill-current" />
          <span className="tabular">{Number(studio.ratingAvg).toFixed(1)}</span>
        </span>
      </Link>
      {onToggleFavorite ? (
        <button
          aria-label={favorited ? "Remove from saved" : "Save studio"}
          onClick={onToggleFavorite}
          className="h-9 w-9 rounded-full flex items-center justify-center tap"
        >
          <Heart
            className={cn("h-5 w-5", favorited ? "fill-coral text-coral" : "text-ink-tertiary")}
          />
        </button>
      ) : null}
    </div>
  );
}
