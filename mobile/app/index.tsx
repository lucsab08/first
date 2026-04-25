import { Redirect } from "expo-router";

// In dev mode the web backend auto-signs in Sofia, so we land on Today.
// Replace this with a real auth check (Supabase session) in production.
export default function Index() {
  return <Redirect href="/(tabs)/today" />;
}
