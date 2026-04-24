import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SOFIA_USER_ID } from "@/server/db/fixtures";

const AUTH_ROUTES = ["/signup", "/login", "/callback"];
const ONBOARDING_ROUTE_PREFIX = "/onboarding";
const PUBLIC_ROUTES = ["/", "/pricing", "/studio-preview"];
const APP_HOME = "/today";

/**
 * Auth middleware — §8.5 step 6.
 *
 * Behavior:
 *  - Unauthed requests to protected routes → redirect to "/".
 *  - Authed but not onboarded → redirect to /onboarding/1.
 *  - Onboarded user visiting /onboarding/* or "/" → redirect to /today.
 *  - If Supabase env is missing (local UI-only dev), we fall through as the
 *    prototype user Sofia (pre-onboarded). Every screen remains reachable.
 */
export async function updateSession(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Prototype mode — Sofia is always signed-in and onboarded.
  if (!supabaseUrl || !supabaseKey) {
    const res = NextResponse.next();
    res.cookies.set("sf_dev_user", SOFIA_USER_ID, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  const isOnboarding = pathname.startsWith(ONBOARDING_ROUTE_PREFIX);
  const isPublic = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/_next");

  if (!user) {
    if (!isAuthRoute && !isPublic) {
      const redirectUrl = url.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }
    return response;
  }

  // Check onboarded state — simple metadata check first.
  const onboarded = Boolean(user.user_metadata?.onboarded_at);

  if (!onboarded && !isOnboarding && !isAuthRoute) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = "/onboarding/1";
    return NextResponse.redirect(redirectUrl);
  }

  if (onboarded && (isOnboarding || pathname === "/" || isAuthRoute)) {
    const redirectUrl = url.clone();
    redirectUrl.pathname = APP_HOME;
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
