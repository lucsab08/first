"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetPortal({ children }: { children: React.ReactNode }) {
  return <DialogPrimitive.Portal>{children}</DialogPrimitive.Portal>;
}

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-ink-primary/30 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in data-[state=closed]:opacity-0",
      className,
    )}
    {...props}
  />
));
SheetOverlay.displayName = "SheetOverlay";

export interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  heightClass?: string;
  hideHandle?: boolean;
}

export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  SheetContentProps
>(({ className, children, heightClass = "max-h-[90dvh]", hideHandle, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-0 right-0 bottom-0 z-50 rounded-t-3xl bg-surface shadow-sheet safe-bottom",
        "data-[state=open]:animate-sheet-in",
        heightClass,
        className,
      )}
      {...props}
    >
      {!hideHandle ? (
        <div className="flex justify-center pt-3">
          <div className="h-1 w-10 rounded-full bg-hairline" />
        </div>
      ) : null}
      {children}
    </DialogPrimitive.Content>
  </SheetPortal>
));
SheetContent.displayName = "SheetContent";

export function SheetHeader({
  children,
  onClose,
  className,
}: {
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between px-5 pt-4 pb-2", className)}>
      <h2 className="font-display text-[22px] font-semibold">{children}</h2>
      {onClose ? (
        <SheetClose
          className="h-9 w-9 rounded-full bg-elevated flex items-center justify-center tap"
          aria-label="Close"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </SheetClose>
      ) : null}
    </div>
  );
}

/**
 * Full-screen modal — slides up from bottom over 240ms. §6.2
 */
export function FullScreenModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-paper"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.24, ease: [0.32, 0.72, 0.24, 1] }}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
