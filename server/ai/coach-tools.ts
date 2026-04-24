import { addDays, differenceInDays } from "date-fns";
import {
  allSessions,
  findConflicts,
  getPreferences,
  getSessionById,
  getUser,
  listBookingsForUser,
  locationForSession,
} from "@/server/db/mock";
import { CLASSES, INSTRUCTORS, LOCATIONS, STUDIOS } from "@/server/db/fixtures";

export function runGetUserContext(userId: string) {
  const user = getUser(userId);
  const prefs = getPreferences(userId);
  const bookings = listBookingsForUser(userId);
  const recent = bookings
    .filter((b) => {
      const s = getSessionById(b.sessionId);
      return s && differenceInDays(new Date(), s.startTime) < 14;
    })
    .map((b) => {
      const s = getSessionById(b.sessionId)!;
      const cls = CLASSES.find((c) => c.id === s.classId);
      return {
        booking_id: b.id,
        session_id: s.id,
        class_name: cls?.name,
        type: cls?.type,
        intensity: cls?.intensity,
        start_time: s.startTime.toISOString(),
        status: b.status,
      };
    });

  return {
    user: user ? { home_neighborhood: user.homeNeighborhood, work_neighborhood: user.workNeighborhood } : null,
    preferences: prefs,
    recent_bookings: recent,
  };
}

export function runSearchClasses(input: {
  neighborhoods?: string[];
  types?: string[];
  intensity?: "low" | "medium" | "high";
  days?: string[];
  time_of_day?: string;
  beginner_friendly?: boolean;
  limit?: number;
}) {
  const now = new Date();
  let sessions = allSessions().filter((s) => s.startTime > now);

  if (input.types?.length) {
    const allowed = new Set(input.types);
    sessions = sessions.filter((s) => {
      const cls = CLASSES.find((c) => c.id === s.classId);
      return cls && allowed.has(cls.type);
    });
  }
  if (input.neighborhoods?.length) {
    const allowed = new Set(input.neighborhoods);
    sessions = sessions.filter((s) => {
      const loc = LOCATIONS.find((l) => l.id === s.locationId);
      return loc && allowed.has(loc.neighborhood);
    });
  }
  if (input.intensity) {
    sessions = sessions.filter((s) => {
      const cls = CLASSES.find((c) => c.id === s.classId);
      return cls && cls.intensity === input.intensity;
    });
  }
  if (input.beginner_friendly) {
    sessions = sessions.filter((s) => {
      const cls = CLASSES.find((c) => c.id === s.classId);
      return cls?.beginnerFriendly;
    });
  }
  if (input.days?.length) {
    const days = input.days.map((d) => new Date(d).toDateString());
    sessions = sessions.filter((s) => days.includes(s.startTime.toDateString()));
  }
  if (input.time_of_day) {
    sessions = sessions.filter((s) => {
      const h = s.startTime.getHours();
      const bucket =
        h < 8 ? "early_am" : h < 11 ? "am" : h < 14 ? "midday" : h < 17 ? "pm" : "evening";
      return bucket === input.time_of_day;
    });
  }

  sessions = sessions
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, input.limit ?? 8);

  return sessions.map((s) => {
    const cls = CLASSES.find((c) => c.id === s.classId)!;
    const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
    const inst = INSTRUCTORS.find((i) => i.id === s.instructorId);
    const studio = STUDIOS.find((x) => x.id === cls.studioId)!;
    return {
      session_id: s.id,
      class_name: cls.name,
      studio_name: studio.name,
      studio_slug: studio.slug,
      instructor: inst?.name ?? null,
      neighborhood: loc.neighborhood,
      start_time: s.startTime.toISOString(),
      duration_minutes: cls.durationMinutes,
      type: cls.type,
      intensity: cls.intensity,
      price_cents: cls.priceCents,
      beginner_friendly: cls.beginnerFriendly,
    };
  });
}

export function runCheckConflicts(userId: string, sessionIds: string[]) {
  const results = sessionIds.map((sid) => {
    const conflicts = findConflicts(userId, sid);
    return {
      session_id: sid,
      conflicts: conflicts.map((c) => {
        const session = getSessionById(c.sessionId);
        const loc = session ? locationForSession(session.id) : null;
        return {
          booking_id: c.id,
          session_id: c.sessionId,
          start_time: session?.startTime.toISOString() ?? null,
          neighborhood: loc?.neighborhood ?? null,
        };
      }),
    };
  });
  return { results };
}
