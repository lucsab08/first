import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { AlertTriangle, CreditCard } from "lucide-react-native";
import { useStripe } from "@stripe/stripe-react-native";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { trpc } from "@/lib/trpc";
import { getApiBaseUrl, formatCents, formatTime, neighborhoodLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConflictSheet } from "./conflict-sheet";

/**
 * Booking sheet — class bookings (one-off, real-world service).
 * Uses Stripe Payment Sheet with Apple Pay enabled. Apple takes nothing
 * for these because they're physical studio services. v4.1 §8.7 lane 1.
 */
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
  const conflicts = trpc.booking.checkConflicts.useQuery({ sessionId }, { enabled: open });
  const create = trpc.booking.create.useMutation();
  const utils = trpc.useUtils();
  const toast = useToast();
  const stripe = useStripe();

  const [showConflict, setShowConflict] = useState(false);
  const [paying, setPaying] = useState(false);

  const hasConflicts = (conflicts.data?.conflicts ?? []).length > 0;

  useEffect(() => {
    if (!open) setShowConflict(false);
  }, [open]);

  async function pay() {
    if (!session.data) return;
    if (hasConflicts) {
      setShowConflict(true);
      return;
    }
    setPaying(true);
    try {
      // Step 1 — get a PaymentIntent from the backend.
      const intentRes = await fetch(`${getApiBaseUrl()}/api/booking/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const intent = (await intentRes.json()) as {
        clientSecret?: string;
        bookingId?: string;
        devSkip?: boolean;
        error?: string;
      };

      // Dev fallback — backend returned no clientSecret because Stripe isn't
      // configured locally. Skip the payment sheet and confirm the booking.
      if (intent.devSkip || !intent.clientSecret) {
        await create.mutateAsync({ sessionId });
        finish();
        return;
      }

      // Step 2 — initialize the Payment Sheet with Apple Pay enabled.
      const init = await stripe.initPaymentSheet({
        paymentIntentClientSecret: intent.clientSecret,
        merchantDisplayName: "SyncFit",
        applePay: { merchantCountryCode: "US" },
        defaultBillingDetails: undefined,
        returnURL: "syncfit://stripe-redirect",
      });
      if (init.error) throw new Error(init.error.message);

      // Step 3 — present.
      const result = await stripe.presentPaymentSheet();
      if (result.error) {
        if (result.error.code !== "Canceled") {
          toast.show({ title: "Payment didn't go through", description: result.error.message, tone: "coral" });
        }
        return;
      }

      // Step 4 — confirm booking server-side
      await create.mutateAsync({ sessionId });
      finish();
    } catch (err) {
      toast.show({
        title: "Couldn't book",
        description: err instanceof Error ? err.message : "",
        tone: "coral",
      });
    } finally {
      setPaying(false);
    }
  }

  function finish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    toast.show({
      title: "You're in. We'll remind you 90 minutes before.",
      tone: "success",
    });
    utils.booking.upcoming.invalidate();
    utils.calendar.upcomingToday.invalidate();
    utils.calendar.week.invalidate();
    utils.calendar.weekDots.invalidate();
    onClose();
  }

  return (
    <>
      <Sheet open={open && !showConflict} onClose={onClose} heightFraction={0.7}>
        {session.isLoading || conflicts.isLoading ? (
          <View className="py-12 items-center">
            <LoadingMark />
          </View>
        ) : !session.data ? (
          <View className="p-5">
            <Text className="text-ink-secondary">Session not found.</Text>
          </View>
        ) : (
          <View className="px-5 pt-2 pb-6">
            <SheetHeader onClose={onClose}>
              <Text className="font-display text-[22px]">{session.data.class.name}</Text>
            </SheetHeader>
            <Text className="text-[15px] text-ink-secondary mt-1">
              {session.data.studio.name}
              {" · "}
              {session.data.location.name ?? neighborhoodLabel(session.data.location.neighborhood)}
              {session.data.instructor ? ` · ${session.data.instructor.name}` : ""}
            </Text>

            <View className="mt-5 rounded-2xl bg-elevated p-4 flex-row items-end justify-between">
              <View>
                <Text
                  className="font-display text-[22px]"
                  style={{ fontVariant: ["tabular-nums"] }}
                >
                  {formatTime(session.data.startTime)}
                  <Text className="text-ink-tertiary">  –  </Text>
                  {formatTime(session.data.endTime)}
                </Text>
                <Text className="text-sm text-ink-tertiary mt-0.5">
                  {format(new Date(session.data.startTime), "EEEE, MMM d")}
                </Text>
              </View>
              <Text
                className="font-display text-[22px]"
                style={{ fontVariant: ["tabular-nums"] }}
              >
                {formatCents(session.data.class.priceCents)}
              </Text>
            </View>

            {hasConflicts ? (
              <View className="mt-4 rounded-2xl p-4 flex-row items-start gap-3" style={{ backgroundColor: "rgba(232,123,95,0.15)" }}>
                <AlertTriangle size={18} color="#E87B5F" />
                <View className="flex-1">
                  <Text className="font-sansMedium text-[15px]">
                    Overlaps with {conflicts.data!.conflicts[0]!.session.class.name} at{" "}
                    {formatTime(conflicts.data!.conflicts[0]!.session.startTime)}.
                  </Text>
                  <Text className="text-ink-secondary text-sm mt-0.5">
                    We'll sort it out next.
                  </Text>
                </View>
              </View>
            ) : null}

            <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-elevated p-4">
              <CreditCard size={18} color="#9A9A9A" />
              <Text className="text-sm flex-1">Apple Pay or saved card</Text>
            </View>

            <View className="mt-5">
              <Button block label={paying ? "Booking…" : "Confirm booking"} onPress={pay} disabled={paying} />
              <Button block variant="text" label="Cancel" onPress={onClose} className="mt-2" />
            </View>
          </View>
        )}
      </Sheet>

      <ConflictSheet
        open={showConflict}
        onClose={() => setShowConflict(false)}
        newSessionId={sessionId}
        onResolved={() => {
          setShowConflict(false);
          onClose();
        }}
      />
    </>
  );
}
