import { createContext, useCallback, useContext, useState } from "react";
import { View, Text } from "react-native";
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: "default" | "success" | "coral";
};

type ToastContextValue = { show: (t: Omit<Toast, "id">) => void };

const Ctx = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const show = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: insets.top + 8, left: 16, right: 16 }}
      >
        {toasts.map((t) => (
          <Animated.View
            key={t.id}
            entering={FadeInUp.duration(240).easing(Easing.bezier(0.32, 0.72, 0.24, 1))}
            exiting={FadeOutUp.duration(200)}
            layout={Layout.springify()}
            className={cn(
              "rounded-2xl px-4 py-3 mb-2 shadow",
              t.tone === "coral"
                ? "bg-coral"
                : t.tone === "success"
                ? "bg-dusk"
                : "bg-surface",
            )}
            style={{ shadowColor: "#0A0A0A", shadowOpacity: 0.08, shadowRadius: 20 }}
          >
            <Text
              className={cn(
                "font-sansMedium",
                t.tone === "coral" || t.tone === "success" ? "text-paper" : "text-ink-primary",
              )}
              style={{ fontSize: 15 }}
            >
              {t.title}
            </Text>
            {t.description ? (
              <Text
                className={cn(
                  t.tone === "coral" || t.tone === "success" ? "text-paper/80" : "text-ink-secondary",
                )}
                style={{ fontSize: 14 }}
              >
                {t.description}
              </Text>
            ) : null}
          </Animated.View>
        ))}
      </View>
    </Ctx.Provider>
  );
}
