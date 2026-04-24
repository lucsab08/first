import Link from "next/link";
import { Logo, Mark } from "@/components/brand/mark";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-paper text-ink-primary">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex items-center justify-between safe-top">
        <Logo size={18} />
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="text-ink-secondary tap">
            Pricing
          </Link>
          <Link href="/login" className="text-ink-primary tap">
            Log in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-10 pb-14 flex-1 flex flex-col">
        <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
          <Mark size={44} className="text-dusk mb-6" />
          <h1 className="font-display text-[44px] leading-[1.02] font-semibold tracking-tight">
            Miami moves in sync.
          </h1>
          <p className="mt-4 text-[17px] text-ink-secondary leading-snug max-w-xs">
            One app for Miami's boutique fitness community. Discover, book, and organize your week —
            with a Coach that plans it around your life.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <Button asChild size="lg" block>
              <Link href="/signup">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" block>
              <Link href="/pricing">See SyncFit+</Link>
            </Button>
          </div>

          <div className="mt-12 rounded-3xl overflow-hidden shadow-card aspect-[4/5] relative">
            <img
              src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-ink-primary/60 to-transparent text-paper">
              <p className="label-uppercase opacity-80">This week</p>
              <p className="font-display text-[20px] font-semibold mt-1 leading-tight">
                Reformer Flow at Jetset Pilates, 6:30am Brickell.
              </p>
              <p className="text-sm opacity-80 mt-1">Booked. Reminded. Already on your calendar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="px-5 py-12 bg-elevated">
        <div className="max-w-md mx-auto">
          <p className="label-uppercase text-ink-tertiary mb-3">Why syncfit</p>
          <h2 className="font-display text-[28px] font-semibold leading-tight">
            Boutique fitness, one calendar.
          </h2>
          <div className="mt-8 space-y-6">
            <Reason title="Every studio you love.">
              Jetset, Barry's, Modo, [solidcore], Anatomy, Rumble, and dozens more. One search.
            </Reason>
            <Reason title="A Coach that plans.">
              Tell Coach how your week looks. Get a week back with specific classes, times, and reasons.
            </Reason>
            <Reason title="No double-booking.">
              Conflict detection with travel buffer. Swap, keep both, or move on.
            </Reason>
          </div>
        </div>
      </section>

      <footer className="px-5 py-10 text-sm text-ink-tertiary safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Logo size={14} />
          <div className="flex gap-4">
            <Link href="/pricing" className="tap">
              Pricing
            </Link>
            <a href="mailto:hey@syncfit.app" className="tap">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Reason({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-medium text-[16px]">{title}</p>
      <p className="text-[15px] text-ink-secondary mt-1 leading-snug">{children}</p>
    </div>
  );
}
