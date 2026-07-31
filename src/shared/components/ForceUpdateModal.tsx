import React from "react";
import { Modal, View, Text, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/shared/theme";

interface ForceUpdateModalProps {
  visible: boolean;
  latestVersionCode: number;
}

export default function ForceUpdateModal({ visible, latestVersionCode }: ForceUpdateModalProps) {
  if (!visible) return null;

  const handleUpdate = () => {
    // Open Play Store or App Store page
    Linking.openURL("https://play.google.com/store").catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center p-6">
        <View className="bg-white rounded-3xl p-6 w-full items-center shadow-xl border border-gray-100">
          <View className="w-16 h-16 rounded-2xl bg-amber-100 items-center justify-center mb-4">
            <Ionicons name="arrow-up-circle" size={36} color="#d97706" />
          </View>
          <Text className="text-xl font-lexend-bold text-gray-900 text-center mb-2">
            Update Required
          </Text>
          <Text className="text-xs font-lexend text-gray-500 text-center mb-6 leading-5">
            A new version of Cycle Diary ({latestVersionCode}) is available with critical performance improvements and updates. Please update to continue.
          </Text>
          <Pressable
            onPress={handleUpdate}
            className="w-full py-3.5 rounded-2xl items-center shadow-md active:opacity-90"
            style={{ backgroundColor: theme.primary }}>
            <Text className="font-lexend-bold text-white text-base">Update Now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
