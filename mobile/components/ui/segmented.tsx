import { Pressable, Text, View } from "react-native";
import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <View className="flex-row rounded-2xl bg-elevated p-1 self-start">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={cn(
              "h-10 px-5 rounded-xl items-center justify-center",
              active ? "bg-surface" : "bg-transparent",
            )}
            style={
              active
                ? {
                    shadowColor: "#0A0A0A",
                    shadowOpacity: 0.04,
                    shadowRadius: 20,
                    shadowOffset: { width: 0, height: 2 },
                  }
                : undefined
            }
          >
            <Text
              className={cn(
                "font-sansMedium text-sm",
                active ? "text-ink-primary" : "text-ink-secondary",
              )}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
