import { Platform } from "react-native";
import * as IAP from "react-native-iap";
import { getApiBaseUrl } from "@/lib/utils";
import { SYNCFIT_PLUS_PRODUCT_ID } from "@/lib/constants";

/**
 * StoreKit 2 helpers for SyncFit+ subscription. v4.1 §8.7 lane 2.
 *
 * Notes:
 * - iOS only. On Android the "subscribe" CTA simply no-ops (mobile MVP is iOS).
 * - Sandbox testing requires a real iPhone with a sandbox tester Apple ID
 *   signed into Settings → App Store, OR an Xcode .storekit configuration file
 *   for the simulator. None of this works on Windows; on-device verification
 *   has to happen on a Mac with an attached device.
 */

const PRODUCT_IDS = [SYNCFIT_PLUS_PRODUCT_ID];

let initialized = false;

export async function ensureIAPReady(): Promise<boolean> {
  if (Platform.OS !== "ios") return false;
  if (initialized) return true;
  try {
    await IAP.initConnection();
    initialized = true;
    return true;
  } catch {
    return false;
  }
}

export async function getSubscriptionProduct() {
  const ready = await ensureIAPReady();
  if (!ready) return null;
  const products = await IAP.getSubscriptions({ skus: PRODUCT_IDS });
  return products[0] ?? null;
}

/**
 * Purchase the SyncFit+ subscription. On success, the JWS representation
 * is POSTed to /api/storekit/verify which validates it server-side and
 * upserts the subscriptions row.
 */
export async function buySyncFitPlus(): Promise<{
  ok: boolean;
  reason?: string;
}> {
  if (Platform.OS !== "ios") {
    return { ok: false, reason: "iOS only — subscriptions ship as a StoreKit product." };
  }
  const ready = await ensureIAPReady();
  if (!ready) return { ok: false, reason: "Couldn't reach the App Store." };

  try {
    // requestSubscription presents the native sheet with trial + renewal terms.
    const purchase = await IAP.requestSubscription({ sku: SYNCFIT_PLUS_PRODUCT_ID });
    const tx = Array.isArray(purchase) ? purchase[0] : purchase;
    if (!tx) return { ok: false, reason: "No transaction returned." };

    // StoreKit 2 transactions on iOS expose `jwsRepresentationIos`.
    const jws = (tx as unknown as { jwsRepresentationIos?: string }).jwsRepresentationIos;
    if (!jws) return { ok: false, reason: "Missing JWS representation." };

    // Server-side verification.
    const res = await fetch(`${getApiBaseUrl()}/api/storekit/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jws_representation: jws }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, reason: `Server: ${body.slice(0, 120)}` };
    }

    // Acknowledge the transaction so iOS knows we delivered the entitlement.
    await IAP.finishTransaction({ purchase: tx, isConsumable: false });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (/cancel/i.test(message)) return { ok: false, reason: "Cancelled." };
    return { ok: false, reason: message };
  }
}

export async function restorePurchases(): Promise<{ activated: boolean }> {
  if (Platform.OS !== "ios") return { activated: false };
  const ready = await ensureIAPReady();
  if (!ready) return { activated: false };
  try {
    const purchases = await IAP.getAvailablePurchases();
    const sub = purchases.find((p) => p.productId === SYNCFIT_PLUS_PRODUCT_ID);
    if (!sub) return { activated: false };
    const jws = (sub as unknown as { jwsRepresentationIos?: string }).jwsRepresentationIos;
    if (!jws) return { activated: false };
    const res = await fetch(`${getApiBaseUrl()}/api/storekit/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jws_representation: jws }),
    });
    return { activated: res.ok };
  } catch {
    return { activated: false };
  }
}
