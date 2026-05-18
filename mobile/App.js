import "./global.css";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-paper">
      <Text className="text-center text-4xl text-ink-primary">
        syncfit
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}
