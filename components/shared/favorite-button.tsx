"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";

export function FavoriteButton({
  studioId,
  initialFavorited,
  className,
  tone = "paper",
}: {
  studioId: string;
  initialFavorited?: boolean;
  className?: string;
  tone?: "paper" | "ink";
}) {
  const [favorited, setFavorited] = useState(initialFavorited ?? false);
  const toast = useToast();
  const utils = trpc.useUtils();
  const fav = trpc.studio.favorite.useMutation({
    onSuccess: () => utils.studio.savedList.invalidate(),
  });
  const unfav = trpc.studio.unfavorite.useMutation({
    onSuccess: () => utils.studio.savedList.invalidate(),
  });

  async function handleToggle() {
    const next = !favorited;
    setFavorited(next); // optimistic
    try {
      if (next) {
        await fav.mutateAsync({ studioId });
        toast.show({ title: "Saved" });
      } else {
        await unfav.mutateAsync({ studioId });
        toast.show({ title: "Removed from saved" });
      }
    } catch {
      setFavorited(!next);
    }
  }

  return (
    <button
      aria-label={favorited ? "Remove from saved" : "Save studio"}
      onClick={handleToggle}
      className={cn(
        "h-11 w-11 rounded-full flex items-center justify-center tap",
        tone === "paper" ? "bg-paper/90" : "bg-elevated",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5",
          favorited ? "fill-coral text-coral" : "text-ink-primary",
        )}
      />
    </button>
  );
}
