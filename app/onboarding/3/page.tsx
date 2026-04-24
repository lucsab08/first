"use client";

import { OnboardingShell } from "../shell";
import { Chip } from "@/components/ui/chip";
import { NEIGHBORHOODS } from "@/lib/constants";
import { useOnboarding } from "@/lib/stores/onboarding";
import { neighborhoodLabel } from "@/lib/utils";

export default function Step3() {
  const { neighborhoods, toggleArrayField } = useOnboarding();
  const valid = neighborhoods.length >= 1;

  return (
    <OnboardingShell
      step={3}
      title="Where are you moving?"
      subhead="We'll surface studios nearby."
      ctaDisabled={!valid}
      onNext={() => {}}
    >
      {/* Stylized Miami map illustration */}
      <div className="relative h-40 -mx-5 overflow-hidden">
        <svg viewBox="0 0 400 160" className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="sea" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="#D4E4E8" />
              <stop offset="1" stopColor="#F5F3EF" />
            </linearGradient>
          </defs>
          <rect width="400" height="160" fill="url(#sea)" />
          <path
            d="M30 110 Q60 70 100 80 T180 75 Q220 70 260 85 T340 95 Q370 100 380 115 L380 160 L0 160 L0 120 Z"
            fill="#FAFAF7"
          />
          <path d="M295 60 Q305 40 320 45 T345 70" fill="none" stroke="#8FA896" strokeWidth="2" />
          <circle cx="95" cy="88" r="3" fill="#1B3A4B" />
          <circle cx="155" cy="78" r="3" fill="#1B3A4B" />
          <circle cx="215" cy="84" r="3" fill="#1B3A4B" />
          <circle cx="275" cy="92" r="3" fill="#1B3A4B" />
          <text x="14" y="150" fontFamily="serif" fontSize="12" fontStyle="italic" fill="#9A9A9A">
            miami
          </text>
        </svg>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {NEIGHBORHOODS.map((n) => (
          <Chip
            key={n}
            active={neighborhoods.includes(n)}
            onClick={() => toggleArrayField("neighborhoods", n)}
          >
            {neighborhoodLabel(n)}
          </Chip>
        ))}
      </div>
    </OnboardingShell>
  );
}
