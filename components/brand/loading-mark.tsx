"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The only loading indicator used anywhere in the app. §2.5
 * The lemniscate draws itself continuously over 1.2s, easing out at loop ends.
 */
export function LoadingMark({
  size = 48,
  className,
  stroke = "#1B3A4B",
}: {
  size?: number;
  className?: string;
  stroke?: string;
}) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [length, setLength] = useState<number>(220);

  useEffect(() => {
    if (pathRef.current) {
      const l = pathRef.current.getTotalLength();
      setLength(l);
    }
  }, []);

  const sw = (4 * size) / 64;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={cn(className)}
      aria-label="Loading"
      role="img"
    >
      <path
        ref={pathRef}
        d="M 32 32 C 22 22 10 22 10 32 C 10 42 22 42 32 32 C 43 21 57 21 57 32 C 57 43 43 43 32 32"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${length} ${length}`}
        style={{
          animation: `lemniscate-draw 1200ms cubic-bezier(0.32, 0.72, 0.24, 1) infinite`,
        }}
      />
      <style>{`
        @keyframes lemniscate-draw {
          0%   { stroke-dashoffset: ${length}; }
          100% { stroke-dashoffset: ${-length}; }
        }
      `}</style>
    </svg>
  );
}

export function LoadingMarkCentered({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-tertiary">
      <LoadingMark />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  );
}

/**
 * Skeleton row — paired with LoadingMark for list-style loading states.
 * Shimmer uses the same brand tones, never gray-200.
 */
export function SkeletonRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 rounded-md bg-elevated",
        "relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-surface before:to-transparent",
        "before:animate-[shimmer_1400ms_infinite]",
        className,
      )}
    >
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
