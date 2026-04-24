"use client";

import { cn } from "@/lib/utils";

export function OnboardingProgress({ step, total = 6 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-[320ms] ease-ios",
            i < step ? "bg-dusk" : "bg-hairline",
          )}
        />
      ))}
    </div>
  );
}
