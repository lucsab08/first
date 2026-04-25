import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Apple, Chrome } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/mark";
import { useToast } from "@/components/ui/toast";
import { getApiBaseUrl } from "@/lib/utils";

export default function SignupScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();

  async function devSignup(emailValue: string, nameValue?: string) {
    setSending(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/dev/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, fullName: nameValue || undefined }),
      });
      if (!res.ok) {
        toast.show({ title: "Couldn't create that account", tone: "coral" });
        return;
      }
      const data = (await res.json()) as { next: string; onboarded: boolean };
      toast.show({
        title: data.onboarded ? "Welcome back" : "You're in. Let's set you up.",
        tone: "success",
      });
      router.replace((data.next === "/today" ? "/(tabs)/today" : data.next) as never);
    } finally {
      setSending(false);
    }
  }

  function handleOAuth(provider: "apple" | "google") {
    const demo = provider === "apple" ? "apple-demo@syncfit.dev" : "google-demo@syncfit.dev";
    devSignup(demo);
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

      <View className="flex-1 pt-12 pb-2">
        <Text className="font-display text-[32px]" style={{ lineHeight: 36 }}>
          Get started.
        </Text>
        <Text className="text-ink-secondary mt-2">One app. Your whole fitness life.</Text>

        <View className="mt-8 gap-3">
          <Button
            block
            variant="ghost"
            label="Continue with Apple"
            leftSlot={<Apple size={18} color="#0A0A0A" />}
            onPress={() => handleOAuth("apple")}
          />
          <Button
            block
            variant="ghost"
            label="Continue with Google"
            leftSlot={<Chrome size={18} color="#0A0A0A" />}
            onPress={() => handleOAuth("google")}
          />
        </View>

        <View className="flex-row items-center gap-3 my-6">
          <View className="flex-1 h-px bg-hairline" />
          <Text
            className="text-xs text-ink-tertiary font-sansSemibold uppercase"
            style={{ letterSpacing: 0.88 }}
          >
            or
          </Text>
          <View className="flex-1 h-px bg-hairline" />
        </View>

        <Text className="text-sm text-ink-secondary mb-2">Your name</Text>
        <Input value={fullName} onChangeText={setFullName} placeholder="Sofia Mendez" />
        <Text className="text-sm text-ink-secondary mb-2 mt-4">Email</Text>
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
            label={sending ? "Creating…" : "Create account"}
            onPress={() => devSignup(email.trim(), fullName.trim())}
            disabled={!email.includes("@") || sending}
          />
        </View>

        <Text className="text-xs text-ink-tertiary mt-3">
          Dev build — no password, no email sent. We'll walk you through setup.
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Text className="text-sm text-ink-tertiary">Already have an account?</Text>
        <Link href="/login" className="text-sm text-ink-primary underline">
          Log in
        </Link>
      </View>
    </ScrollView>
  );
}
