import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "h-14 w-full rounded-2xl bg-elevated px-5 text-[15px] text-ink-primary placeholder:text-ink-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk/30 disabled:opacity-40",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[112px] w-full rounded-2xl bg-elevated px-5 py-4 text-[15px] text-ink-primary placeholder:text-ink-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dusk/30 disabled:opacity-40 resize-none",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
