import { Modal, Pressable, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { cn } from "@/lib/utils";

const IOS_EASE = Easing.bezier(0.32, 0.72, 0.24, 1);

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  heightFraction?: number; // 0..1 of screen height
  className?: string;
};

export function Sheet({ open, onClose, children, heightFraction = 0.75, className }: SheetProps) {
  const insets = useSafeAreaInsets();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(800);

  useEffect(() => {
    if (open) {
      opacity.value = withTiming(1, { duration: 240, easing: IOS_EASE });
      translateY.value = withTiming(0, { duration: 320, easing: IOS_EASE });
    } else {
      opacity.value = withTiming(0, { duration: 200, easing: IOS_EASE });
      translateY.value = withTiming(800, { duration: 240, easing: IOS_EASE });
    }
  }, [open, opacity, translateY]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View
        style={[{ flex: 1, backgroundColor: "rgba(10,10,10,0.30)" }, overlayStyle]}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          style={[
            {
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingBottom: insets.bottom,
              maxHeight: `${heightFraction * 100}%` as `${number}%`,
            },
            sheetStyle,
          ]}
          className={cn(className)}
        >
          <View className="items-center pt-3">
            <View className="h-1 w-10 rounded-full bg-hairline" />
          </View>
          {children}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export function SheetHeader({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-4 pb-2">
      <View style={{ flex: 1 }}>
        <View>{children}</View>
      </View>
      {onClose ? (
        <Pressable
          onPress={onClose}
          className="h-9 w-9 rounded-full bg-elevated items-center justify-center"
          accessibilityLabel="Close"
        >
          <X size={16} color="#0A0A0A" />
        </Pressable>
      ) : null}
    </View>
  );
}
