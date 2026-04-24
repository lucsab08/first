"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "coral";
};

type ToastContext = {
  show: (t: Omit<Toast, "id">) => void;
};

const Ctx = React.createContext<ToastContext | null>(null);

export function useToast() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const show = React.useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-3 left-0 right-0 z-[200] flex flex-col items-center gap-2 px-4 pointer-events-none safe-top">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ y: -24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0.24, 1] }}
              className={cn(
                "pointer-events-auto max-w-sm rounded-2xl shadow-card px-4 py-3",
                t.tone === "coral"
                  ? "bg-coral text-paper"
                  : t.tone === "success"
                  ? "bg-dusk text-paper"
                  : "bg-surface text-ink-primary",
              )}
            >
              <p className="text-[15px] font-medium">{t.title}</p>
              {t.description ? (
                <p className="text-sm opacity-80 mt-0.5">{t.description}</p>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
