#!/usr/bin/env tsx
/**
 * Seeds the real Postgres DB with fixtures from fixtures.ts.
 * Run with: npm run db:seed
 */

import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import {
  CLASSES,
  INSTRUCTORS,
  LOCATIONS,
  SOFIA_PREFERENCES,
  SOFIA_PROFILE,
  STUDIOS,
  buildReviews,
  buildSessions,
  buildSofiaBookings,
  buildSofiaFavorites,
  REVIEWER_USER_IDS,
} from "./fixtures";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set.");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql, { schema, casing: "snake_case" });

  console.log("→ Truncating and re-seeding…");

  // Wipe in FK-safe order
  await sql`truncate table
    push_subscriptions, subscriptions, coach_plans, coach_messages, coach_conversations,
    reviews, favorites, bookings, class_sessions, classes, instructors, studio_locations, studios,
    user_preferences, users
    restart identity cascade`;

  // Studios
  await db.insert(schema.studios).values(
    STUDIOS.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      description: s.description,
      coverImageUrl: s.coverImageUrl,
      heroImages: s.heroImages,
      priceMinCents: s.priceMinCents,
      priceMaxCents: s.priceMaxCents,
      ratingAvg: s.ratingAvg.toString(),
      ratingCount: s.ratingCount,
      verified: s.verified,
    })),
  );
  console.log(`  ✓ ${STUDIOS.length} studios`);

  await db.insert(schema.studioLocations).values(
    LOCATIONS.map((l) => ({
      id: l.id,
      studioId: l.studioId,
      name: l.name,
      address: l.address,
      neighborhood: l.neighborhood,
      lat: l.lat.toString(),
      lng: l.lng.toString(),
      phone: l.phone,
    })),
  );
  console.log(`  ✓ ${LOCATIONS.length} locations`);

  await db.insert(schema.instructors).values(
    INSTRUCTORS.map((i) => ({
      id: i.id,
      studioId: i.studioId,
      name: i.name,
      specialty: i.specialty,
      bio: i.bio,
      avatarUrl: i.avatarUrl,
    })),
  );
  console.log(`  ✓ ${INSTRUCTORS.length} instructors`);

  await db.insert(schema.classes).values(
    CLASSES.map((c) => ({
      id: c.id,
      studioId: c.studioId,
      name: c.name,
      description: c.description,
      type: c.type,
      intensity: c.intensity,
      durationMinutes: c.durationMinutes,
      priceCents: c.priceCents,
      beginnerFriendly: c.beginnerFriendly,
    })),
  );
  console.log(`  ✓ ${CLASSES.length} classes`);

  const sessions = buildSessions();
  await db.insert(schema.classSessions).values(
    sessions.map((s) => ({
      id: s.id,
      classId: s.classId,
      locationId: s.locationId,
      instructorId: s.instructorId,
      startTime: s.startTime,
      endTime: s.endTime,
      capacity: s.capacity,
      spotsBooked: s.spotsBooked,
      waitlistCount: s.waitlistCount,
    })),
  );
  console.log(`  ✓ ${sessions.length} sessions`);

  // Users: Sofia + 3 reviewer ghosts
  await db.insert(schema.users).values([
    {
      id: SOFIA_PROFILE.id,
      email: SOFIA_PROFILE.email,
      fullName: SOFIA_PROFILE.fullName,
      phone: null,
      avatarUrl: SOFIA_PROFILE.avatarUrl,
      homeNeighborhood: SOFIA_PROFILE.homeNeighborhood,
      workNeighborhood: SOFIA_PROFILE.workNeighborhood,
      onboardedAt: new Date(),
    },
    ...REVIEWER_USER_IDS.map((id, i) => ({
      id,
      email: `reviewer${i + 1}@syncfit.test`,
      fullName: ["Lauren Kim", "Marco Lopez", "Pri Shah"][i] ?? `Reviewer ${i + 1}`,
      onboardedAt: new Date(),
    })),
  ]);
  console.log(`  ✓ ${1 + REVIEWER_USER_IDS.length} users`);

  await db.insert(schema.userPreferences).values([
    {
      userId: SOFIA_PREFERENCES.userId,
      goals: SOFIA_PREFERENCES.goals,
      workoutTypes: SOFIA_PREFERENCES.workoutTypes,
      neighborhoods: SOFIA_PREFERENCES.neighborhoods,
      experienceLevel: SOFIA_PREFERENCES.experienceLevel,
      weeklyGoal: SOFIA_PREFERENCES.weeklyGoal,
      unavailableStart: SOFIA_PREFERENCES.unavailableStart,
      unavailableEnd: SOFIA_PREFERENCES.unavailableEnd,
      unavailableDays: SOFIA_PREFERENCES.unavailableDays,
      injuries: SOFIA_PREFERENCES.injuries,
    },
  ]);
  console.log("  ✓ Sofia preferences");

  // Bookings
  const bookings = buildSofiaBookings();
  await db.insert(schema.bookings).values(
    bookings.map((b) => ({
      id: b.id,
      userId: b.userId,
      sessionId: b.sessionId,
      status: b.status,
      bookedAt: b.bookedAt,
    })),
  );
  console.log(`  ✓ ${bookings.length} bookings`);

  // Favorites
  const favs = buildSofiaFavorites();
  await db.insert(schema.favorites).values(favs);
  console.log(`  ✓ ${favs.length} favorites`);

  // Reviews
  const reviews = buildReviews();
  await db.insert(schema.reviews).values(
    reviews.map((r) => ({
      id: r.id,
      userId: r.userId,
      studioId: r.studioId,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  );
  console.log(`  ✓ ${reviews.length} reviews`);

  // Default free subscription for Sofia
  await db.insert(schema.subscriptions).values({
    userId: SOFIA_PROFILE.id,
    tier: "free",
    status: null,
  });
  console.log("  ✓ Sofia subscription (free)");

  await sql.end();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
