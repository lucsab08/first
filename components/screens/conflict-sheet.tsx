"use client";

import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { trpc } from "@/lib/trpc/client";
import { formatTime, neighborhoodLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export function ConflictSheet({
  open,
  onClose,
  newSessionId,
  onResolved,
}: {
  open: boolean;
  onClose: () => void;
  newSessionId: string;
  onResolved: () => void;
}) {
  const session = trpc.class.sessionById.useQuery(
    { id: newSessionId },
    { enabled: open },
  );
  const conflicts = trpc.booking.checkConflicts.useQuery(
    { sessionId: newSessionId },
    { enabled: open },
  );

  const utils = trpc.useUtils();
  const toast = useToast();

  const createBooking = trpc.booking.create.useMutation();
  const cancelBooking = trpc.booking.cancel.useMutation();

  const existing = conflicts.data?.conflicts?.[0];

  async function cancelAndConfirm() {
    if (!existing) return;
    await cancelBooking.mutateAsync({ bookingId: existing.id });
    await createBooking.mutateAsync({ sessionId: newSessionId });
    await Promise.all([
      utils.booking.upcoming.invalidate(),
      utils.calendar.upcomingToday.invalidate(),
      utils.calendar.week.invalidate(),
      utils.calendar.weekDots.invalidate(),
    ]);
    toast.show({ title: "Swapped. We cancelled the first one.", tone: "success" });
    onResolved();
  }

  async function keepBoth() {
    await createBooking.mutateAsync({ sessionId: newSessionId });
    await utils.booking.upcoming.invalidate();
    toast.show({ title: "Both booked — tight schedule that day." });
    onResolved();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent heightClass="max-h-[80dvh]">
        <div className="px-5 pt-2 pb-6">
          <SheetHeader onClose={onClose}>
            Heads up — you&apos;ve got something then.
          </SheetHeader>

          {session.isLoading || conflicts.isLoading || !session.data || !existing ? (
            <div className="py-10 flex justify-center">
              <LoadingMark />
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { label: "Existing", sessionData: existing.session },
                  { label: "New", sessionData: session.data },
                ].map(({ label, sessionData }) => (
                  <div key={label} className="rounded-2xl bg-elevated p-4">
                    <p className="label-uppercase text-ink-tertiary">{label}</p>
                    <p className="font-medium text-[15px] mt-1 leading-tight">
                      {sessionData.class.name}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-0.5 truncate-1">
                      {sessionData.studio.name}
                    </p>
                    <p className="text-sm tabular mt-2">
                      {format(new Date(sessionData.startTime), "EEE, MMM d")}
                    </p>
                    <p className="font-display text-[18px] tabular mt-0.5">
                      {formatTime(sessionData.startTime)}
                    </p>
                    <p className="text-xs text-ink-tertiary mt-1">
                      {neighborhoodLabel(sessionData.location.neighborhood)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                <Button block onClick={cancelAndConfirm} disabled={cancelBooking.isPending || createBooking.isPending}>
                  Cancel the existing
                </Button>
                <Button block variant="ghost" onClick={keepBoth} disabled={createBooking.isPending}>
                  Keep both
                </Button>
                <Button block variant="text" onClick={onClose}>
                  Never mind
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
