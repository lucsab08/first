"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex h-9 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors duration-[120ms] ease-ios select-none",
  {
    variants: {
      variant: {
        default: "bg-elevated text-ink-primary",
        active: "bg-dusk text-paper",
        sage: "bg-sage/20 text-ink-primary",
        coral: "bg-coral/15 text-ink-primary",
        outline: "border border-hairline bg-surface text-ink-primary",
      },
      size: {
        md: "h-9 px-4 text-sm",
        sm: "h-7 px-3 text-xs",
        lg: "h-11 px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ChipProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof chipVariants> {
  active?: boolean;
  asDiv?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, variant, size, active, asDiv, ...props }, ref) => {
    const resolvedVariant = active ? "active" : variant;
    const classes = cn(
      chipVariants({ variant: resolvedVariant, size, className }),
      !asDiv && "active:scale-[0.97]",
    );

    if (asDiv) {
      return (
        <div
          className={classes}
          {...(props as unknown as React.HTMLAttributes<HTMLDivElement>)}
        />
      );
    }

    return <button ref={ref} type="button" className={classes} {...props} />;
  },
);
Chip.displayName = "Chip";

/** Uppercase metadata label chip — TRENDING / NEW / PREMIUM. §2.7 */
export function LabelTag({
  children,
  tone = "coral",
  className,
}: {
  children: React.ReactNode;
  tone?: "coral" | "sage" | "dusk";
  className?: string;
}) {
  const toneClass =
    tone === "sage"
      ? "text-sage"
      : tone === "dusk"
      ? "text-dusk"
      : "text-coral";
  return (
    <span className={cn("label-uppercase", toneClass, className)}>
      {children}
    </span>
  );
}
