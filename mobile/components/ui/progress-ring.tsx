import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

export function ProgressRing({
  value,
  target,
  size = 56,
  strokeWidth = 4,
}: {
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(1, target > 0 ? value / target : 0);
  const dashOffset = circumference * (1 - pct);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#ECEAE4"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1B3A4B"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <Text
        style={{
          position: "absolute",
          fontSize: 11,
          fontVariant: ["tabular-nums"],
          fontWeight: "600",
        }}
      >
        {value}/{target}
      </Text>
    </View>
  );
}
