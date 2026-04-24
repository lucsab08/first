import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertDevUserByEmail } from "@/server/db/mock";

export const runtime = "nodejs";

const Input = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(80).optional(),
});

/**
 * Dev-only signup. Active when Supabase env is missing.
 * Creates (or returns) a mock user and sets the sf_dev_user cookie.
 * Middleware then redirects to /onboarding/1 since the user has no onboardedAt.
 */
export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "DISABLED_IN_PROD_AUTH_MODE" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  const user = upsertDevUserByEmail(parsed.data.email, parsed.data.fullName ?? deriveName(parsed.data.email));

  const res = NextResponse.json({
    userId: user.id,
    email: user.email,
    onboarded: Boolean(user.onboardedAt),
    next: user.onboardedAt ? "/today" : "/onboarding/1",
  });
  res.cookies.set("sf_dev_user", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

function deriveName(email: string): string {
  const local = email.split("@")[0] ?? "";
  return local
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}
