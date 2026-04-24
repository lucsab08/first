/**
 * Seed data — single source of truth for both the mock in-memory store
 * (when DATABASE_URL is missing) and the real-DB seed script.
 * §10 Sample Data.
 */

import { addDays, addMinutes, setHours, setMinutes, startOfWeek } from "date-fns";

export type WorkoutType =
  | "pilates"
  | "boxing"
  | "yoga"
  | "hiit"
  | "strength"
  | "bootcamp"
  | "cycling"
  | "run"
  | "other";

export type Intensity = "low" | "medium" | "high";

export type FixtureStudio = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImageUrl: string;
  heroImages: string[];
  priceMinCents: number;
  priceMaxCents: number;
  ratingAvg: number;
  ratingCount: number;
  verified: boolean;
};

export type FixtureLocation = {
  id: string;
  studioId: string;
  name: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  phone: string;
};

export type FixtureInstructor = {
  id: string;
  studioId: string;
  name: string;
  specialty: string;
  bio: string;
  avatarUrl: string;
};

export type FixtureClass = {
  id: string;
  studioId: string;
  name: string;
  description: string;
  type: WorkoutType;
  intensity: Intensity;
  durationMinutes: number;
  priceCents: number;
  beginnerFriendly: boolean;
};

export type FixtureSession = {
  id: string;
  classId: string;
  locationId: string;
  instructorId: string;
  startTime: Date;
  endTime: Date;
  capacity: number;
  spotsBooked: number;
  waitlistCount: number;
};

export type FixtureReview = {
  id: string;
  userId: string;
  studioId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  reviewerName: string;
};

// ─── Stable UUIDs (hand-assigned for determinism) ────────────────────────

const S = (n: number) => `00000000-0000-0000-0000-${(100 + n).toString().padStart(12, "0")}`;
const L = (n: number) => `00000000-0000-0000-0001-${(100 + n).toString().padStart(12, "0")}`;
const I = (n: number) => `00000000-0000-0000-0002-${(100 + n).toString().padStart(12, "0")}`;
const C = (n: number) => `00000000-0000-0000-0003-${(100 + n).toString().padStart(12, "0")}`;
const SS = (n: number) => `00000000-0000-0000-0004-${(100 + n).toString().padStart(12, "0")}`;
const R = (n: number) => `00000000-0000-0000-0005-${(100 + n).toString().padStart(12, "0")}`;

export const SOFIA_USER_ID = "00000000-0000-0000-0006-000000000001";
export const SOFIA_EMAIL = "sofia@syncfit.test";
export const REVIEWER_USER_IDS = [
  "00000000-0000-0000-0006-000000000010",
  "00000000-0000-0000-0006-000000000011",
  "00000000-0000-0000-0006-000000000012",
];

// ─── Studios ─────────────────────────────────────────────────────────────

const IMG = {
  pilates: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1200&q=80",
  pilates2: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=1200&q=80",
  boxing: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&q=80",
  boxing2: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1200&q=80",
  yoga: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1200&q=80",
  yoga2: "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=1200&q=80",
  hiit: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=1200&q=80",
  hiit2: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&q=80",
  cycling: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80",
  studio: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1200&q=80",
  mobility: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&q=80",
  strength: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1200&q=80",
};

const AVATAR = {
  camila: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
  david: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  isabela: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
  tomas: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
  ana: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80",
  marco: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
  valentina: "https://images.unsplash.com/photo-1542596594-649edbc13630?w=200&q=80",
  carlos: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&q=80",
  sofia: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&q=80",
};

export const STUDIOS: FixtureStudio[] = [
  {
    id: S(1),
    slug: "jetset-pilates",
    name: "Jetset Pilates",
    description:
      "Miami's original megaformer studio. Low-impact, high-intensity Pilates on custom reformers — slow tempo, serious burn.",
    coverImageUrl: IMG.pilates,
    heroImages: [IMG.pilates, IMG.pilates2, IMG.studio],
    priceMinCents: 3600,
    priceMaxCents: 4000,
    ratingAvg: 4.9,
    ratingCount: 842,
    verified: true,
  },
  {
    id: S(2),
    slug: "solidcore",
    name: "[solidcore]",
    description:
      "50-minute full-body megaformer classes designed to take you to failure. Dim red light, tempo music, and no distractions.",
    coverImageUrl: IMG.pilates2,
    heroImages: [IMG.pilates2, IMG.studio, IMG.pilates],
    priceMinCents: 3400,
    priceMaxCents: 3800,
    ratingAvg: 4.8,
    ratingCount: 1203,
    verified: true,
  },
  {
    id: S(3),
    slug: "barrys",
    name: "Barry's",
    description:
      "The Red Room. Treadmill and floor intervals in 50 minutes. Signature strength and conditioning done with surgical playlists.",
    coverImageUrl: IMG.hiit,
    heroImages: [IMG.hiit, IMG.hiit2, IMG.strength],
    priceMinCents: 4000,
    priceMaxCents: 4400,
    ratingAvg: 4.9,
    ratingCount: 2214,
    verified: true,
  },
  {
    id: S(4),
    slug: "anatomy",
    name: "Anatomy",
    description:
      "Miami's elevated club-meets-studio. Yoga, Sculpt, and HIIT under one roof, with concierge-grade everything.",
    coverImageUrl: IMG.studio,
    heroImages: [IMG.studio, IMG.yoga, IMG.hiit2],
    priceMinCents: 3200,
    priceMaxCents: 3600,
    ratingAvg: 4.7,
    ratingCount: 612,
    verified: true,
  },
  {
    id: S(5),
    slug: "legacy-fit",
    name: "Legacy Fit",
    description:
      "Wynwood-born strength and conditioning gym trusted by pros. Team Training drills, athletic programming, heavy on accountability.",
    coverImageUrl: IMG.strength,
    heroImages: [IMG.strength, IMG.hiit, IMG.hiit2],
    priceMinCents: 2800,
    priceMaxCents: 3200,
    ratingAvg: 4.8,
    ratingCount: 538,
    verified: true,
  },
  {
    id: S(6),
    slug: "modo-yoga-miami",
    name: "Modo Yoga Miami",
    description:
      "Hot yoga studio rooted in the Modo pillars — environmentally conscious, community first. Flows at 95°F.",
    coverImageUrl: IMG.yoga,
    heroImages: [IMG.yoga, IMG.yoga2, IMG.mobility],
    priceMinCents: 2600,
    priceMaxCents: 3000,
    ratingAvg: 4.8,
    ratingCount: 921,
    verified: true,
  },
  {
    id: S(7),
    slug: "rumble-boxing",
    name: "Rumble Boxing",
    description:
      "Water-filled teardrop bags, 10-round format, heavy bass. Learn to punch, or punch off the week.",
    coverImageUrl: IMG.boxing,
    heroImages: [IMG.boxing, IMG.boxing2, IMG.strength],
    priceMinCents: 3400,
    priceMaxCents: 3800,
    ratingAvg: 4.7,
    ratingCount: 487,
    verified: true,
  },
  {
    id: S(8),
    slug: "soulcycle",
    name: "SoulCycle",
    description:
      "Candle-lit indoor cycling with a cult following. 45 minutes, one bike, zero boredom.",
    coverImageUrl: IMG.cycling,
    heroImages: [IMG.cycling, IMG.studio],
    priceMinCents: 3400,
    priceMaxCents: 3800,
    ratingAvg: 4.6,
    ratingCount: 704,
    verified: true,
  },
  {
    id: S(9),
    slug: "f45-training",
    name: "F45 Training",
    description:
      "45-minute team training. Every class is different — strength and cardio in a rotating format.",
    coverImageUrl: IMG.hiit2,
    heroImages: [IMG.hiit2, IMG.hiit, IMG.strength],
    priceMinCents: 3000,
    priceMaxCents: 3400,
    ratingAvg: 4.6,
    ratingCount: 389,
    verified: true,
  },
  {
    id: S(10),
    slug: "sweat440",
    name: "Sweat440",
    description:
      "Fast-paced circuit training with a new workout every 10 minutes. Start any time in your hour.",
    coverImageUrl: IMG.hiit,
    heroImages: [IMG.hiit, IMG.strength],
    priceMinCents: 2700,
    priceMaxCents: 3100,
    ratingAvg: 4.5,
    ratingCount: 268,
    verified: true,
  },
  {
    id: S(11),
    slug: "green-monkey-yoga",
    name: "Green Monkey Yoga",
    description:
      "Long-running Miami studio with a range of flow styles. Slow on Sundays, stronger on weekday mornings.",
    coverImageUrl: IMG.yoga2,
    heroImages: [IMG.yoga2, IMG.yoga, IMG.mobility],
    priceMinCents: 2400,
    priceMaxCents: 2800,
    ratingAvg: 4.7,
    ratingCount: 556,
    verified: true,
  },
  {
    id: S(12),
    slug: "third-house",
    name: "Third House",
    description:
      "Pop-up breathwork and mobility collective. Sunrise sessions in Design District courtyards and galleries. Small groups only.",
    coverImageUrl: IMG.mobility,
    heroImages: [IMG.mobility, IMG.yoga, IMG.studio],
    priceMinCents: 4200,
    priceMaxCents: 4800,
    ratingAvg: 4.9,
    ratingCount: 92,
    verified: false,
  },
];

// ─── Locations (multi-location studios get multiple rows) ────────────────

type LocationSeed = {
  studioId: string;
  name: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
};

const LOCATION_SEEDS: LocationSeed[] = [
  // Jetset Pilates — 4 locations
  { studioId: S(1), name: "Brickell", neighborhood: "brickell", address: "1001 Brickell Bay Dr, Miami, FL 33131", lat: 25.7637, lng: -80.1918 },
  { studioId: S(1), name: "Wynwood", neighborhood: "wynwood", address: "2750 NW 3rd Ave, Miami, FL 33127", lat: 25.8000, lng: -80.1990 },
  { studioId: S(1), name: "Coconut Grove", neighborhood: "coconut_grove", address: "3015 Grand Ave, Coconut Grove, FL 33133", lat: 25.7280, lng: -80.2433 },
  { studioId: S(1), name: "South Beach", neighborhood: "south_beach", address: "829 Alton Rd, Miami Beach, FL 33139", lat: 25.7788, lng: -80.1400 },
  // solidcore — 3 locations
  { studioId: S(2), name: "Brickell", neighborhood: "brickell", address: "901 S Miami Ave, Miami, FL 33130", lat: 25.7666, lng: -80.1945 },
  { studioId: S(2), name: "Coconut Grove", neighborhood: "coconut_grove", address: "3200 Commodore Plaza, Coconut Grove, FL 33133", lat: 25.7279, lng: -80.2430 },
  { studioId: S(2), name: "South Beach", neighborhood: "south_beach", address: "1637 Washington Ave, Miami Beach, FL 33139", lat: 25.7887, lng: -80.1321 },
  // Barry's — 2
  { studioId: S(3), name: "Brickell", neighborhood: "brickell", address: "1311 Brickell Ave, Miami, FL 33131", lat: 25.7591, lng: -80.1906 },
  { studioId: S(3), name: "Lincoln Road", neighborhood: "south_beach", address: "920 Lincoln Rd, Miami Beach, FL 33139", lat: 25.7908, lng: -80.1379 },
  // Anatomy — 2
  { studioId: S(4), name: "Midtown", neighborhood: "midtown", address: "3201 Buena Vista Blvd, Miami, FL 33127", lat: 25.8123, lng: -80.1970 },
  { studioId: S(4), name: "South Beach", neighborhood: "south_beach", address: "1220 20th St, Miami Beach, FL 33139", lat: 25.7922, lng: -80.1389 },
  // Legacy Fit — 1
  { studioId: S(5), name: "Wynwood", neighborhood: "wynwood", address: "401 NW 26th St, Miami, FL 33127", lat: 25.8006, lng: -80.1973 },
  // Modo Yoga — 2
  { studioId: S(6), name: "South Beach", neighborhood: "south_beach", address: "1560 Lenox Ave, Miami Beach, FL 33139", lat: 25.7896, lng: -80.1373 },
  { studioId: S(6), name: "Coral Gables", neighborhood: "coral_gables", address: "2222 Ponce de Leon Blvd, Coral Gables, FL 33134", lat: 25.7535, lng: -80.2585 },
  // Rumble — 1
  { studioId: S(7), name: "Brickell", neighborhood: "brickell", address: "1450 Brickell Ave, Miami, FL 33131", lat: 25.7579, lng: -80.1911 },
  // SoulCycle — 1
  { studioId: S(8), name: "Coconut Grove", neighborhood: "coconut_grove", address: "3015 Grand Ave Suite 250, Coconut Grove, FL 33133", lat: 25.7279, lng: -80.2430 },
  // F45 — 3
  { studioId: S(9), name: "Brickell", neighborhood: "brickell", address: "1110 Brickell Ave, Miami, FL 33131", lat: 25.7610, lng: -80.1912 },
  { studioId: S(9), name: "Wynwood", neighborhood: "wynwood", address: "180 NE 29th St, Miami, FL 33137", lat: 25.8040, lng: -80.1930 },
  { studioId: S(9), name: "Coral Gables", neighborhood: "coral_gables", address: "369 Alhambra Cir, Coral Gables, FL 33134", lat: 25.7492, lng: -80.2615 },
  // Sweat440 — 2
  { studioId: S(10), name: "Brickell", neighborhood: "brickell", address: "25 SW 9th St, Miami, FL 33130", lat: 25.7691, lng: -80.1921 },
  { studioId: S(10), name: "Wynwood", neighborhood: "wynwood", address: "2119 NW 1st Ct, Miami, FL 33127", lat: 25.7940, lng: -80.1995 },
  // Green Monkey — 2
  { studioId: S(11), name: "Coral Gables", neighborhood: "coral_gables", address: "1827 Ponce de Leon Blvd, Coral Gables, FL 33134", lat: 25.7503, lng: -80.2589 },
  { studioId: S(11), name: "South Beach", neighborhood: "south_beach", address: "1827 Purdy Ave, Miami Beach, FL 33139", lat: 25.7955, lng: -80.1423 },
  // Third House — 1
  { studioId: S(12), name: "Design District", neighborhood: "design_district", address: "4141 NE 2nd Ave, Miami, FL 33137", lat: 25.8128, lng: -80.1938 },
];

export const LOCATIONS: FixtureLocation[] = LOCATION_SEEDS.map((l, i) => ({
  id: L(i + 1),
  studioId: l.studioId,
  name: l.name,
  address: l.address,
  neighborhood: l.neighborhood,
  lat: l.lat,
  lng: l.lng,
  phone: "(305) 555-0" + (100 + i).toString(),
}));

// ─── Instructors ─────────────────────────────────────────────────────────

type InstructorSeed = {
  studioId: string;
  name: string;
  specialty: string;
  bio: string;
  avatarUrl: string;
};

const INSTRUCTOR_SEEDS: InstructorSeed[] = [
  { studioId: S(1), name: "Camila R.", specialty: "Reformer flow", bio: "Eight years on the reformer. Slow, controlled, honest.", avatarUrl: AVATAR.camila },
  { studioId: S(1), name: "Isabela M.", specialty: "Advanced Pilates", bio: "Former dancer. Plays with tempo.", avatarUrl: AVATAR.isabela },
  { studioId: S(2), name: "David P.", specialty: "Megaformer", bio: "Known for the 'one more count'. You'll find it.", avatarUrl: AVATAR.david },
  { studioId: S(2), name: "Ana S.", specialty: "Full body", bio: "50 minutes, four planes of motion, no shortcuts.", avatarUrl: AVATAR.ana },
  { studioId: S(3), name: "Tomás G.", specialty: "Treadmill + floor", bio: "Marathoner turned Red Room coach. Music is a weapon.", avatarUrl: AVATAR.tomas },
  { studioId: S(3), name: "Marco L.", specialty: "Full body", bio: "Brings the strength side. Loves a back-loaded block.", avatarUrl: AVATAR.marco },
  { studioId: S(4), name: "Valentina P.", specialty: "Sculpt", bio: "Lengthen and strengthen. Pays attention to the little joints.", avatarUrl: AVATAR.valentina },
  { studioId: S(5), name: "Carlos M.", specialty: "Team Training", bio: "Played ball in college. Coaches like it.", avatarUrl: AVATAR.carlos },
  { studioId: S(6), name: "Isabela M.", specialty: "Hot Flow 26", bio: "Breath first, posture second. Heat is the teacher.", avatarUrl: AVATAR.isabela },
  { studioId: S(7), name: "Marco L.", specialty: "Round 1", bio: "Amateur boxer. Teaches form you'll actually keep.", avatarUrl: AVATAR.marco },
  { studioId: S(8), name: "Camila R.", specialty: "Cycling", bio: "Candle-lit hill climbs. Story arcs.", avatarUrl: AVATAR.camila },
  { studioId: S(9), name: "David P.", specialty: "F45", bio: "Programmer-turned-coach. Loves circuit math.", avatarUrl: AVATAR.david },
  { studioId: S(10), name: "Ana S.", specialty: "Circuit", bio: "10-minute stations. No thinking required.", avatarUrl: AVATAR.ana },
  { studioId: S(11), name: "Tomás G.", specialty: "Vinyasa", bio: "Long holds, long exhales. Brings a mat for you.", avatarUrl: AVATAR.tomas },
  { studioId: S(12), name: "Valentina P.", specialty: "Breathwork", bio: "Sunrise specialist. Leaves you 6% calmer, measured.", avatarUrl: AVATAR.valentina },
];

export const INSTRUCTORS: FixtureInstructor[] = INSTRUCTOR_SEEDS.map((x, i) => ({
  id: I(i + 1),
  ...x,
}));

// ─── Classes ─────────────────────────────────────────────────────────────

type ClassSeed = Omit<FixtureClass, "id">;

const CLASS_SEEDS: ClassSeed[] = [
  { studioId: S(1), name: "Reformer Flow", description: "Classic reformer choreography. Steady tempo, 50 min.", type: "pilates", intensity: "medium", durationMinutes: 50, priceCents: 3800, beginnerFriendly: false },
  { studioId: S(1), name: "Beginner Reformer", description: "Intro to the megaformer. Slower pace, more cues.", type: "pilates", intensity: "low", durationMinutes: 50, priceCents: 3600, beginnerFriendly: true },
  { studioId: S(2), name: "Full 50", description: "Full-body megaformer to failure.", type: "pilates", intensity: "high", durationMinutes: 50, priceCents: 3800, beginnerFriendly: false },
  { studioId: S(2), name: "Foundations", description: "solidcore 101.", type: "pilates", intensity: "medium", durationMinutes: 50, priceCents: 3400, beginnerFriendly: true },
  { studioId: S(3), name: "Full Body", description: "The Red Room signature: half treadmill, half floor.", type: "hiit", intensity: "high", durationMinutes: 50, priceCents: 4200, beginnerFriendly: false },
  { studioId: S(3), name: "Arms + Abs", description: "Strength focus, no treadmill.", type: "strength", intensity: "high", durationMinutes: 50, priceCents: 4200, beginnerFriendly: false },
  { studioId: S(4), name: "Sculpt", description: "Pilates-meets-barre sculpt. Medium pace.", type: "pilates", intensity: "medium", durationMinutes: 45, priceCents: 3400, beginnerFriendly: true },
  { studioId: S(4), name: "Power Vinyasa", description: "Heated flow.", type: "yoga", intensity: "medium", durationMinutes: 60, priceCents: 3200, beginnerFriendly: false },
  { studioId: S(4), name: "Team Training", description: "Interval conditioning with a coach on the mic.", type: "hiit", intensity: "high", durationMinutes: 50, priceCents: 3600, beginnerFriendly: false },
  { studioId: S(5), name: "Team Training", description: "Strength + conditioning. Programmed weekly.", type: "hiit", intensity: "high", durationMinutes: 60, priceCents: 3200, beginnerFriendly: false },
  { studioId: S(5), name: "Sunday Sculpt", description: "Recovery-adjacent strength. Warm-up heavy.", type: "strength", intensity: "medium", durationMinutes: 60, priceCents: 2800, beginnerFriendly: true },
  { studioId: S(6), name: "Hot Flow 26", description: "26 postures, 90 minutes, heat.", type: "yoga", intensity: "medium", durationMinutes: 90, priceCents: 3000, beginnerFriendly: false },
  { studioId: S(6), name: "Modo Flow", description: "Slower heated flow. 75 min.", type: "yoga", intensity: "low", durationMinutes: 75, priceCents: 2800, beginnerFriendly: true },
  { studioId: S(7), name: "Round 1", description: "Punch the bag. Tempo intervals.", type: "boxing", intensity: "high", durationMinutes: 45, priceCents: 3800, beginnerFriendly: true },
  { studioId: S(7), name: "Knockout", description: "Advanced combos. No corners.", type: "boxing", intensity: "high", durationMinutes: 45, priceCents: 3800, beginnerFriendly: false },
  { studioId: S(8), name: "Signature Ride", description: "45-minute candle-lit cycling.", type: "cycling", intensity: "high", durationMinutes: 45, priceCents: 3800, beginnerFriendly: false },
  { studioId: S(9), name: "F45", description: "Circuit team training. 27 stations.", type: "hiit", intensity: "high", durationMinutes: 45, priceCents: 3400, beginnerFriendly: false },
  { studioId: S(10), name: "Circuit 440", description: "Four 10-min stations. Start on the 10s.", type: "hiit", intensity: "medium", durationMinutes: 40, priceCents: 3100, beginnerFriendly: true },
  { studioId: S(11), name: "Sunrise Vinyasa", description: "Gentle morning flow.", type: "yoga", intensity: "low", durationMinutes: 60, priceCents: 2600, beginnerFriendly: true },
  { studioId: S(11), name: "Sculpt Flow", description: "Flow with light weights.", type: "yoga", intensity: "medium", durationMinutes: 60, priceCents: 2800, beginnerFriendly: false },
  { studioId: S(12), name: "Sunrise Breathwork Pop-up", description: "45 minutes of guided breathwork at sunrise. Outdoor.", type: "other", intensity: "low", durationMinutes: 45, priceCents: 4800, beginnerFriendly: true },
  { studioId: S(12), name: "Mobility Lab", description: "45 minutes of joint-by-joint mobility.", type: "other", intensity: "low", durationMinutes: 45, priceCents: 4200, beginnerFriendly: true },
];

export const CLASSES: FixtureClass[] = CLASS_SEEDS.map((x, i) => ({
  id: C(i + 1),
  ...x,
}));

// ─── Reviews ─────────────────────────────────────────────────────────────

const REVIEW_SEEDS: Array<Omit<FixtureReview, "id" | "createdAt"> & { daysAgo: number }> = [
  { userId: REVIEWER_USER_IDS[0]!, studioId: S(1), rating: 5, comment: "The best reformer class in Miami, hands down. Camila is a surgeon.", reviewerName: "Lauren K.", daysAgo: 3 },
  { userId: REVIEWER_USER_IDS[1]!, studioId: S(1), rating: 5, comment: "I drive from Coral Gables just for the 6:30am. Worth it every time.", reviewerName: "Marco L.", daysAgo: 9 },
  { userId: REVIEWER_USER_IDS[2]!, studioId: S(1), rating: 4, comment: "Packed classes — book early. Otherwise perfect.", reviewerName: "Pri S.", daysAgo: 14 },
  { userId: REVIEWER_USER_IDS[0]!, studioId: S(3), rating: 5, comment: "Left sore in muscles I forgot existed. Will be back Thursday.", reviewerName: "Lauren K.", daysAgo: 2 },
  { userId: REVIEWER_USER_IDS[1]!, studioId: S(3), rating: 5, comment: "Tomás's playlists alone are worth it.", reviewerName: "Marco L.", daysAgo: 6 },
  { userId: REVIEWER_USER_IDS[2]!, studioId: S(6), rating: 5, comment: "Modo's floor-time flow rebuilt my hips. Genuinely.", reviewerName: "Pri S.", daysAgo: 4 },
  { userId: REVIEWER_USER_IDS[0]!, studioId: S(7), rating: 5, comment: "Round 1 was a revelation. Also, I sleep better now.", reviewerName: "Lauren K.", daysAgo: 5 },
  { userId: REVIEWER_USER_IDS[1]!, studioId: S(12), rating: 5, comment: "Small group, sunrise, courtyard. Miami done right.", reviewerName: "Marco L.", daysAgo: 1 },
];

// ─── Sessions generator (stable across renders per week-anchor) ──────────

export function getWeekStart(now: Date = new Date()): Date {
  return startOfWeek(now, { weekStartsOn: 1 });
}

type SessionPlan = {
  classIdx: number;
  dayOffset: number; // 0..6
  hour: number; // 24h
  minute?: number;
  instructorIdx: number; // index into INSTRUCTORS
  locationOffset?: number; // pick Nth location for that studio (default 0)
};

// 42 deterministic sessions, spread across studios + days per §10.2
const SESSION_PLANS: SessionPlan[] = [
  // Monday
  { classIdx: 1, dayOffset: 0, hour: 6, minute: 30, instructorIdx: 0, locationOffset: 0 },   // Jetset Reformer Flow Brickell
  { classIdx: 4, dayOffset: 0, hour: 7, instructorIdx: 4, locationOffset: 0 },                // Barry's Full Body Brickell
  { classIdx: 13, dayOffset: 0, hour: 12, instructorIdx: 9, locationOffset: 0 },              // Rumble Round 1
  { classIdx: 10, dayOffset: 0, hour: 18, minute: 30, instructorIdx: 7, locationOffset: 0 }, // Legacy Team Training
  { classIdx: 18, dayOffset: 0, hour: 6, instructorIdx: 13, locationOffset: 0 },              // Green Monkey Sunrise
  // Tuesday
  { classIdx: 2, dayOffset: 1, hour: 6, instructorIdx: 2, locationOffset: 0 },                // solidcore Full 50 Brickell
  { classIdx: 11, dayOffset: 1, hour: 7, instructorIdx: 8, locationOffset: 0 },              // Modo Hot Flow 26 SoBe
  { classIdx: 7, dayOffset: 1, hour: 12, minute: 15, instructorIdx: 6, locationOffset: 1 }, // Anatomy Power Vinyasa SoBe
  { classIdx: 15, dayOffset: 1, hour: 18, instructorIdx: 10, locationOffset: 0 },             // SoulCycle Signature Ride
  { classIdx: 16, dayOffset: 1, hour: 19, instructorIdx: 11, locationOffset: 0 },             // F45 Brickell
  // Wednesday
  { classIdx: 0, dayOffset: 2, hour: 6, minute: 30, instructorIdx: 1, locationOffset: 1 }, // Jetset Reformer Flow Wynwood
  { classIdx: 5, dayOffset: 2, hour: 7, instructorIdx: 5, locationOffset: 1 },                // Barry's Arms + Abs Lincoln Rd
  { classIdx: 14, dayOffset: 2, hour: 12, instructorIdx: 9, locationOffset: 0 },              // Rumble Knockout Brickell
  { classIdx: 6, dayOffset: 2, hour: 17, minute: 30, instructorIdx: 6, locationOffset: 0 }, // Anatomy Sculpt Midtown
  { classIdx: 17, dayOffset: 2, hour: 19, instructorIdx: 12, locationOffset: 1 },             // Sweat440 Wynwood
  // Thursday
  { classIdx: 3, dayOffset: 3, hour: 6, instructorIdx: 3, locationOffset: 2 },                // solidcore Foundations SoBe
  { classIdx: 8, dayOffset: 3, hour: 7, instructorIdx: 6, locationOffset: 1 },                // Anatomy Team Training SoBe
  { classIdx: 15, dayOffset: 3, hour: 12, instructorIdx: 10, locationOffset: 0 },             // SoulCycle Signature Ride
  { classIdx: 9, dayOffset: 3, hour: 18, instructorIdx: 7, locationOffset: 0 },                // Legacy Team Training
  { classIdx: 12, dayOffset: 3, hour: 19, minute: 30, instructorIdx: 8, locationOffset: 1 }, // Modo Modo Flow Coral Gables
  // Friday
  { classIdx: 1, dayOffset: 4, hour: 6, minute: 30, instructorIdx: 0, locationOffset: 3 }, // Jetset Reformer SoBe
  { classIdx: 4, dayOffset: 4, hour: 7, instructorIdx: 4, locationOffset: 0 },                // Barry's Full Body
  { classIdx: 20, dayOffset: 4, hour: 6, minute: 15, instructorIdx: 14, locationOffset: 0 }, // Third House Breathwork (Fri sunrise)
  { classIdx: 13, dayOffset: 4, hour: 12, instructorIdx: 9, locationOffset: 0 },              // Rumble Round 1
  { classIdx: 19, dayOffset: 4, hour: 17, minute: 30, instructorIdx: 13, locationOffset: 0 }, // Green Monkey Sculpt Flow
  { classIdx: 16, dayOffset: 4, hour: 18, instructorIdx: 11, locationOffset: 1 },             // F45 Wynwood
  // Saturday
  { classIdx: 4, dayOffset: 5, hour: 8, instructorIdx: 4, locationOffset: 1 },                // Barry's Full Body Lincoln Rd
  { classIdx: 2, dayOffset: 5, hour: 9, instructorIdx: 3, locationOffset: 2 },                // solidcore Full 50 SoBe
  { classIdx: 0, dayOffset: 5, hour: 9, minute: 30, instructorIdx: 0, locationOffset: 2 },   // Jetset Reformer Flow Coconut Grove
  { classIdx: 15, dayOffset: 5, hour: 10, instructorIdx: 10, locationOffset: 0 },             // SoulCycle
  { classIdx: 9, dayOffset: 5, hour: 10, instructorIdx: 7, locationOffset: 0 },                // Legacy Team Training
  { classIdx: 17, dayOffset: 5, hour: 11, instructorIdx: 12, locationOffset: 0 },             // Sweat440 Brickell
  { classIdx: 11, dayOffset: 5, hour: 17, instructorIdx: 8, locationOffset: 0 },              // Modo Hot Flow 26
  // Sunday
  { classIdx: 10, dayOffset: 6, hour: 9, instructorIdx: 7, locationOffset: 0 },               // Legacy Sunday Sculpt
  { classIdx: 18, dayOffset: 6, hour: 9, instructorIdx: 13, locationOffset: 0 },              // Green Monkey Sunrise Vinyasa
  { classIdx: 6, dayOffset: 6, hour: 10, instructorIdx: 6, locationOffset: 0 },               // Anatomy Sculpt
  { classIdx: 12, dayOffset: 6, hour: 10, minute: 30, instructorIdx: 8, locationOffset: 1 }, // Modo Modo Flow Coral Gables
  { classIdx: 21, dayOffset: 6, hour: 11, instructorIdx: 14, locationOffset: 0 },             // Third House Mobility Lab
  { classIdx: 19, dayOffset: 6, hour: 17, instructorIdx: 13, locationOffset: 0 },             // Green Monkey Sculpt Flow
  { classIdx: 5, dayOffset: 6, hour: 18, instructorIdx: 5, locationOffset: 0 },                // Barry's Arms + Abs
  { classIdx: 14, dayOffset: 6, hour: 18, minute: 30, instructorIdx: 9, locationOffset: 0 }, // Rumble Knockout
  { classIdx: 7, dayOffset: 6, hour: 19, instructorIdx: 6, locationOffset: 1 },                // Anatomy Power Vinyasa
];

export function buildSessions(weekStart: Date = getWeekStart()): FixtureSession[] {
  return SESSION_PLANS.map((plan, i): FixtureSession | null => {
    const cls = CLASSES[plan.classIdx];
    if (!cls) return null;
    const instructor = INSTRUCTORS[plan.instructorIdx];
    if (!instructor) return null;
    // Pick the matching location for this studio
    const studioLocations = LOCATIONS.filter((l) => l.studioId === cls.studioId);
    const loc = studioLocations[plan.locationOffset ?? 0];
    if (!loc) return null;
    const start = setMinutes(
      setHours(addDays(weekStart, plan.dayOffset), plan.hour),
      plan.minute ?? 0,
    );
    const end = addMinutes(start, cls.durationMinutes);
    const capacity = cls.type === "other" ? 12 : 20;
    const spotsBooked = Math.min(capacity, Math.floor(capacity * (0.45 + (i % 7) / 14)));
    return {
      id: SS(i + 1),
      classId: cls.id,
      locationId: loc.id,
      instructorId: instructor.id,
      startTime: start,
      endTime: end,
      capacity,
      spotsBooked,
      waitlistCount: spotsBooked === capacity ? 2 : 0,
    };
  }).filter((x): x is FixtureSession => x !== null);
}

export function buildReviews(now: Date = new Date()): FixtureReview[] {
  return REVIEW_SEEDS.map((r, i) => ({
    id: R(i + 1),
    userId: r.userId,
    studioId: r.studioId,
    rating: r.rating,
    comment: r.comment,
    reviewerName: r.reviewerName,
    createdAt: addDays(now, -r.daysAgo),
  }));
}

// ─── Default Sofia booking (prototype) ───────────────────────────────────

export function buildSofiaBookings(weekStart: Date = getWeekStart()): Array<{
  id: string;
  userId: string;
  sessionId: string;
  status: "confirmed" | "completed";
  bookedAt: Date;
}> {
  const sessions = buildSessions(weekStart);
  // Book Monday Jetset (idx 0), Wednesday Rumble (idx 12), Friday Jetset (idx 20), Saturday Legacy (idx 30)
  const targets = [0, 12, 20, 30].map((i) => sessions[i]).filter((s): s is FixtureSession => Boolean(s));
  const now = new Date();
  return targets.map((s, i) => ({
    id: `00000000-0000-0000-0007-${(100 + i).toString().padStart(12, "0")}`,
    userId: SOFIA_USER_ID,
    sessionId: s.id,
    status: s.startTime.getTime() < now.getTime() ? "completed" : "confirmed",
    bookedAt: addDays(s.startTime, -2),
  }));
}

export function buildSofiaFavorites(): Array<{ userId: string; studioId: string }> {
  return [S(1), S(3), S(12), S(7)].map((id) => ({ userId: SOFIA_USER_ID, studioId: id }));
}

export const SOFIA_PROFILE = {
  id: SOFIA_USER_ID,
  email: SOFIA_EMAIL,
  fullName: "Sofia Mendez",
  phone: null,
  avatarUrl: AVATAR.sofia,
  homeNeighborhood: "brickell",
  workNeighborhood: "brickell",
};

export const SOFIA_PREFERENCES = {
  userId: SOFIA_USER_ID,
  goals: ["build_strength", "stay_consistent"],
  workoutTypes: ["pilates", "hiit", "yoga"],
  neighborhoods: ["brickell", "wynwood", "south_beach"],
  experienceLevel: "intermediate" as const,
  weeklyGoal: 4,
  unavailableStart: "09:00",
  unavailableEnd: "18:00",
  unavailableDays: [1, 2, 3, 4, 5],
  injuries: null as string | null,
};
