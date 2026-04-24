import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SOFIA_USER_ID } from "@/server/db/fixtures";
import { getUser } from "@/server/db/mock";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string | null;
  onboardedAt: Date | null;
};

/**
 * Returns the current authenticated user. In dev without Supabase env,
 * falls back to Sofia (the prototype user) so all screens remain reachable.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata?.full_name ?? null,
      onboardedAt: user.user_metadata?.onboarded_at
        ? new Date(user.user_metadata.onboarded_at as string)
        : null,
    };
  }

  // Prototype fallback
  const c = cookies().get("sf_dev_user");
  const id = c?.value ?? SOFIA_USER_ID;
  const u = getUser(id) ?? getUser(SOFIA_USER_ID);
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    onboardedAt: u.onboardedAt,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) throw new Error("UNAUTHORIZED");
  return u;
}
