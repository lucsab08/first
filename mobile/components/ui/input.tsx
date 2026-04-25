import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#9A9A9A"
      className={cn(
        "h-14 rounded-2xl bg-elevated px-5 text-ink-primary",
        className,
      )}
      style={{ fontSize: 15 }}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#9A9A9A"
      multiline
      textAlignVertical="top"
      className={cn(
        "min-h-[112px] rounded-2xl bg-elevated px-5 py-4 text-ink-primary",
        className,
      )}
      style={{ fontSize: 15 }}
      {...props}
    />
  );
}
