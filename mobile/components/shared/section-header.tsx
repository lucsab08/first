import { Text, View } from "react-native";
import { Link, type Href } from "expo-router";

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; href: Href };
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[18px] font-sansSemibold text-ink-primary">{title}</Text>
      {action ? (
        <Link href={action.href} className="text-sm text-ink-secondary">
          {action.label}
        </Link>
      ) : null}
    </View>
  );
}
