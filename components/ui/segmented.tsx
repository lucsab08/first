"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-2xl bg-elevated p-1 relative",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 h-10 px-5 rounded-xl text-sm font-medium transition-colors duration-[180ms]",
              active ? "bg-surface text-ink-primary shadow-card" : "text-ink-secondary",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
