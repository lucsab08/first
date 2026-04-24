"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "./progress-bar";
import { Button } from "@/components/ui/button";

export function OnboardingShell({
  step,
  total = 6,
  title,
  subhead,
  children,
  skippable,
  ctaLabel,
  ctaDisabled,
  onNext,
}: {
  step: number;
  total?: number;
  title: string;
  subhead?: string;
  children: React.ReactNode;
  skippable?: boolean;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  onNext: () => Promise<void> | void;
}) {
  const router = useRouter();
  const nextPath = step < total ? `/onboarding/${step + 1}` : "/onboarding/complete";

  async function handleNext() {
    await onNext();
    router.push(nextPath);
  }

  function handleSkip() {
    router.push(nextPath);
  }

  return (
    <div className="flex flex-col min-h-dvh px-5 safe-top safe-bottom">
      <header className="flex items-center gap-4 pt-6 pb-3">
        <OnboardingProgress step={step} total={total} />
        {skippable ? (
          <button
            onClick={handleSkip}
            className="text-sm text-ink-tertiary tap shrink-0"
            type="button"
          >
            Skip
          </button>
        ) : null}
      </header>

      <motion.main
        key={step}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.24, ease: [0.32, 0.72, 0.24, 1] }}
        className="flex-1 pt-6 pb-4"
      >
        <h1 className="font-display text-[28px] font-semibold leading-[1.1]">{title}</h1>
        {subhead ? (
          <p className="mt-2 text-[15px] text-ink-secondary leading-snug">{subhead}</p>
        ) : null}
        <div className="mt-8">{children}</div>
      </motion.main>

      <footer className="pt-3 pb-6">
        <Button
          block
          disabled={ctaDisabled}
          onClick={handleNext}
          aria-label={ctaLabel ?? "Continue"}
        >
          {ctaLabel ?? "Continue"}
        </Button>
      </footer>
    </div>
  );
}
