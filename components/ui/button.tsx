"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight transition-transform duration-[120ms] ease-ios active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk/30",
  {
    variants: {
      variant: {
        primary: "bg-dusk text-paper",
        ghost: "bg-elevated text-ink-primary",
        text: "text-ink-secondary underline-offset-4 active:underline",
        coral: "bg-coral text-paper",
        outline: "border border-hairline bg-surface text-ink-primary",
      },
      size: {
        lg: "h-14 px-6 text-[15px]",
        md: "h-12 px-5 text-[15px]",
        sm: "h-10 px-4 text-sm",
        icon: "h-11 w-11",
      },
      block: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "lg",
      block: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
