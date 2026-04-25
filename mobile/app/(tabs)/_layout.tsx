import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Calendar, Compass, Home, Sparkles, User } from "lucide-react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#1B3A4B",
        tabBarInactiveTintColor: "#9A9A9A",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#ECEAE4",
          height: Platform.OS === "ios" ? 86 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === "ios" ? 28 : 10,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          textTransform: "lowercase",
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: "today",
          tabBarIcon: ({ color, focused }) => (
            <Home size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "discover",
          tabBarIcon: ({ color, focused }) => (
            <Compass size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "calendar",
          tabBarIcon: ({ color, focused }) => (
            <Calendar size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: "coach",
          tabBarIcon: ({ color, focused }) => (
            <Sparkles size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "you",
          tabBarIcon: ({ color, focused }) => (
            <User size={24} color={color} strokeWidth={focused ? 2.25 : 1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
