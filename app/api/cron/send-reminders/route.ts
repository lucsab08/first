import { NextResponse } from "next/server";
import { differenceInMinutes } from "date-fns";
import { getStore, getSessionById } from "@/server/db/mock";
import { CLASSES, LOCATIONS, STUDIOS } from "@/server/db/fixtures";
import { sendReminder } from "@/server/services/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Invoked by Vercel Cron every 5 minutes. §8.4
 * Emits one 90-min and one 30-min reminder per booking (idempotent).
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const store = getStore();
  const now = new Date();
  let sent90 = 0;
  let sent30 = 0;

  for (const booking of store.bookings.values()) {
    if (booking.status !== "confirmed") continue;
    const session = getSessionById(booking.sessionId);
    if (!session) continue;

    const cls = CLASSES.find((c) => c.id === session.classId);
    const loc = LOCATIONS.find((l) => l.id === session.locationId);
    const studio = cls ? STUDIOS.find((x) => x.id === cls.studioId) : undefined;
    if (!cls || !loc || !studio) continue;

    const user = store.users.get(booking.userId);
    const minutesUntil = differenceInMinutes(session.startTime, now);

    if (!booking.reminder90Sent && minutesUntil <= 90 && minutesUntil > 45) {
      await sendReminder({
        bookingId: booking.id,
        title: "You're up in 90",
        body: `${cls.name} at ${studio.name} · ${loc.address}. Bring the green towel.`,
        recipient: {
          userId: booking.userId,
          email: user?.email ?? null,
          pushSubs: [], // push_subscriptions lookup when wired to DB
        },
      });
      store.bookings.set(booking.id, { ...booking, reminder90Sent: true });
      sent90++;
    }

    if (!booking.reminder30Sent && minutesUntil <= 30 && minutesUntil > 0) {
      const leaveBy = new Date(session.startTime.getTime() - 15 * 60 * 1000);
      const leaveStr = leaveBy.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
      await sendReminder({
        bookingId: booking.id,
        title: "30 minutes out",
        body: `Leave by ${leaveStr} if you're driving. ${loc.address}.`,
        recipient: {
          userId: booking.userId,
          email: user?.email ?? null,
          pushSubs: [],
        },
      });
      store.bookings.set(booking.id, { ...booking, reminder30Sent: true });
      sent30++;
    }
  }

  return NextResponse.json({ ok: true, sent90, sent30 });
}
