import React from "react";
import { Pressable, View, Text, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

export default function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
  label = "Continue with Google",
}: GoogleSignInButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center bg-white border border-gray-300 rounded-xl py-3 px-6 ${
        disabled || loading ? "opacity-50" : "active:bg-gray-50"
      }`}>
      {loading ? (
        <ActivityIndicator color="#ec4899" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#4285F4" />
          <Text className="ml-2 font-lexend-semibold text-gray-800">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
