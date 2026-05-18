"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertTriangle, CreditCard } from "lucide-react";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { BookingCheckout } from "@/components/booking-checkout";
import { trpc } from "@/lib/trpc/client";
import { formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConflictSheet } from "./conflict-sheet";

export function BookingSheet({
  sessionId,
  open,
  onClose,
  checkoutMode = "legacy",
}: {
  sessionId: string;
  open: boolean;
  onClose: () => void;
  checkoutMode?: "legacy" | "stripe";
}) {
  const session = trpc.class.sessionById.useQuery({ id: sessionId }, { enabled: open });
  const conflicts = trpc.booking.checkConflicts.useQuery(
    { sessionId },
    { enabled: open },
  );
  const utils = trpc.useUtils();
  const toast = useToast();
  const [showConflictSheet, setShowConflictSheet] = useState(false);
  const [paidIntentId, setPaidIntentId] = useState<string | null>(null);

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

  const hasConflicts = (conflicts.data?.conflicts ?? []).length > 0;

  async function finalizeBooking(paymentIntentId?: string | null) {
    if (hasConflicts) {
      setPaidIntentId(paymentIntentId ?? null);
      setShowConflictSheet(true);
      return;
    }
    await create.mutateAsync({
      sessionId,
      paymentIntentId: paymentIntentId ?? undefined,
    });
  }

  async function confirm() {
    await finalizeBooking();
  }

  function handlePaymentSuccess(paymentIntentId: string | null) {
    void finalizeBooking(paymentIntentId);
  }

  useEffect(() => {
    if (!open) {
      setShowConflictSheet(false);
      setPaidIntentId(null);
    }
  }, [open]);

  return (
    <>
      <Sheet open={open && !showConflictSheet} onOpenChange={(o) => !o && onClose()}>
        <SheetContent
          heightClass={checkoutMode === "stripe" ? "max-h-[90dvh]" : "max-h-[75dvh]"}
        >
          {session.isLoading || conflicts.isLoading ? (
            <div className="p-10 flex justify-center">
              <LoadingMark />
            </div>
          ) : !session.data ? (
            <SessionNotFound />
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
                <ConflictBanner checkoutMode={checkoutMode} conflicts={conflicts.data!} />
              ) : null}

              {checkoutMode === "stripe" ? (
                <div className="mt-4">
                  <BookingCheckout
                    sessionId={sessionId}
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => toast.show({ title: msg, tone: "error" })}
                  />
                  <Button variant="text" className="mt-3 w-full" onClick={onClose}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <LegacyActions onConfirm={confirm} onClose={onClose} pending={create.isPending} />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConflictSheet
        open={showConflictSheet}
        onClose={() => setShowConflictSheet(false)}
        newSessionId={sessionId}
        paymentIntentId={paidIntentId}
        onResolved={() => {
          setShowConflictSheet(false);
          onClose();
        }}
      />
    </>
  );
}

function SessionNotFound() {
  return (
    <div className="p-5">
      <p className="text-ink-secondary">Session not found.</p>
    </div>
  );
}

function ConflictBanner({
  checkoutMode,
  conflicts,
}: {
  checkoutMode: "legacy" | "stripe";
  conflicts: {
    conflicts: Array<{
      session: { class: { name: string }; startTime: Date | string };
    }>;
  };
}) {
  const first = conflicts.conflicts[0]!;
  return (
    <div className="mt-4 rounded-2xl bg-coral/15 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-coral shrink-0 mt-0.5" />
      <div className="text-sm text-ink-primary">
        <p className="font-medium">
          This overlaps with {first.session.class.name} at {formatTime(first.session.startTime)}.
        </p>
        <p className="text-ink-secondary mt-0.5">
          {checkoutMode === "stripe"
            ? "Complete payment, then we'll sort it out on the next step."
            : "We'll sort it out on the next step."}
        </p>
      </div>
    </div>
  );
}

function LegacyActions({
  onConfirm,
  onClose,
  pending,
}: {
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  return (
    <>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-elevated p-4">
        <CreditCard className="h-5 w-5 text-ink-tertiary" />
        <p className="text-sm flex-1">Visa ending 4242</p>
        <button type="button" className="text-sm text-ink-primary underline underline-offset-4">
          Change
        </button>
      </div>
      <LegacyActionsGrid onConfirm={onConfirm} onClose={onClose} pending={pending} />
    </>
  );
}

function LegacyActionsGrid({
  onConfirm,
  onClose,
  pending,
}: {
  onConfirm: () => void;
  onClose: () => void;
  pending: boolean;
}) {
  return (
    <div className="mt-5 grid grid-cols-[1fr_auto] gap-3">
      <Button onClick={onConfirm} disabled={pending}>
        {pending ? "Booking…" : "Confirm booking"}
      </Button>
      <Button variant="text" onClick={onClose}>
        Cancel
      </Button>
    </div>
  );
}
