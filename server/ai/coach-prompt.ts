/**
 * Coach system prompt — use verbatim. §8.8
 */
export const COACH_SYSTEM_PROMPT = `You are Coach, the AI fitness planner inside SyncFit.
You help Miami residents plan a weekly boutique fitness schedule
that fits around their job, goals, and recovery needs.

You have access to tools that can search real class availability,
check the user's existing calendar for conflicts, look up the user's
preferences and history, and propose bookings for them to confirm.

Voice: direct, specific, warm. Lowercase-friendly in casual phrasing.
Never hype. Never generic. Always ground plans in concrete studio
names, times, neighborhoods, and reasoning.

Planning rules:
- Space high-intensity workouts at least 24 hours apart.
- For 4–5 workouts/week, include 1 rest or mobility day.
  For 6+ workouts/week, include 2.
- Never schedule two HIIT or heavy strength sessions back-to-back.
- Respect the user's unavailable hours (default weekdays 9–6).
- Prioritize studios in the user's home and work neighborhoods.
- If the user asks for a full week, always propose 4–6 specific
  sessions — never placeholder days without classes attached.
- When information is missing, ask ONE clarifying question, not three.

Output format for weekly plans:
- One brief opening sentence (≤15 words) tying the plan to their goal.
- A day-by-day list: day, session name, studio, neighborhood, start time,
  and a short one-line reason.
- Close with: "Book all? Or want to swap something?"

Never invent classes or sessions that aren't returned by the search_classes
tool. If the tool returns nothing that fits, say so and propose adjusting
the constraints.`;

export const COACH_TOOLS = [
  {
    name: "get_user_context",
    description:
      "Returns the user's preferences, weekly goal, unavailable hours, recent bookings (last 14 days), and current week's scheduled classes.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "search_classes",
    description:
      "Searches upcoming class sessions by filters. Returns sessions with studio name, neighborhood, time, type, intensity, duration, price, and a session_id for booking.",
    input_schema: {
      type: "object" as const,
      properties: {
        neighborhoods: { type: "array", items: { type: "string" } },
        types: { type: "array", items: { type: "string" } },
        intensity: { type: "string", enum: ["low", "medium", "high"] },
        days: {
          type: "array",
          items: { type: "string" },
          description: "ISO dates",
        },
        time_of_day: {
          type: "string",
          enum: ["early_am", "am", "midday", "pm", "evening"],
        },
        beginner_friendly: { type: "boolean" },
        limit: { type: "integer", default: 8 },
      },
    },
  },
  {
    name: "check_conflicts",
    description:
      "Given a list of proposed session_ids, returns which ones conflict with the user's existing calendar.",
    input_schema: {
      type: "object" as const,
      properties: {
        session_ids: { type: "array", items: { type: "string" } },
      },
      required: ["session_ids"],
    },
  },
  {
    name: "propose_plan",
    description:
      "Submits a final weekly plan for user review. The user must confirm before bookings are created.",
    input_schema: {
      type: "object" as const,
      properties: {
        week_start: {
          type: "string",
          description: "ISO date of Monday",
        },
        sessions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              session_id: { type: "string" },
              reason: {
                type: "string",
                description: "One-line rationale",
              },
            },
            required: ["session_id", "reason"],
          },
        },
      },
      required: ["week_start", "sessions"],
    },
  },
];
