/**
 * Apple JWS helpers for StoreKit 2.
 *
 * In production, the JWS coming from StoreKit and the App Store Server
 * Notifications webhook MUST have its signature verified against Apple's
 * root certificates. The chain is included in the `x5c` header. The standard
 * library for Node is `jose`; install it and replace `decodeJwsPayloadUnsafe`
 * with a real `jwtVerify` against Apple's root cert.
 *
 * For now, this file decodes the payload (base64url) without verifying the
 * signature. The trust anchor we rely on is the App Store Server API call —
 * that endpoint requires our signed bearer token and only returns valid data
 * for transactions Apple actually issued. Combine the two for production:
 *  1) verify the JWS signature here
 *  2) corroborate by calling the App Store Server API
 */

export type AppleTransactionPayload = {
  transactionId: string;
  originalTransactionId: string;
  productId: string;
  expiresDate?: number; // epoch ms
  purchaseDate?: number;
  environment?: "Sandbox" | "Production";
  type?: string;
};

export function decodeJwsPayloadUnsafe(jws: string): AppleTransactionPayload {
  const parts = jws.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWS");
  const payload = parts[1]!;
  const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
  const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
    "utf-8",
  );
  const decoded = JSON.parse(json);
  return {
    transactionId: String(decoded.transactionId ?? ""),
    originalTransactionId: String(decoded.originalTransactionId ?? decoded.transactionId ?? ""),
    productId: String(decoded.productId ?? ""),
    expiresDate: decoded.expiresDate ? Number(decoded.expiresDate) : undefined,
    purchaseDate: decoded.purchaseDate ? Number(decoded.purchaseDate) : undefined,
    environment: decoded.environment ?? undefined,
    type: decoded.type ?? undefined,
  };
}

export type SubscriptionStatusFromApple = {
  status: "active" | "expired" | "in_grace_period" | "in_billing_retry" | "revoked";
  expiresDate?: number;
  autoRenewStatus?: boolean;
  productId?: string;
  environment?: "Sandbox" | "Production";
};

const STATUS_MAP: Record<number, SubscriptionStatusFromApple["status"]> = {
  1: "active",
  2: "expired",
  3: "in_billing_retry",
  4: "in_grace_period",
  5: "revoked",
};

/**
 * Calls Apple's App Store Server API to confirm subscription status.
 * Requires APPLE_APP_STORE_API_KEY (PEM-encoded private key), APPLE_APP_STORE_KEY_ID,
 * APPLE_APP_STORE_ISSUER_ID, APPLE_BUNDLE_ID. If any are missing, returns null
 * and the caller should fall back to the JWS payload directly (dev only).
 */
export async function fetchSubscriptionStatus(
  originalTransactionId: string,
  environment: "Sandbox" | "Production" = "Sandbox",
): Promise<SubscriptionStatusFromApple | null> {
  const keyPem = process.env.APPLE_APP_STORE_API_KEY;
  const keyId = process.env.APPLE_APP_STORE_KEY_ID;
  const issuerId = process.env.APPLE_APP_STORE_ISSUER_ID;
  const bundleId = process.env.APPLE_BUNDLE_ID ?? "app.syncfit.ios";
  if (!keyPem || !keyId || !issuerId) return null;

  const baseUrl =
    environment === "Production"
      ? "https://api.storekit.itunes.apple.com"
      : "https://api.storekit-sandbox.itunes.apple.com";

  const token = await signAppStoreServerJwt({ keyPem, keyId, issuerId, bundleId });

  const res = await fetch(
    `${baseUrl}/inApps/v1/subscriptions/${encodeURIComponent(originalTransactionId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) return null;

  const body = (await res.json()) as {
    data?: Array<{
      lastTransactions?: Array<{
        status?: number;
        signedTransactionInfo?: string;
        signedRenewalInfo?: string;
      }>;
    }>;
  };

  const last = body.data?.[0]?.lastTransactions?.[0];
  if (!last) return null;
  const tx = last.signedTransactionInfo ? decodeJwsPayloadUnsafe(last.signedTransactionInfo) : null;
  const renewal = last.signedRenewalInfo
    ? (() => {
        try {
          return decodeJwsPayloadUnsafe(last.signedRenewalInfo!);
        } catch {
          return null;
        }
      })()
    : null;

  return {
    status: STATUS_MAP[last.status ?? 0] ?? "expired",
    expiresDate: tx?.expiresDate,
    autoRenewStatus: (renewal as unknown as { autoRenewStatus?: number })?.autoRenewStatus === 1,
    productId: tx?.productId,
    environment: tx?.environment,
  };
}

/**
 * Sign a short-lived JWT for App Store Server API requests using the
 * developer's PEM-encoded EC private key (ES256). Standalone implementation
 * to avoid pulling in `jose` for one call.
 */
async function signAppStoreServerJwt({
  keyPem,
  keyId,
  issuerId,
  bundleId,
}: {
  keyPem: string;
  keyId: string;
  issuerId: string;
  bundleId: string;
}): Promise<string> {
  const { createSign, createPrivateKey } = await import("node:crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "ES256",
    kid: keyId,
    typ: "JWT",
  };
  const payload = {
    iss: issuerId,
    iat: now,
    exp: now + 60 * 30,
    aud: "appstoreconnect-v1",
    bid: bundleId,
  };
  const enc = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const headerB64 = enc(header);
  const payloadB64 = enc(payload);
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = createPrivateKey(keyPem);
  const signer = createSign("SHA256");
  signer.update(signingInput);
  signer.end();
  // ES256 produces a DER-encoded signature; need to convert to JOSE (R||S) format.
  const der = signer.sign(key);
  const sig = derToJose(der);
  const sigB64 = sig.toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${signingInput}.${sigB64}`;
}

function derToJose(der: Buffer): Buffer {
  // Per RFC 7515: ES256 signatures must be R||S, each 32 bytes, big-endian.
  let i = 0;
  if (der[i++] !== 0x30) throw new Error("Bad DER");
  const len = der[i++] ?? 0;
  if (len !== der.length - 2) {
    /* tolerate */
  }
  if (der[i++] !== 0x02) throw new Error("Bad DER R");
  const rLen = der[i++] ?? 0;
  let r = der.slice(i, i + rLen);
  i += rLen;
  if (der[i++] !== 0x02) throw new Error("Bad DER S");
  const sLen = der[i++] ?? 0;
  let s = der.slice(i, i + sLen);
  if (r.length > 32) r = r.slice(r.length - 32);
  if (s.length > 32) s = s.slice(s.length - 32);
  const out = Buffer.alloc(64);
  r.copy(out, 32 - r.length);
  s.copy(out, 64 - s.length);
  return out;
}
