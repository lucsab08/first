import { useEffect } from "react";
import { View, Text } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const LEMNISCATE_D =
  "M 32 32 C 22 22 10 22 10 32 C 10 42 22 42 32 32 C 43 21 57 21 57 32 C 57 43 43 43 32 32";

const PATH_LENGTH = 220; // approx getTotalLength of the lemniscate

const IOS_EASE = Easing.bezier(0.32, 0.72, 0.24, 1);

export function LoadingMark({
  size = 48,
  stroke = "#1B3A4B",
}: {
  size?: number;
  stroke?: string;
}) {
  const offset = useSharedValue(PATH_LENGTH);
  const sw = (4 * size) / 64;

  useEffect(() => {
    offset.value = withRepeat(
      withTiming(-PATH_LENGTH, { duration: 1200, easing: IOS_EASE }),
      -1,
      false,
    );
    return () => cancelAnimation(offset);
  }, [offset]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: offset.value,
  }));

  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <AnimatedPath
        d={LEMNISCATE_D}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${PATH_LENGTH} ${PATH_LENGTH}`}
        animatedProps={animatedProps}
      />
    </Svg>
  );
}

export function LoadingMarkCentered({ label }: { label?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <LoadingMark />
      {label ? <Text className="text-sm text-ink-tertiary mt-3">{label}</Text> : null}
    </View>
  );
}
