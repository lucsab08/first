import { forwardRef } from "react";
import { Pressable, Text, type PressableProps, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";

export type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  children?: React.ReactNode;
  label?: string;
  variant?: "primary" | "ghost" | "text" | "coral" | "outline";
  size?: "lg" | "md" | "sm";
  block?: boolean;
  className?: string;
  textClassName?: string;
  haptic?: boolean;
  style?: ViewStyle;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
};

const VARIANT_BG = {
  primary: "bg-dusk",
  ghost: "bg-elevated",
  text: "bg-transparent",
  coral: "bg-coral",
  outline: "bg-surface border border-hairline",
} as const;

const VARIANT_TEXT = {
  primary: "text-paper",
  ghost: "text-ink-primary",
  text: "text-ink-secondary underline",
  coral: "text-paper",
  outline: "text-ink-primary",
} as const;

const SIZE = {
  lg: "h-14 px-6",
  md: "h-12 px-5",
  sm: "h-10 px-4",
} as const;

const TEXT_SIZE = {
  lg: "text-[15px]",
  md: "text-[15px]",
  sm: "text-sm",
} as const;

export const Button = forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  function Button(
    {
      children,
      label,
      variant = "primary",
      size = "lg",
      block,
      className,
      textClassName,
      haptic = true,
      onPress,
      disabled,
      leftSlot,
      rightSlot,
      style,
      ...rest
    },
    ref,
  ) {
    return (
      <Pressable
        ref={ref}
        disabled={disabled}
        accessibilityRole="button"
        onPress={(e) => {
          if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onPress?.(e);
        }}
        style={({ pressed }) => [
          { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: disabled ? 0.4 : 1 },
          style,
        ]}
        className={cn(
          "rounded-2xl flex-row items-center justify-center gap-2",
          SIZE[size],
          VARIANT_BG[variant],
          block && "self-stretch",
          className,
        )}
        {...rest}
      >
        {leftSlot}
        {label || typeof children === "string" ? (
          <Text className={cn("font-sansMedium tracking-tight", TEXT_SIZE[size], VARIANT_TEXT[variant], textClassName)}>
            {label ?? children}
          </Text>
        ) : (
          children
        )}
        {rightSlot}
      </Pressable>
    );
  },
);
