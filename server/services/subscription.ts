import { getSubscription } from "@/server/db/mock";

export function isPlus(userId: string): boolean {
  const sub = getSubscription(userId);
  if (sub.tier !== "plus") return false;
  return sub.status === "active" || sub.status === "trialing";
}
