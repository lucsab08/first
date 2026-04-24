"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/lib/stores/onboarding";
import { trpc } from "@/lib/trpc/client";
import { neighborhoodLabel, firstName } from "@/lib/utils";
import { GOALS } from "@/lib/constants";

export default function OnboardingComplete() {
  const state = useOnboarding();
  const me = trpc.auth.me.useQuery();

  const name = firstName(me.data?.fullName ?? null);
  const goalLabels = state.goals
    .map((g) => GOALS.find((x) => x.id === g)?.label)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex-1 flex flex-col px-5 pt-12 pb-8 safe-top safe-bottom">
      <h1 className="font-display text-[32px] font-semibold leading-[1.1]">
        You're in, {name}.
      </h1>
      <p className="mt-2 text-ink-secondary">
        Here's what we've got. You can tweak any of it later under You → Preferences.
      </p>

      <div className="mt-6 space-y-3">
        <Card className="p-4">
          <p className="label-uppercase text-ink-tertiary">Goals</p>
          <p className="mt-1 font-medium">{goalLabels || "—"}</p>
        </Card>
        <Card className="p-4">
          <p className="label-uppercase text-ink-tertiary">Favorites</p>
          <p className="mt-1 font-medium capitalize">{state.workoutTypes.join(" · ")}</p>
        </Card>
        <Card className="p-4">
          <p className="label-uppercase text-ink-tertiary">Neighborhoods</p>
          <p className="mt-1 font-medium">
            {state.neighborhoods.map(neighborhoodLabel).join(" · ")}
          </p>
        </Card>
        <Card className="p-4">
          <p className="label-uppercase text-ink-tertiary">Target</p>
          <p className="mt-1 font-medium tabular">{state.weeklyGoal} classes / week</p>
        </Card>
      </div>

      <div className="flex-1" />

      <Button block asChild>
        <Link href="/today">Let&apos;s find your week</Link>
      </Button>
    </div>
  );
}
