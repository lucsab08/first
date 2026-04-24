import * as React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-2xl bg-surface shadow-card p-5", className)}
    {...props}
  />
));
Card.displayName = "Card";

export const SandCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-2xl bg-sand p-5", className)}
    {...props}
  />
));
SandCard.displayName = "SandCard";

export const SeaglassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-2xl bg-seaglass p-5", className)}
    {...props}
  />
));
SeaglassCard.displayName = "SeaglassCard";
