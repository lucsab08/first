"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/mark";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { Apple, Chrome } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleMagicLink() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      toast.show({ title: "Dev mode — signed in as Sofia", tone: "success" });
      router.push("/today");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    setSending(false);
    if (error) {
      toast.show({ title: "Couldn't send the link", description: error.message, tone: "coral" });
      return;
    }
    toast.show({ title: "Check your email", description: "We sent a magic link." });
  }

  async function handleOAuth(provider: "apple" | "google") {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      toast.show({ title: "Dev mode — signed in as Sofia", tone: "success" });
      router.push("/today");
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/callback` },
    });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper px-5 safe-top safe-bottom">
      <header className="pt-6">
        <Logo size={18} />
      </header>

      <main className="flex-1 flex flex-col pt-16 pb-4">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Get started.</h1>
        <p className="mt-2 text-ink-secondary">One app. Your whole fitness life.</p>

        <div className="mt-10 space-y-3">
          <Button variant="ghost" size="lg" block onClick={() => handleOAuth("apple")}>
            <Apple className="h-5 w-5" />
            Continue with Apple
          </Button>
          <Button variant="ghost" size="lg" block onClick={() => handleOAuth("google")}>
            <Chrome className="h-5 w-5" />
            Continue with Google
          </Button>
        </div>

        <div className="flex items-center gap-3 my-8">
          <div className="flex-1 h-px bg-hairline" />
          <span className="text-xs text-ink-tertiary label-uppercase">or</span>
          <div className="flex-1 h-px bg-hairline" />
        </div>

        <label className="block text-sm text-ink-secondary mb-2">Email</label>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
        />
        <Button
          block
          className="mt-3"
          onClick={handleMagicLink}
          disabled={!email.includes("@") || sending}
        >
          {sending ? "Sending…" : "Send me a link"}
        </Button>
      </main>

      <footer className="pt-4 pb-6 text-sm text-ink-tertiary">
        Already have an account?{" "}
        <Link href="/login" className="text-ink-primary underline underline-offset-4">
          Log in
        </Link>
      </footer>
    </div>
  );
}
