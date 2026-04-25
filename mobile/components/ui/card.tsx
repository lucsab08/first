import { View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, style, children, ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={cn("rounded-2xl bg-surface p-5", className)}
      style={[
        {
          shadowColor: "#0A0A0A",
          shadowOpacity: 0.04,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function SandCard({ className, children, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn("rounded-2xl bg-sand p-5", className)} {...props}>
      {children}
    </View>
  );
}

export function SeaglassCard({ className, children, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn("rounded-2xl bg-seaglass p-5", className)} {...props}>
      {children}
    </View>
  );
}
