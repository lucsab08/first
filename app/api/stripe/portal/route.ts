import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionUser } from "@/server/auth";
import { getSubscription } from "@/server/db/mock";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const sub = getSubscription(user.id);

  if (!stripe || !sub.stripeCustomerId) {
    return NextResponse.json({ url: `${appUrl}/you` });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${appUrl}/you`,
  });
  return NextResponse.json({ url: session.url });
}
