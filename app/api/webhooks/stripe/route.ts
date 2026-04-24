import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { setSubscription } from "@/server/db/mock";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "NO_SIGNATURE" }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    return NextResponse.json(
      { error: "BAD_SIGNATURE", message: err instanceof Error ? err.message : "" },
      { status: 400 },
    );
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId) {
        setSubscription(userId, {
          tier: "plus",
          status: "trialing",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === "string" ? session.subscription : null,
        });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const s = event.data.object as Stripe.Subscription;
      const userId = (s.metadata?.user_id as string) ?? null;
      if (!userId) break;
      const statusMap: Record<Stripe.Subscription.Status, "active" | "past_due" | "canceled" | "trialing"> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        trialing: "trialing",
        incomplete: "past_due",
        incomplete_expired: "canceled",
        paused: "canceled",
        unpaid: "past_due",
      };
      setSubscription(userId, {
        tier: event.type === "customer.subscription.deleted" ? "free" : "plus",
        status: statusMap[s.status] ?? "canceled",
        currentPeriodEnd: new Date(s.current_period_end * 1000),
        stripeSubscriptionId: s.id,
      });
      break;
    }
    case "invoice.payment_failed": {
      const inv = event.data.object as Stripe.Invoice;
      const userId = (inv.metadata?.user_id as string) ?? null;
      if (userId) {
        setSubscription(userId, { status: "past_due" });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
