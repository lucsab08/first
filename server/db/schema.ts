import {
  boolean,
  date,
  decimal,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  time,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────

export const experienceLevelEnum = pgEnum("experience_level", [
  "new",
  "intermediate",
  "advanced",
]);

export const workoutTypeEnum = pgEnum("workout_type", [
  "pilates",
  "boxing",
  "yoga",
  "hiit",
  "strength",
  "bootcamp",
  "cycling",
  "run",
  "other",
]);

export const intensityEnum = pgEnum("intensity", ["low", "medium", "high"]);

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled",
  "cancelled",
  "completed",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "confirmed",
  "waitlisted",
  "cancelled",
  "completed",
  "no_show",
]);

export const coachRoleEnum = pgEnum("coach_role", ["user", "assistant", "tool"]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "plus",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "past_due",
  "canceled",
  "trialing",
  // Apple StoreKit lifecycle states (v4.1 patch §8.1)
  "expired",
  "in_grace_period",
  "in_billing_retry",
  "revoked",
]);

export const appleEnvironmentEnum = pgEnum("apple_environment", ["Sandbox", "Production"]);

// ─── Users & Preferences ─────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  homeNeighborhood: text("home_neighborhood"),
  workNeighborhood: text("work_neighborhood"),
  icalToken: uuid("ical_token").defaultRandom().notNull().unique(),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goals: text("goals").array().notNull().default(sql`'{}'::text[]`),
  workoutTypes: text("workout_types").array().notNull().default(sql`'{}'::text[]`),
  neighborhoods: text("neighborhoods").array().notNull().default(sql`'{}'::text[]`),
  experienceLevel: experienceLevelEnum("experience_level").default("new").notNull(),
  weeklyGoal: integer("weekly_goal").default(4).notNull(),
  unavailableStart: time("unavailable_start").default("09:00").notNull(),
  unavailableEnd: time("unavailable_end").default("18:00").notNull(),
  unavailableDays: integer("unavailable_days")
    .array()
    .notNull()
    .default(sql`'{1,2,3,4,5}'::int[]`),
  injuries: text("injuries"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Studios, Locations, Instructors ─────────────────────────────────────

export const studios = pgTable("studios", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  heroImages: text("hero_images").array().notNull().default(sql`'{}'::text[]`),
  priceMinCents: integer("price_min_cents").notNull().default(0),
  priceMaxCents: integer("price_max_cents").notNull().default(0),
  ratingAvg: decimal("rating_avg", { precision: 2, scale: 1 }).notNull().default("0.0"),
  ratingCount: integer("rating_count").notNull().default(0),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const studioLocations = pgTable("studio_locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id, { onDelete: "cascade" }),
  name: text("name"),
  address: text("address").notNull(),
  city: text("city").notNull().default("Miami"),
  neighborhood: text("neighborhood").notNull(),
  lat: decimal("lat", { precision: 9, scale: 6 }),
  lng: decimal("lng", { precision: 9, scale: 6 }),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const instructors = pgTable("instructors", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  specialty: text("specialty"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Classes & Sessions ─────────────────────────────────────────────────

export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: workoutTypeEnum("type").notNull(),
  intensity: intensityEnum("intensity").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  priceCents: integer("price_cents").notNull(),
  beginnerFriendly: boolean("beginner_friendly").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const classSessions = pgTable("class_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => studioLocations.id, { onDelete: "cascade" }),
  instructorId: uuid("instructor_id").references(() => instructors.id, {
    onDelete: "set null",
  }),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  capacity: integer("capacity").notNull(),
  spotsBooked: integer("spots_booked").notNull().default(0),
  waitlistCount: integer("waitlist_count").notNull().default(0),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Bookings & Favorites ───────────────────────────────────────────────

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => classSessions.id, { onDelete: "cascade" }),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    paymentIntentId: text("payment_intent_id"),
    bookedAt: timestamp("booked_at", { withTimezone: true }).defaultNow().notNull(),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    reminder90Sent: boolean("reminder_90_sent").notNull().default(false),
    reminder30Sent: boolean("reminder_30_sent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqUserSession: unique("bookings_user_session_unique").on(t.userId, t.sessionId),
  }),
);

export const favorites = pgTable(
  "favorites",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studioId: uuid("studio_id")
      .notNull()
      .references(() => studios.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.studioId] }),
  }),
);

export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  studioId: uuid("studio_id")
    .notNull()
    .references(() => studios.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Coach ───────────────────────────────────────────────────────────────

export const coachConversations = pgTable("coach_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const coachMessages = pgTable("coach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => coachConversations.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: coachRoleEnum("role").notNull(),
  content: jsonb("content").$type<unknown>().notNull(),
  tokensUsed: integer("tokens_used"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const coachPlans = pgTable("coach_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => coachConversations.id, { onDelete: "cascade" }),
  weekStart: date("week_start").notNull(),
  proposedSessions: jsonb("proposed_sessions")
    .$type<{ session_id: string; reason: string; status: "pending" | "booked" | "skipped" }[]>()
    .notNull(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Subscriptions & Push ────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  status: subscriptionStatusEnum("status"),
  // Stripe — used by web SyncFit+ subscriptions only (mobile uses StoreKit).
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  // Apple StoreKit (v4.1 patch §8.1) — populated by mobile via /api/storekit/verify
  appleOriginalTransactionId: text("apple_original_transaction_id"),
  appleProductId: text("apple_product_id"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  autoRenewStatus: boolean("auto_renew_status"),
  environment: appleEnvironmentEnum("environment"),
  lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh"),
  auth: text("auth"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────

export const studiosRelations = relations(studios, ({ many }) => ({
  locations: many(studioLocations),
  instructors: many(instructors),
  classes: many(classes),
  reviews: many(reviews),
}));

export const studioLocationsRelations = relations(studioLocations, ({ one, many }) => ({
  studio: one(studios, {
    fields: [studioLocations.studioId],
    references: [studios.id],
  }),
  sessions: many(classSessions),
}));

export const instructorsRelations = relations(instructors, ({ one, many }) => ({
  studio: one(studios, {
    fields: [instructors.studioId],
    references: [studios.id],
  }),
  sessions: many(classSessions),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  studio: one(studios, {
    fields: [classes.studioId],
    references: [studios.id],
  }),
  sessions: many(classSessions),
}));

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  class: one(classes, {
    fields: [classSessions.classId],
    references: [classes.id],
  }),
  location: one(studioLocations, {
    fields: [classSessions.locationId],
    references: [studioLocations.id],
  }),
  instructor: one(instructors, {
    fields: [classSessions.instructorId],
    references: [instructors.id],
  }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  session: one(classSessions, {
    fields: [bookings.sessionId],
    references: [classSessions.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  bookings: many(bookings),
  favorites: many(favorites),
  reviews: many(reviews),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.userId],
  }),
}));

// ─── Types ───────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type Studio = typeof studios.$inferSelect;
export type StudioLocation = typeof studioLocations.$inferSelect;
export type Instructor = typeof instructors.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type ClassSession = typeof classSessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type CoachConversation = typeof coachConversations.$inferSelect;
export type CoachMessage = typeof coachMessages.$inferSelect;
export type CoachPlan = typeof coachPlans.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
