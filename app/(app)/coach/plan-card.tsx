"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { neighborhoodLabel } from "@/lib/utils";
import { trpc } from "@/lib/trpc/client";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";

export type PlanRow = {
  session_id: string;
  day?: string;
  class_name?: string;
  studio_name?: string;
  studio_slug?: string;
  neighborhood?: string;
  time?: string;
  reason: string;
};

export type Plan = {
  week_start: string;
  sessions: { session_id: string; reason: string }[];
  rows?: PlanRow[];
};

export function PlanCard({
  plan,
  conversationId,
}: {
  plan: Plan;
  conversationId: string;
}) {
  const toast = useToast();
  const utils = trpc.useUtils();
  const [booked, setBooked] = useState(false);
  const accept = trpc.coach.acceptPlan.useMutation({
    onSuccess: (res) => {
      utils.booking.upcoming.invalidate();
      utils.calendar.week.invalidate();
      utils.calendar.weekDots.invalidate();
      toast.show({
        title: `Booked ${res.booked} of ${res.total}`,
        description: "We'll remind you 90 minutes before each.",
        tone: "success",
      });
      setBooked(true);
    },
    onError: (err) =>
      toast.show({ title: "Couldn't book", description: err.message, tone: "coral" }),
  });

  const rows = plan.rows ?? [];

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 pt-5 pb-2">
        <p className="label-uppercase text-dusk">Week of {format(new Date(plan.week_start), "MMM d")}</p>
      </div>
      <div className="divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.session_id} className="flex items-start gap-4 px-5 py-3">
            <div className="w-12 shrink-0">
              <p className="text-[11px] text-ink-tertiary uppercase tracking-wide">{r.day?.slice(0, 3)}</p>
              <p className="tabular text-[15px] font-medium mt-0.5">{r.time}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[15px] truncate-1">
                {r.studio_slug ? (
                  <Link href={`/studio/${r.studio_slug}`} className="underline-offset-2 hover:underline">
                    {r.class_name}
                  </Link>
                ) : (
                  r.class_name
                )}
              </p>
              <p className="text-sm text-ink-secondary truncate-1">
                {r.studio_name}
                {r.neighborhood ? ` · ${neighborhoodLabel(r.neighborhood)}` : ""}
              </p>
              <p className="text-xs text-ink-tertiary mt-1 italic leading-snug">{r.reason}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-5 py-4 flex gap-3 border-t border-hairline bg-elevated">
        <Button
          disabled={booked || accept.isPending}
          onClick={() =>
            accept.mutate({
              conversationId,
              sessionIds: plan.sessions.map((s) => s.session_id),
            })
          }
        >
          {booked ? "Booked" : accept.isPending ? "Booking…" : "Book all"}
        </Button>
        <Button variant="ghost" disabled={booked}>
          Tweak
        </Button>
      </div>
    </Card>
  );
}
