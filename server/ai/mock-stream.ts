import { addDays, format, startOfWeek } from "date-fns";
import { rankedRecommendations } from "@/server/db/mock";
import { CLASSES, INSTRUCTORS, LOCATIONS, STUDIOS } from "@/server/db/fixtures";

/**
 * Deterministic mock stream used when ANTHROPIC_API_KEY is missing.
 * Emits a realistic weekly plan from ranked recommendations.
 */
export function buildMockPlan(userId: string): {
  opener: string;
  rows: Array<{
    session_id: string;
    day: string;
    class_name: string;
    studio_name: string;
    studio_slug: string;
    neighborhood: string;
    time: string;
    reason: string;
  }>;
  weekStart: string;
  closing: string;
} {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const recs = rankedRecommendations(userId, 20);
  const chosen: typeof recs = [];
  const usedDays = new Set<string>();
  for (const s of recs) {
    const dayKey = s.startTime.toDateString();
    if (usedDays.has(dayKey)) continue;
    usedDays.add(dayKey);
    chosen.push(s);
    if (chosen.length >= 4) break;
  }

  const rows = chosen.map((s) => {
    const cls = CLASSES.find((c) => c.id === s.classId)!;
    const loc = LOCATIONS.find((l) => l.id === s.locationId)!;
    const studio = STUDIOS.find((st) => st.id === cls.studioId)!;
    return {
      session_id: s.id,
      day: format(s.startTime, "EEEE"),
      class_name: cls.name,
      studio_name: studio.name,
      studio_slug: studio.slug,
      neighborhood: loc.neighborhood,
      time: format(s.startTime, "h:mma").toLowerCase(),
      reason: reasonFor(cls, studio.name, loc.neighborhood),
    };
  });

  return {
    opener: "Here's a 4-class week — steady progressions, space for recovery, and time to get to each studio.",
    rows,
    weekStart: weekStart.toISOString().slice(0, 10),
    closing: "Book all? Or want to swap something?",
  };
}

function reasonFor(cls: (typeof CLASSES)[number], studio: string, neighborhood: string): string {
  switch (cls.type) {
    case "pilates":
      return `slow tempo to offset harder days`;
    case "hiit":
      return `peak heart rate block — keep this one firm`;
    case "boxing":
      return `mid-week cardio, ${studio} is 5 min from you`;
    case "yoga":
      return `mobility day, low-impact on your schedule`;
    case "strength":
      return `builds on your strength goal`;
    case "cycling":
      return `leg-heavy cardio to round out the week`;
    default:
      return `gives your body the change-up it wants`;
  }
}

export async function* streamMockResponse(userId: string, prompt: string) {
  const isPlanRequest = /plan|week|schedule|what.* (do|should)/i.test(prompt);

  if (!isPlanRequest) {
    // Short clarifying / ad-hoc response
    const reply = quickReply(prompt);
    for (const token of reply.split(/(\s+)/)) {
      yield { type: "text" as const, data: token };
      await new Promise((r) => setTimeout(r, 20));
    }
    yield { type: "done" as const };
    return;
  }

  const plan = buildMockPlan(userId);
  // Stream opener token-by-token
  for (const token of plan.opener.split(/(\s+)/)) {
    yield { type: "text" as const, data: token };
    await new Promise((r) => setTimeout(r, 18));
  }

  // Emit plan
  yield {
    type: "plan" as const,
    data: {
      week_start: plan.weekStart,
      sessions: plan.rows.map((r) => ({ session_id: r.session_id, reason: r.reason })),
      rows: plan.rows,
    },
  };

  // Stream closing
  yield { type: "text" as const, data: "\n\n" };
  for (const token of plan.closing.split(/(\s+)/)) {
    yield { type: "text" as const, data: token };
    await new Promise((r) => setTimeout(r, 18));
  }

  yield { type: "done" as const };
}

function quickReply(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes("tomorrow")) {
    return "Given yesterday was high-intensity, tomorrow I'd try a slow flow — Modo's 7am in South Beach works if you can get there. Want me to hold the spot?";
  }
  if (p.includes("low-impact") || p.includes("low impact") || p.includes("recovery")) {
    return "Try Green Monkey Yoga in Coral Gables — their Sunrise Vinyasa is 60 minutes, gentle pace, and opens at 6am. Alternatively, Modo Flow at Modo Yoga SoBe. Both are under $30.";
  }
  return "Tell me what you want this week to look like — target count, neighborhoods, anything to avoid — and I'll draft something.";
}
