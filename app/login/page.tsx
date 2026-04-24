"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/brand/mark";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function handleMagicLink() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      toast.show({ title: "Welcome back", tone: "success" });
      router.push("/today");
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/callback` },
    });
    setSending(false);
    if (error) {
      toast.show({ title: "Couldn't send the link", description: error.message, tone: "coral" });
      return;
    }
    toast.show({ title: "Check your email", description: "We sent a magic link." });
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper px-5 safe-top safe-bottom">
      <header className="pt-6">
        <Logo size={18} />
      </header>
      <main className="flex-1 flex flex-col pt-16 pb-4">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Welcome back.</h1>
        <label className="block text-sm text-ink-secondary mb-2 mt-10">Email</label>
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
        New here?{" "}
        <Link href="/signup" className="text-ink-primary underline underline-offset-4">
          Create an account
        </Link>
      </footer>
    </div>
  );
}
