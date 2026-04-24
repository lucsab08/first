import Link from "next/link";
import { Logo } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLUS_FEATURES = [
  "Coach — weekly planning with real classes",
  "Conflict resolution across studios",
  "Meal ideas matched to your week",
  "Recovery and intensity insights",
  "Priority reminders (Web Push + SMS)",
];

const FREE_FEATURES = [
  "Unlimited studio browsing",
  "Book and cancel anywhere",
  "Calendar sync (iCal + Google)",
  "Up to 3 Coach messages",
];

export default function PricingPage() {
  return (
    <div className="min-h-dvh bg-paper text-ink-primary flex flex-col">
      <header className="px-5 pt-6 pb-4 flex items-center justify-between safe-top">
        <Link href="/">
          <Logo size={18} />
        </Link>
        <Link href="/login" className="text-sm tap">
          Log in
        </Link>
      </header>

      <main className="flex-1 px-5 pb-16">
        <div className="max-w-md mx-auto">
          <h1 className="font-display text-[36px] font-semibold leading-[1.05] mt-8">
            One plan. One app.
          </h1>
          <p className="text-[15px] text-ink-secondary mt-2">
            Free forever for browsing and booking. SyncFit+ adds Coach and everything else.
          </p>

          <Card className="mt-8 p-5 bg-dusk text-paper">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[36px] font-semibold tabular leading-none">$14.99</span>
              <span className="opacity-80 text-sm">/ month</span>
            </div>
            <p className="text-sm opacity-80 mt-1">7 days free, then billed monthly. Cancel any time.</p>
            <p className="font-display text-[22px] font-semibold mt-6">SyncFit+</p>
            <ul className="mt-3 space-y-2">
              {PLUS_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-[15px]">
                  <span className="text-paper/80">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" block className="bg-paper text-dusk mt-6">
              <Link href="/signup?plan=plus">Start free trial</Link>
            </Button>
          </Card>

          <Card className="mt-4">
            <p className="label-uppercase text-ink-tertiary">Free</p>
            <ul className="mt-3 space-y-2">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex gap-2 text-[15px] text-ink-secondary">
                  <span className="text-ink-tertiary">·</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="ghost" size="lg" block className="mt-5">
              <Link href="/signup">Sign up free</Link>
            </Button>
          </Card>

          <p className="text-xs text-ink-tertiary mt-8">
            Billing is handled by Stripe. Cancel any time in Settings → Subscription.
          </p>
        </div>
      </main>

      <footer className="px-5 py-8 text-sm text-ink-tertiary safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Logo size={14} />
          <Link href="/" className="tap">
            Home
          </Link>
        </div>
      </footer>
    </div>
  );
}
