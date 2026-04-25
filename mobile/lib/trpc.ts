import { createTRPCReact } from "@trpc/react-query";
import Constants from "expo-constants";
// Type-only import from the parent (web) project's router definitions.
// Mobile lives at my-app/mobile/, so the web's routers are two levels up.
import type { AppRouter } from "../../server/routers";

export const trpc = createTRPCReact<AppRouter>();

export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv;
  const fromExtra = (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;
  return fromExtra ?? "http://localhost:3000";
}
