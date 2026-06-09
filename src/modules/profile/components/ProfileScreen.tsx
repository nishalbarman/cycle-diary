import React from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/shared/store/authStore";
import { usePeriodStore } from "@/shared/store/periodStore";
import AdNative from "@/shared/components/AdNative";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const settings = usePeriodStore((s) => s.settings);
  const logs = usePeriodStore((s) => s.logs);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const menuItems = [
    {
      icon: "settings",
      label: "Settings",
      value: "",
      onPress: () => router.push("/settings"),
    },
    {
      icon: "calendar",
      label: "Cycle Length",
      value: `${settings.cycleLength} days`,
      onPress: () => router.push("/settings"),
    },
    {
      icon: "timer",
      label: "Period Length",
      value: `${settings.periodLength} days`,
      onPress: () => router.push("/settings"),
    },
    {
      icon: "notifications",
      label: "Notifications",
      value: settings.notificationsEnabled ? "On" : "Off",
      onPress: () => router.push("/settings"),
    },
    {
      icon: "color-palette",
      label: "Track Symptoms",
      value: settings.symptomTracking ? "On" : "Off",
      onPress: () => router.push("/settings"),
    },
    {
      icon: "water",
      label: "Track Flow",
      value: settings.flowTracking ? "On" : "Off",
      onPress: () => router.push("/settings"),
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View
          className="bg-pink-500 px-6 pb-9"
          style={{ paddingTop: insets.top + 16 }}>
          <Text className="text-white text-2xl font-lexend-bold">Profile</Text>
        </View>

        <View className="px-4 -mt-6">
          {/* User card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center gap-4">
              <View className="w-16 h-16 bg-pink-100 rounded-full items-center justify-center">
                <Ionicons name="person" size={28} color="#ec4899" />
              </View>
              <View>
                <Text className="text-lg font-lexend-bold text-gray-900">
                  {user?.displayName || "User"}
                </Text>
                <Text className="text-gray-400 font-lexend text-sm">
                  {user?.email || ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl font-lexend-bold text-pink-500">
                {logs.length}
              </Text>
              <Text className="text-xs font-lexend text-gray-400 mt-1">
                Entries
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm items-center">
              <Text className="text-2xl font-lexend-bold text-purple-500">
                {settings.cycleLength}
              </Text>
              <Text className="text-xs font-lexend text-gray-400 mt-1">
                Cycle Days
              </Text>
            </View>
          </View>

          {/* Settings */}
          <View className="bg-white rounded-2xl shadow-sm mb-4 overflow-hidden">
            {menuItems.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                className={`flex-row items-center justify-between px-5 py-4 ${
                  i < menuItems.length - 1 ? "border-b border-gray-50" : ""
                }`}>
                <View className="flex-row items-center gap-3">
                  <Ionicons name={item.icon as any} size={20} color="#ec4899" />
                  <Text className="font-lexend text-gray-900">
                    {item.label}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="font-lexend text-gray-400 text-sm">
                    {item.value}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
                </View>
              </Pressable>
            ))}
          </View>

          {/* Sign out */}
          <Pressable
            onPress={handleSignOut}
            className="flex-row items-center justify-center gap-2 bg-white rounded-2xl py-4 shadow-sm mb-8">
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="font-lexend-semibold text-red-500">Sign Out</Text>
          </Pressable>
        </View>
        <View className="items-center mb-4"><AdNative /></View>
      </ScrollView>
    </View>
  );
}
