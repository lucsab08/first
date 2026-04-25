/**
 * In-memory store used when DATABASE_URL is missing.
 * Mirrors the shape the routers expect from Drizzle. Backed by fixtures.ts.
 */

import { addDays, isAfter, isBefore, isSameDay, startOfDay } from "date-fns";
import {
  CLASSES,
  INSTRUCTORS,
  LOCATIONS,
  SOFIA_PREFERENCES,
  SOFIA_PROFILE,
  SOFIA_USER_ID,
  STUDIOS,
  buildReviews,
  buildSessions,
  buildSofiaBookings,
  buildSofiaFavorites,
  getWeekStart,
  type FixtureClass,
  type FixtureInstructor,
  type FixtureLocation,
  type FixtureReview,
  type FixtureSession,
  type FixtureStudio,
} from "./fixtures";

type StoreBooking = {
  id: string;
  userId: string;
  sessionId: string;
  status: "confirmed" | "waitlisted" | "cancelled" | "completed" | "no_show";
  bookedAt: Date;
  cancelledAt: Date | null;
  paymentIntentId: string | null;
  reminder90Sent: boolean;
  reminder30Sent: boolean;
};

type StoreFavorite = {
  userId: string;
  studioId: string;
  createdAt: Date;
};

type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing"
  | "expired"
  | "in_grace_period"
  | "in_billing_retry"
  | "revoked"
  | null;

type StoreSubscription = {
  userId: string;
  tier: "free" | "plus";
  status: SubscriptionStatus;
  // Stripe (web SyncFit+ flow)
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodEnd: Date | null;
  // Apple StoreKit (mobile SyncFit+ flow) — v4.1 §8.1
  appleOriginalTransactionId: string | null;
  appleProductId: string | null;
  expiresAt: Date | null;
  autoRenewStatus: boolean | null;
  environment: "Sandbox" | "Production" | null;
  lastVerifiedAt: Date | null;
};

type StoreUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  homeNeighborhood: string | null;
  workNeighborhood: string | null;
  onboardedAt: Date | null;
  createdAt: Date;
};

type StorePreferences = {
  userId: string;
  goals: string[];
  workoutTypes: string[];
  neighborhoods: string[];
  experienceLevel: "new" | "intermediate" | "advanced";
  weeklyGoal: number;
  unavailableStart: string;
  unavailableEnd: string;
  unavailableDays: number[];
  injuries: string | null;
};

type StoreCoachMessage = {
  id: string;
  conversationId: string;
  userId: string;
  role: "user" | "assistant" | "tool";
  content: unknown;
  createdAt: Date;
};

type StoreCoachConversation = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type StoreCoachPlan = {
  id: string;
  userId: string;
  conversationId: string;
  weekStart: string;
  proposedSessions: { session_id: string; reason: string; status: "pending" | "booked" | "skipped" }[];
  acceptedAt: Date | null;
  createdAt: Date;
};

type Store = {
  users: Map<string, StoreUser>;
  preferences: Map<string, StorePreferences>;
  sessions: Map<string, FixtureSession>;
  bookings: Map<string, StoreBooking>;
  favorites: StoreFavorite[];
  reviews: FixtureReview[];
  subscriptions: Map<string, StoreSubscription>;
  coachMessages: StoreCoachMessage[];
  coachConversations: Map<string, StoreCoachConversation>;
  coachPlans: Map<string, StoreCoachPlan>;
  weekStart: Date;
};

declare global {
  // eslint-disable-next-line no-var
  var __syncfit_mock_store: Store | undefined;
}

let store: Store | null = globalThis.__syncfit_mock_store ?? null;

function buildStore(): Store {
  const weekStart = getWeekStart();
  const sessions = new Map<string, FixtureSession>();
  for (const s of buildSessions(weekStart)) sessions.set(s.id, s);

  const users = new Map<string, StoreUser>();
  users.set(SOFIA_PROFILE.id, {
    ...SOFIA_PROFILE,
    onboardedAt: addDays(new Date(), -30),
    createdAt: addDays(new Date(), -60),
  });

  const preferences = new Map<string, StorePreferences>();
  preferences.set(SOFIA_USER_ID, { ...SOFIA_PREFERENCES });

  const bookings = new Map<string, StoreBooking>();
  for (const b of buildSofiaBookings(weekStart)) {
    bookings.set(b.id, {
      ...b,
      cancelledAt: null,
      paymentIntentId: null,
      reminder90Sent: false,
      reminder30Sent: false,
    });
  }

  const subscriptions = new Map<string, StoreSubscription>();
  subscriptions.set(SOFIA_USER_ID, {
    userId: SOFIA_USER_ID,
    tier: "free",
    status: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    appleOriginalTransactionId: null,
    appleProductId: null,
    expiresAt: null,
    autoRenewStatus: null,
    environment: null,
    lastVerifiedAt: null,
  });

  return {
    users,
    preferences,
    sessions,
    bookings,
    favorites: buildSofiaFavorites().map((f) => ({ ...f, createdAt: addDays(new Date(), -20) })),
    reviews: buildReviews(),
    subscriptions,
    coachMessages: [],
    coachConversations: new Map(),
    coachPlans: new Map(),
    weekStart,
  };
}

export function getStore(): Store {
  if (!store) {
    store = buildStore();
    if (process.env.NODE_ENV !== "production") {
      globalThis.__syncfit_mock_store = store;
    }
  }
  return store;
}

/**
 * Dev-only: create or return a fresh non-onboarded user keyed by email.
 * Used by /api/dev/signup when Supabase isn't configured.
 */
export function upsertDevUserByEmail(email: string, fullName: string | null): StoreUser {
  const s = getStore();
  const existing = Array.from(s.users.values()).find((u) => u.email === email);
  if (existing) return existing;

  const id = `dev-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
  const user: StoreUser = {
    id,
    email,
    fullName,
    phone: null,
    avatarUrl: null,
    homeNeighborhood: null,
    workNeighborhood: null,
    onboardedAt: null,
    createdAt: new Date(),
  };
  s.users.set(id, user);
  s.subscriptions.set(id, {
    userId: id,
    tier: "free",
    status: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
  });
  return user;
}

// ─── Queries ─────────────────────────────────────────────────────────────

export function listStudios(filter?: { neighborhood?: string; type?: string; limit?: number }): FixtureStudio[] {
  const s = getStore();
  let studios = STUDIOS;
  if (filter?.neighborhood) {
    const neighborhoodStudios = new Set(
      LOCATIONS.filter((l) => l.neighborhood === filter.neighborhood).map((l) => l.studioId),
    );
    studios = studios.filter((st) => neighborhoodStudios.has(st.id));
  }
  if (filter?.type) {
    const typeStudios = new Set(CLASSES.filter((c) => c.type === filter.type).map((c) => c.studioId));
    studios = studios.filter((st) => typeStudios.has(st.id));
  }
  void s;
  return studios.slice(0, filter?.limit ?? 100);
}

export function getStudioBySlug(slug: string): FixtureStudio | null {
  return STUDIOS.find((s) => s.slug === slug) ?? null;
}

export function getStudioById(id: string): FixtureStudio | null {
  return STUDIOS.find((s) => s.id === id) ?? null;
}

export function getLocationsForStudio(studioId: string): FixtureLocation[] {
  return LOCATIONS.filter((l) => l.studioId === studioId);
}

export function getInstructorsForStudio(studioId: string): FixtureInstructor[] {
  return INSTRUCTORS.filter((i) => i.studioId === studioId);
}

export function getClassesForStudio(studioId: string): FixtureClass[] {
  return CLASSES.filter((c) => c.studioId === studioId);
}

export function getReviewsForStudio(studioId: string): FixtureReview[] {
  return getStore().reviews.filter((r) => r.studioId === studioId);
}

export function allSessions(): FixtureSession[] {
  return Array.from(getStore().sessions.values());
}

export function getSessionById(id: string): FixtureSession | null {
  return getStore().sessions.get(id) ?? null;
}

export function getUpcomingSessionsForStudio(studioId: string, limit = 20): FixtureSession[] {
  const now = new Date();
  const classIds = new Set(CLASSES.filter((c) => c.studioId === studioId).map((c) => c.id));
  return allSessions()
    .filter((s) => classIds.has(s.classId) && isAfter(s.startTime, now))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, limit);
}

export function getSessionsOnDate(date: Date, studioId?: string): FixtureSession[] {
  const classIds = studioId ? new Set(CLASSES.filter((c) => c.studioId === studioId).map((c) => c.id)) : null;
  return allSessions()
    .filter((s) => isSameDay(s.startTime, date) && (!classIds || classIds.has(s.classId)))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

export function getTrendingSessions(limit = 10): FixtureSession[] {
  // Trending = high intensity, over 50% booked, soonest first
  const now = new Date();
  return allSessions()
    .filter((s) => isAfter(s.startTime, now) && s.spotsBooked / s.capacity > 0.5)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
    .slice(0, limit);
}

// ─── User / prefs / subs ─────────────────────────────────────────────────

export function getUser(id: string): StoreUser | null {
  return getStore().users.get(id) ?? null;
}

export function getPreferences(userId: string): StorePreferences | null {
  return getStore().preferences.get(userId) ?? null;
}

export function upsertPreferences(userId: string, prefs: Partial<StorePreferences>): StorePreferences {
  const s = getStore();
  const existing = s.preferences.get(userId) ?? {
    userId,
    goals: [],
    workoutTypes: [],
    neighborhoods: [],
    experienceLevel: "new" as const,
    weeklyGoal: 4,
    unavailableStart: "09:00",
    unavailableEnd: "18:00",
    unavailableDays: [1, 2, 3, 4, 5],
    injuries: null,
  };
  const next: StorePreferences = { ...existing, ...prefs, userId };
  s.preferences.set(userId, next);
  return next;
}

export function markOnboarded(userId: string) {
  const s = getStore();
  const u = s.users.get(userId);
  if (u) s.users.set(userId, { ...u, onboardedAt: new Date() });
}

export function getSubscription(userId: string): StoreSubscription {
  const s = getStore();
  return (
    s.subscriptions.get(userId) ?? {
      userId,
      tier: "free",
      status: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      appleOriginalTransactionId: null,
      appleProductId: null,
      expiresAt: null,
      autoRenewStatus: null,
      environment: null,
      lastVerifiedAt: null,
    }
  );
}

export function setSubscription(userId: string, patch: Partial<StoreSubscription>) {
  const s = getStore();
  const existing = getSubscription(userId);
  s.subscriptions.set(userId, { ...existing, ...patch, userId });
}

/**
 * Update a subscription identified by Apple's originalTransactionId.
 * Used by /api/storekit/notifications when Apple pushes lifecycle events.
 */
export function setSubscriptionByAppleOriginalId(
  appleOriginalTransactionId: string,
  patch: Partial<StoreSubscription>,
): boolean {
  const s = getStore();
  for (const [userId, sub] of s.subscriptions) {
    if (sub.appleOriginalTransactionId === appleOriginalTransactionId) {
      s.subscriptions.set(userId, { ...sub, ...patch, userId });
      return true;
    }
  }
  return false;
}

// ─── Bookings ───────────────────────────────────────────────────────────

export function listBookingsForUser(userId: string): StoreBooking[] {
  return Array.from(getStore().bookings.values())
    .filter((b) => b.userId === userId && b.status !== "cancelled")
    .sort((a, b) => a.bookedAt.getTime() - b.bookedAt.getTime());
}

export function upcomingBookingsForUser(userId: string): StoreBooking[] {
  const now = new Date();
  return listBookingsForUser(userId)
    .filter((b) => {
      const s = getSessionById(b.sessionId);
      return s && isAfter(s.endTime, now);
    })
    .sort((a, b) => {
      const sa = getSessionById(a.sessionId)!;
      const sb = getSessionById(b.sessionId)!;
      return sa.startTime.getTime() - sb.startTime.getTime();
    });
}

export function createBooking(userId: string, sessionId: string): StoreBooking {
  const s = getStore();
  const id = `b-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const session = getSessionById(sessionId);
  if (!session) throw new Error("Session not found");
  const full = session.spotsBooked >= session.capacity;
  const booking: StoreBooking = {
    id,
    userId,
    sessionId,
    status: full ? "waitlisted" : "confirmed",
    bookedAt: new Date(),
    cancelledAt: null,
    paymentIntentId: null,
    reminder90Sent: false,
    reminder30Sent: false,
  };
  s.bookings.set(id, booking);
  if (!full) {
    s.sessions.set(sessionId, { ...session, spotsBooked: session.spotsBooked + 1 });
  } else {
    s.sessions.set(sessionId, { ...session, waitlistCount: session.waitlistCount + 1 });
  }
  return booking;
}

export function cancelBooking(userId: string, bookingId: string) {
  const s = getStore();
  const b = s.bookings.get(bookingId);
  if (!b || b.userId !== userId) throw new Error("Booking not found");
  s.bookings.set(bookingId, { ...b, status: "cancelled", cancelledAt: new Date() });
  const session = getSessionById(b.sessionId);
  if (session) {
    s.sessions.set(b.sessionId, { ...session, spotsBooked: Math.max(0, session.spotsBooked - 1) });
  }
}

// ─── Favorites ──────────────────────────────────────────────────────────

export function listFavoritesForUser(userId: string): FixtureStudio[] {
  const ids = new Set(getStore().favorites.filter((f) => f.userId === userId).map((f) => f.studioId));
  return STUDIOS.filter((s) => ids.has(s.id));
}

export function toggleFavorite(userId: string, studioId: string, add: boolean) {
  const s = getStore();
  if (add) {
    if (!s.favorites.some((f) => f.userId === userId && f.studioId === studioId)) {
      s.favorites.push({ userId, studioId, createdAt: new Date() });
    }
  } else {
    s.favorites = s.favorites.filter((f) => !(f.userId === userId && f.studioId === studioId));
  }
}

// ─── Conflict detection (§8.7) ──────────────────────────────────────────

const TRAVEL_BUFFER_MS = 30 * 60 * 1000;

export function sessionOverlap(
  aStart: Date,
  aEnd: Date,
  aNeighborhood: string,
  bStart: Date,
  bEnd: Date,
  bNeighborhood: string,
): boolean {
  const sameNeighborhood = aNeighborhood === bNeighborhood;
  const buffer = sameNeighborhood ? 0 : TRAVEL_BUFFER_MS;
  return aStart.getTime() - buffer < bEnd.getTime() && bStart.getTime() - buffer < aEnd.getTime();
}

export function locationForSession(sessionId: string): FixtureLocation | null {
  const s = getSessionById(sessionId);
  if (!s) return null;
  return LOCATIONS.find((l) => l.id === s.locationId) ?? null;
}

export function findConflicts(userId: string, sessionId: string): StoreBooking[] {
  const session = getSessionById(sessionId);
  if (!session) return [];
  const loc = locationForSession(sessionId);
  if (!loc) return [];
  const upcoming = upcomingBookingsForUser(userId);
  const conflicts: StoreBooking[] = [];
  for (const b of upcoming) {
    const s2 = getSessionById(b.sessionId);
    if (!s2) continue;
    const loc2 = locationForSession(b.sessionId);
    if (!loc2) continue;
    if (s2.id === session.id) continue;
    if (
      sessionOverlap(
        session.startTime,
        session.endTime,
        loc.neighborhood,
        s2.startTime,
        s2.endTime,
        loc2.neighborhood,
      )
    ) {
      conflicts.push(b);
    }
  }
  return conflicts;
}

// ─── Recommendation ranking (§8.6) ──────────────────────────────────────

export function rankedRecommendations(userId: string, limit = 5): FixtureSession[] {
  const prefs = getPreferences(userId);
  const user = getUser(userId);
  const favorites = new Set(getStore().favorites.filter((f) => f.userId === userId).map((f) => f.studioId));
  const now = new Date();
  const upcoming = upcomingBookingsForUser(userId).map((b) => b.sessionId);

  type Scored = { s: FixtureSession; score: number };

  const scored: Scored[] = allSessions()
    .filter((s) => isAfter(s.startTime, now))
    .map((s) => {
      const c = CLASSES.find((x) => x.id === s.classId)!;
      const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
      let score = 0;
      if (prefs?.workoutTypes.includes(c.type)) score += 10;
      if (prefs?.neighborhoods.includes(loc.neighborhood)) score += 8;
      const startHour = s.startTime.getHours();
      const startMin = s.startTime.getMinutes();
      const day = s.startTime.getDay();
      const inUnavail =
        (prefs?.unavailableDays ?? []).includes(day) &&
        startHour * 60 + startMin >= hourStringToMinutes(prefs?.unavailableStart ?? "09:00") &&
        startHour * 60 + startMin < hourStringToMinutes(prefs?.unavailableEnd ?? "18:00");
      if (!inUnavail) score += 5;
      if (c.beginnerFriendly && prefs?.experienceLevel === "new") score += 3;
      if (favorites.has(c.studioId)) score += 3;
      if (upcoming.includes(s.id)) score -= 10;
      if (s.startTime.getTime() - now.getTime() < 3 * 60 * 60 * 1000) score -= 5;
      // Tie break: home neighborhood proximity
      if (user?.homeNeighborhood && loc.neighborhood === user.homeNeighborhood) score += 0.1;
      return { s, score };
    });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

function hourStringToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  return (h ?? 0) * 60 + (m ?? 0);
}

// ─── Balance analysis for Calendar Day view (§9.4) ───────────────────────

export function weekBalance(userId: string, weekStart: Date = getStore().weekStart) {
  const weekEnd = addDays(weekStart, 7);
  const bookings = listBookingsForUser(userId).filter((b) => {
    const s = getSessionById(b.sessionId);
    return s && isAfter(s.startTime, weekStart) && isBefore(s.startTime, weekEnd);
  });
  let strength = 0;
  let cardio = 0;
  let recovery = 0;
  for (const b of bookings) {
    const s = getSessionById(b.sessionId);
    if (!s) continue;
    const c = CLASSES.find((x) => x.id === s.classId);
    if (!c) continue;
    if (c.type === "strength" || c.type === "pilates") strength++;
    else if (c.type === "hiit" || c.type === "boxing" || c.type === "cycling" || c.type === "run") cardio++;
    else if (c.type === "yoga" || c.type === "other") recovery++;
  }
  let suggestion = "";
  if (recovery === 0 && strength + cardio >= 3) {
    suggestion = "consider yoga later this week";
  } else if (cardio > strength * 2) {
    suggestion = "add a strength block";
  } else if (strength > cardio * 2) {
    suggestion = "mix in some cardio";
  } else {
    suggestion = "balance is solid";
  }
  return { strength, cardio, recovery, suggestion };
}

// ─── User stats (§8.3 user.stats) ───────────────────────────────────────

export function userStats(userId: string) {
  const all = listBookingsForUser(userId);
  const completed = all.filter((b) => b.status === "completed");
  const studiosTried = new Set<string>();
  for (const b of completed) {
    const s = getSessionById(b.sessionId);
    if (!s) continue;
    const c = CLASSES.find((x) => x.id === s.classId);
    if (!c) continue;
    studiosTried.add(c.studioId);
  }
  // Streak = consecutive weeks with ≥1 completed booking, counting back from this week
  let streak = 0;
  let weekCursor = startOfDay(getStore().weekStart);
  while (true) {
    const weekEnd = addDays(weekCursor, 7);
    const hasCompleted = completed.some((b) => {
      const s = getSessionById(b.sessionId);
      return s && isAfter(s.startTime, weekCursor) && isBefore(s.startTime, weekEnd);
    });
    const hasUpcoming =
      weekCursor.getTime() >= startOfDay(getStore().weekStart).getTime() &&
      listBookingsForUser(userId).some((b) => {
        const s = getSessionById(b.sessionId);
        return s && isAfter(s.startTime, weekCursor) && isBefore(s.startTime, weekEnd);
      });
    if (hasCompleted || (streak === 0 && hasUpcoming)) {
      streak++;
      weekCursor = addDays(weekCursor, -7);
      if (streak > 20) break;
    } else break;
  }
  return {
    totalClasses: completed.length,
    studiosTried: studiosTried.size,
    currentStreak: streak,
  };
}

// ─── Coach storage ──────────────────────────────────────────────────────

export function countCoachMessagesForUser(userId: string, role?: "user"): number {
  const msgs = getStore().coachMessages.filter((m) => m.userId === userId && (!role || m.role === role));
  return msgs.length;
}

export function addCoachMessage(m: Omit<StoreCoachMessage, "id" | "createdAt">): StoreCoachMessage {
  const store = getStore();
  const full: StoreCoachMessage = {
    id: `cm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date(),
    ...m,
  };
  store.coachMessages.push(full);
  return full;
}

export function getOrCreateConversation(userId: string, conversationId?: string): StoreCoachConversation {
  const s = getStore();
  if (conversationId) {
    const existing = s.coachConversations.get(conversationId);
    if (existing) return existing;
  }
  const id = conversationId ?? `cv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const convo: StoreCoachConversation = {
    id,
    userId,
    title: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  s.coachConversations.set(id, convo);
  return convo;
}

export function listConversations(userId: string): StoreCoachConversation[] {
  return Array.from(getStore().coachConversations.values())
    .filter((c) => c.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function getConversationMessages(conversationId: string): StoreCoachMessage[] {
  return getStore()
    .coachMessages.filter((m) => m.conversationId === conversationId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}
