import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSessionUser } from "@/server/auth";
import { setSubscription } from "@/server/db/mock";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const stripe = getStripe();
  const priceId = process.env.STRIPE_PRICE_ID_SYNCFIT_PLUS_MONTHLY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  // Dev fallback — no Stripe? Fake the upgrade so Coach can be demoed.
  if (!stripe || !priceId) {
    setSubscription(user.id, {
      tier: "plus",
      status: "trialing",
      currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return NextResponse.json({
      url: `${appUrl}/coach?dev_upgraded=1`,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { trial_period_days: 7 },
    success_url: `${appUrl}/coach?upgraded=1`,
    cancel_url: `${appUrl}/you`,
    allow_promotion_codes: true,
  });

  return NextResponse.json({ url: session.url });
}
