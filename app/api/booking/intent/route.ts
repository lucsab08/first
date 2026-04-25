import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth";
import { getSessionById } from "@/server/db/mock";
import { CLASSES } from "@/server/db/fixtures";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const Input = z.object({ sessionId: z.string() });

/**
 * v4.1 §8.7 lane 1 — class-booking PaymentIntent.
 * Returns a Stripe client_secret the mobile client passes to
 * stripe.initPaymentSheet({ paymentIntentClientSecret, applePay: ... }).
 *
 * In dev (no Stripe key), returns devSkip:true so the client confirms the
 * booking without payment — the booking flow is still demoable.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  const session = getSessionById(parsed.data.sessionId);
  if (!session) return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });

  const cls = CLASSES.find((c) => c.id === session.classId);
  if (!cls) return NextResponse.json({ error: "CLASS_NOT_FOUND" }, { status: 404 });

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ devSkip: true, amount: cls.priceCents });
  }

  try {
    const pi = await stripe.paymentIntents.create({
      amount: cls.priceCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: user.id,
        sessionId: session.id,
        classId: cls.id,
      },
      description: `${cls.name} — SyncFit booking`,
    });
    return NextResponse.json({ clientSecret: pi.client_secret, amount: cls.priceCents });
  } catch (err) {
    return NextResponse.json(
      { error: "STRIPE_ERROR", message: err instanceof Error ? err.message : "" },
      { status: 502 },
    );
  }
}
