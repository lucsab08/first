import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/mark";
import { useToast } from "@/components/ui/toast";
import { getApiBaseUrl } from "@/lib/utils";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function handleLogin() {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) return;
    setSending(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/dev/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) {
        toast.show({ title: "Couldn't sign in", tone: "coral" });
        return;
      }
      const data = (await res.json()) as { next: string; onboarded: boolean };
      toast.show({
        title: data.onboarded ? "Welcome back" : "Let's finish setting you up.",
        tone: "success",
      });
      router.replace((data.next === "/today" ? "/(tabs)/today" : data.next) as never);
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-paper"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Logo size={18} />
      <View className="flex-1 pt-16">
        <Text className="font-display text-[32px]" style={{ lineHeight: 36 }}>
          Welcome back.
        </Text>
        <Text className="text-sm text-ink-secondary mb-2 mt-10">Email</Text>
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          inputMode="email"
          autoCapitalize="none"
          autoComplete="email"
        />
        <View className="mt-3">
          <Button
            block
            label={sending ? "Signing in…" : "Continue"}
            onPress={handleLogin}
            disabled={!email.includes("@") || sending}
          />
        </View>
        <Text className="text-xs text-ink-tertiary mt-3">
          Dev build — no password. Any email lands you back at your account (or a fresh one).
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-ink-tertiary">New here?</Text>
        <Link href="/signup" className="text-sm text-ink-primary underline">
          Create an account
        </Link>
      </View>
    </ScrollView>
  );
}
