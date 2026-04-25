import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";

export type ChipProps = {
  children: React.ReactNode;
  active?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const SIZE = {
  sm: "h-7 px-3",
  md: "h-9 px-4",
  lg: "h-11 px-5",
};

const TEXT_SIZE = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-[15px]",
};

export function Chip({ children, active, onPress, disabled, className, size = "md" }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.selectionAsync().catch(() => {});
        onPress?.();
      }}
      disabled={disabled}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}
      className={cn(
        "rounded-xl items-center justify-center self-start",
        SIZE[size],
        active ? "bg-dusk" : "bg-elevated",
        className,
      )}
    >
      <Text
        className={cn(
          "font-sansMedium",
          TEXT_SIZE[size],
          active ? "text-paper" : "text-ink-primary",
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function LabelTag({
  children,
  tone = "coral",
  className,
}: {
  children: React.ReactNode;
  tone?: "coral" | "sage" | "dusk";
  className?: string;
}) {
  const toneClass = tone === "sage" ? "text-sage" : tone === "dusk" ? "text-dusk" : "text-coral";
  return (
    <Text
      className={cn("font-sansSemibold uppercase", toneClass, className)}
      style={{ fontSize: 11, letterSpacing: 0.88 }}
    >
      {children}
    </Text>
  );
}
