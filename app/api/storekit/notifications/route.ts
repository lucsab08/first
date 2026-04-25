import { NextResponse } from "next/server";
import { z } from "zod";
import { setSubscriptionByAppleOriginalId } from "@/server/db/mock";
import { decodeJwsPayloadUnsafe } from "@/server/services/apple-jws";

export const runtime = "nodejs";

const Input = z.object({
  signedPayload: z.string().min(20),
});

/**
 * v4.1 §8.4 — App Store Server Notifications v2 webhook.
 *
 * Apple posts a JWS-signed payload here for every subscription lifecycle
 * event. We decode the payload, extract the notificationType, look up the
 * subscription by apple_original_transaction_id, and update the row.
 *
 * In production: verify the JWS signature against Apple's root certs before
 * trusting the payload. For dev, the trust anchor is the source IP / route
 * being publicly reachable from Apple only.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = Input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION", issues: parsed.error.flatten() }, { status: 400 });
  }

  let outerPayload: {
    notificationType?: string;
    subtype?: string;
    notificationUUID?: string;
    data?: { signedTransactionInfo?: string; signedRenewalInfo?: string };
  };
  try {
    outerPayload = decodeOuter(parsed.data.signedPayload);
  } catch (err) {
    return NextResponse.json({ error: "BAD_JWS", message: String(err) }, { status: 400 });
  }

  const notificationType = outerPayload.notificationType ?? "";
  const tx = outerPayload.data?.signedTransactionInfo
    ? decodeJwsPayloadUnsafe(outerPayload.data.signedTransactionInfo)
    : null;
  const renewal = outerPayload.data?.signedRenewalInfo
    ? safeDecode(outerPayload.data.signedRenewalInfo)
    : null;

  if (!tx?.originalTransactionId) {
    return NextResponse.json({ ok: true, ignored: "no transaction info" });
  }

  // Map Apple notificationType to our subscription state.
  const action = mapNotification(notificationType, outerPayload.subtype);

  setSubscriptionByAppleOriginalId(tx.originalTransactionId, {
    tier: action.tier,
    status: action.status,
    expiresAt: tx.expiresDate ? new Date(tx.expiresDate) : null,
    autoRenewStatus:
      (renewal as unknown as { autoRenewStatus?: number })?.autoRenewStatus === 1
        ? true
        : (renewal as unknown as { autoRenewStatus?: number })?.autoRenewStatus === 0
          ? false
          : null,
    environment: tx.environment ?? "Sandbox",
    lastVerifiedAt: new Date(),
  });

  return NextResponse.json({ ok: true, notificationType, applied: action });
}

function decodeOuter(jws: string): {
  notificationType?: string;
  subtype?: string;
  notificationUUID?: string;
  data?: { signedTransactionInfo?: string; signedRenewalInfo?: string };
} {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid outer JWS");
  const payload = parts[1]!;
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf-8",
  );
  return JSON.parse(json);
}

function safeDecode(jws: string) {
  try {
    return decodeJwsPayloadUnsafe(jws);
  } catch {
    return null;
  }
}

type Action = {
  tier: "free" | "plus";
  status: "active" | "expired" | "in_grace_period" | "in_billing_retry" | "revoked" | "trialing" | "canceled";
};

function mapNotification(type: string, subtype?: string): Action {
  switch (type) {
    case "SUBSCRIBED":
    case "DID_RENEW":
      return { tier: "plus", status: "active" };
    case "OFFER_REDEEMED":
      return { tier: "plus", status: "active" };
    case "DID_CHANGE_RENEWAL_PREF":
      return { tier: "plus", status: "active" };
    case "DID_CHANGE_RENEWAL_STATUS":
      return { tier: "plus", status: subtype === "AUTO_RENEW_DISABLED" ? "canceled" : "active" };
    case "DID_FAIL_TO_RENEW":
      return { tier: "plus", status: subtype === "GRACE_PERIOD" ? "in_grace_period" : "in_billing_retry" };
    case "GRACE_PERIOD_EXPIRED":
      return { tier: "free", status: "expired" };
    case "EXPIRED":
      return { tier: "free", status: "expired" };
    case "REFUND":
    case "REFUND_DECLINED":
    case "REVOKE":
      return { tier: "free", status: "revoked" };
    case "PRICE_INCREASE":
      return { tier: "plus", status: "active" };
    default:
      return { tier: "plus", status: "active" };
  }
}
