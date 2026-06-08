import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface StorageNoticeModalProps {
  visible: boolean;
  onDismiss: () => void;
  onExportPress?: () => void;
}

export default function StorageNoticeModal({
  visible,
  onDismiss,
  onExportPress,
}: StorageNoticeModalProps) {
  const router = useRouter();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent>
      <View style={styles.backdrop}>
        <View className="bg-white rounded-3xl mx-6 p-6 shadow-2xl">
          <View className="items-center mb-4">
            <View className="w-16 h-16 rounded-2xl bg-pink-100 items-center justify-center">
              <Ionicons
                name="shield-checkmark"
                size={32}
                color="#ec4899"
              />
            </View>
          </View>

          <Text className="text-xl font-lexend-bold text-gray-900 text-center">
            Your data stays on this device
          </Text>

          <Text className="text-sm font-lexend text-gray-500 text-center mt-2">
            All your logs and settings are saved locally on your phone.
          </Text>

          <View className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mt-5">
            <View className="flex-row items-start">
              <Ionicons
                name="warning"
                size={18}
                color="#f43f5e"
                style={{ marginTop: 1 }}
              />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-lexend-semibold text-rose-700">
                  Clearing app data or uninstalling the app will permanently
                  delete every entry. There is no cloud backup.
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-3">
            <View className="flex-row items-start">
              <Ionicons
                name="download-outline"
                size={18}
                color="#6366f1"
                style={{ marginTop: 1 }}
              />
              <View className="flex-1 ml-2">
                <Text className="text-xs font-lexend text-indigo-700">
                  You can export all your data to a CSV file from{" "}
                  <Text className="font-lexend-semibold">Settings</Text> at
                  any time to keep a backup.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (onExportPress) {
                onExportPress();
              } else {
                onDismiss();
                router.push("/settings");
              }
            }}
            className="mt-4 bg-gray-100 rounded-2xl py-3 items-center active:bg-gray-200">
            <Text className="font-lexend-semibold text-gray-700 text-sm">
              Open Settings
            </Text>
          </Pressable>

          <Pressable
            onPress={onDismiss}
            className="mt-2 bg-pink-500 rounded-2xl py-3.5 items-center active:bg-pink-600 shadow-sm">
            <Text className="font-lexend-bold text-white text-base">
              Got it
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
});
