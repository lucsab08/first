import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { cn } from "@/lib/utils";

const LEMNISCATE_D =
  "M 32 32 C 22 22 10 22 10 32 C 10 42 22 42 32 32 C 43 21 57 21 57 32 C 57 43 43 43 32 32";

export function Mark({
  size = 32,
  stroke = "#0A0A0A",
  strokeWidth,
}: {
  size?: number;
  stroke?: string;
  strokeWidth?: number;
}) {
  const sw = strokeWidth ?? (4 * size) / 64;
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path
        d={LEMNISCATE_D}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Wordmark — Fraunces Semibold Italic, lowercase. §2.4 */
export function Wordmark({
  size = 24,
  tone = "ink",
  className,
}: {
  size?: number;
  tone?: "ink" | "paper";
  className?: string;
}) {
  return (
    <Text
      className={cn(
        "font-displayItalic select-none",
        tone === "paper" ? "text-paper" : "text-ink-primary",
        className,
      )}
      style={{
        fontSize: size,
        lineHeight: size,
        letterSpacing: -size * 0.02,
      }}
    >
      syncfit
    </Text>
  );
}

export function Logo({
  size = 18,
  markOnLeft = false,
  tone = "ink",
}: {
  size?: number;
  markOnLeft?: boolean;
  tone?: "ink" | "paper";
}) {
  const stroke = tone === "paper" ? "#FAFAF7" : "#0A0A0A";
  return (
    <View className="flex-row items-center gap-2">
      {markOnLeft ? <Mark size={size + 4} stroke={stroke} /> : null}
      <Wordmark size={size} tone={tone} />
    </View>
  );
}
