import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/server/auth";
import { setSubscription } from "@/server/db/mock";
import { decodeJwsPayloadUnsafe, fetchSubscriptionStatus } from "@/server/services/apple-jws";

export const runtime = "nodejs";

const Input = z.object({
  jws_representation: z.string().min(20),
});

/**
 * v4.1 §8.4 — verify-storekit-receipt
 *
 * Invoked by the mobile client immediately after a successful StoreKit
 * subscription purchase. Decodes the signed transaction, calls Apple's
 * App Store Server API to confirm current status, and upserts the user's
 * subscription row to reflect tier='plus' with the correct expiry.
 */
export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  let payload: ReturnType<typeof decodeJwsPayloadUnsafe>;
  try {
    payload = decodeJwsPayloadUnsafe(parsed.data.jws_representation);
  } catch (err) {
    return NextResponse.json(
      { error: "BAD_JWS", message: err instanceof Error ? err.message : "" },
      { status: 400 },
    );
  }

  // Source of truth: ask Apple for the current status. Falls back to the JWS
  // payload alone if APPLE_APP_STORE_API_KEY isn't configured (dev mode).
  const apple = await fetchSubscriptionStatus(
    payload.originalTransactionId,
    payload.environment ?? "Sandbox",
  );

  const status = apple?.status ?? "active";
  const tier = status === "active" || status === "in_grace_period" ? "plus" : "free";
  const expiresAt = apple?.expiresDate
    ? new Date(apple.expiresDate)
    : payload.expiresDate
      ? new Date(payload.expiresDate)
      : null;

  setSubscription(user.id, {
    tier,
    status: status === "active" ? "active" : status === "in_grace_period" ? "trialing" : status,
    appleOriginalTransactionId: payload.originalTransactionId,
    appleProductId: payload.productId,
    expiresAt,
    autoRenewStatus: apple?.autoRenewStatus ?? null,
    environment: payload.environment ?? "Sandbox",
    lastVerifiedAt: new Date(),
  });

  return NextResponse.json({
    tier,
    status,
    expiresAt,
    productId: payload.productId,
    environment: payload.environment ?? "Sandbox",
    verifiedWithApple: Boolean(apple),
  });
}
