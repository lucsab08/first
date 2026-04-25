import { Text, View } from "react-native";
import { format } from "date-fns";
import { Sheet, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LoadingMark } from "@/components/brand/loading-mark";
import { trpc } from "@/lib/trpc";
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
  const session = trpc.class.sessionById.useQuery({ id: newSessionId }, { enabled: open });
  const conflicts = trpc.booking.checkConflicts.useQuery({ sessionId: newSessionId }, { enabled: open });
  const utils = trpc.useUtils();
  const toast = useToast();

  const create = trpc.booking.create.useMutation();
  const cancel = trpc.booking.cancel.useMutation();

  const existing = conflicts.data?.conflicts?.[0];

  async function cancelAndConfirm() {
    if (!existing) return;
    await cancel.mutateAsync({ bookingId: existing.id });
    await create.mutateAsync({ sessionId: newSessionId });
    invalidateAll();
    toast.show({ title: "Swapped. We cancelled the first one.", tone: "success" });
    onResolved();
  }
  async function keepBoth() {
    await create.mutateAsync({ sessionId: newSessionId });
    invalidateAll();
    toast.show({ title: "Both booked — tight schedule that day." });
    onResolved();
  }
  function invalidateAll() {
    utils.booking.upcoming.invalidate();
    utils.calendar.upcomingToday.invalidate();
    utils.calendar.week.invalidate();
    utils.calendar.weekDots.invalidate();
  }

  return (
    <Sheet open={open} onClose={onClose} heightFraction={0.8}>
      <View className="px-5 pt-2 pb-6">
        <SheetHeader onClose={onClose}>
          <Text className="font-display text-[22px]">
            Heads up — you've got something then.
          </Text>
        </SheetHeader>

        {session.isLoading || conflicts.isLoading || !session.data || !existing ? (
          <View className="py-12 items-center">
            <LoadingMark />
          </View>
        ) : (
          <>
            <View className="mt-4 flex-row gap-3">
              {[
                { label: "Existing", sd: existing.session },
                { label: "New", sd: session.data },
              ].map(({ label, sd }) => (
                <View key={label} className="flex-1 rounded-2xl bg-elevated p-4">
                  <Text
                    className="text-ink-tertiary font-sansSemibold uppercase"
                    style={{ fontSize: 11, letterSpacing: 0.88 }}
                  >
                    {label}
                  </Text>
                  <Text
                    className="font-sansMedium text-[15px] mt-1"
                    style={{ lineHeight: 18 }}
                    numberOfLines={2}
                  >
                    {sd.class.name}
                  </Text>
                  <Text className="text-xs text-ink-tertiary mt-0.5" numberOfLines={1}>
                    {sd.studio.name}
                  </Text>
                  <Text
                    className="text-sm mt-2"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {format(new Date(sd.startTime), "EEE, MMM d")}
                  </Text>
                  <Text
                    className="font-display text-[18px] mt-0.5"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {formatTime(sd.startTime)}
                  </Text>
                  <Text className="text-xs text-ink-tertiary mt-1">
                    {neighborhoodLabel(sd.location.neighborhood)}
                  </Text>
                </View>
              ))}
            </View>

            <View className="mt-5 gap-2">
              <Button
                block
                label="Cancel the existing"
                onPress={cancelAndConfirm}
                disabled={cancel.isPending || create.isPending}
              />
              <Button
                block
                variant="ghost"
                label="Keep both"
                onPress={keepBoth}
                disabled={create.isPending}
              />
              <Button block variant="text" label="Never mind" onPress={onClose} />
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
}
