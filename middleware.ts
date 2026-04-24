import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run middleware on all app routes except static assets and API routes.
     * API routes manage their own auth (tRPC protected procedures, webhook
     * signature verification, iCal token gating).
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.webmanifest|icon.svg|api/).*)",
  ],
};
