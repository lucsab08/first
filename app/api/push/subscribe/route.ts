import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth";

export const runtime = "nodejs";

const Input = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  userAgent: z.string().optional(),
});

// In mock mode we don't persist push subscriptions — we just accept them.
// With DATABASE_URL set, this should insert into push_subscriptions.
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
