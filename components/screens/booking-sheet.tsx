"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { trpc } from "@/lib/trpc/client";
import { formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConflictSheet } from "./conflict-sheet";

export function BookingSheet({
  sessionId,
  open,
  onClose,
}: {
  sessionId: string;
  open: boolean;
  onClose: () => void;
}) {
  const session = trpc.class.sessionById.useQuery({ id: sessionId }, { enabled: open });
  const conflicts = trpc.booking.checkConflicts.useQuery(
    { sessionId },
    { enabled: open },
  );
  const utils = trpc.useUtils();
  const create = trpc.booking.create.useMutation({
    onSuccess: () => {
      utils.booking.upcoming.invalidate();
      utils.calendar.upcomingToday.invalidate();
      utils.calendar.week.invalidate();
      utils.calendar.weekDots.invalidate();
      toast.show({ title: "You're in. We'll remind you 90 minutes before.", tone: "success" });
      onClose();
    },
  });

  const toast = useToast();
  const [showConflictSheet, setShowConflictSheet] = useState(false);

  const hasConflicts = (conflicts.data?.conflicts ?? []).length > 0;

  async function confirm() {
    if (hasConflicts) {
      setShowConflictSheet(true);
      return;
    }
    await create.mutateAsync({ sessionId });
  }

  useEffect(() => {
    if (!open) setShowConflictSheet(false);
  }, [open]);

  return (
    <>
      <Sheet open={open && !showConflictSheet} onOpenChange={(o) => !o && onClose()}>
        <SheetContent heightClass="max-h-[75dvh]">
          {session.isLoading || conflicts.isLoading ? (
            <div className="p-10 flex justify-center">
              <LoadingMark />
            </div>
          ) : !session.data ? (
            <div className="p-5">
              <p className="text-ink-secondary">Session not found.</p>
            </div>
          ) : (
            <div className="px-5 pt-2 pb-6">
              <SheetHeader onClose={onClose}>{session.data.class.name}</SheetHeader>
              <p className="text-[15px] text-ink-secondary mt-1">
                {session.data.studio.name}
                {" · "}
                {session.data.location.name ?? neighborhoodLabel(session.data.location.neighborhood)}
                {session.data.instructor ? ` · ${session.data.instructor.name}` : ""}
              </p>

              <div className="mt-5 rounded-2xl bg-elevated p-4 flex items-baseline justify-between">
                <div>
                  <p className="font-display text-[22px] font-semibold tabular">
                    {formatTime(session.data.startTime)}
                    <span className="text-ink-tertiary mx-2">–</span>
                    {formatTime(session.data.endTime)}
                  </p>
                  <p className="text-sm text-ink-tertiary mt-0.5">
                    {format(new Date(session.data.startTime), "EEEE, MMM d")}
                  </p>
                </div>
                <p className="font-display text-[22px] font-semibold tabular">
                  {formatCents(session.data.class.priceCents)}
                </p>
              </div>

              {hasConflicts ? (
                <div className="mt-4 rounded-2xl bg-coral/15 p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-coral shrink-0 mt-0.5" />
                  <div className="text-sm text-ink-primary">
                    <p className="font-medium">
                      This overlaps with{" "}
                      {conflicts.data!.conflicts[0]!.session.class.name} at{" "}
                      {formatTime(conflicts.data!.conflicts[0]!.session.startTime)}.
                    </p>
                    <p className="text-ink-secondary mt-0.5">
                      We'll sort it out on the next step.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-elevated p-4">
                <CreditCard className="h-5 w-5 text-ink-tertiary" />
                <p className="text-sm flex-1">Visa ending 4242</p>
                <button className="text-sm text-ink-primary underline underline-offset-4">
                  Change
                </button>
              </div>

              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
                <Button onClick={confirm} disabled={create.isPending}>
                  {create.isPending ? "Booking…" : "Confirm booking"}
                </Button>
                <Button variant="text" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConflictSheet
        open={showConflictSheet}
        onClose={() => setShowConflictSheet(false)}
        newSessionId={sessionId}
        onResolved={() => {
          setShowConflictSheet(false);
          onClose();
        }}
      />
    </>
  );
}
