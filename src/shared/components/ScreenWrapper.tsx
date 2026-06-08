import React, { ReactNode } from "react";
import { View, StatusBar, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenWrapperProps {
  children: ReactNode;
  className?: string;
  statusBarStyle?: "light-content" | "dark-content";
  statusBarBg?: string;
}

export default function ScreenWrapper({
  children,
  className = "bg-gray-50",
  statusBarStyle = "dark-content",
  statusBarBg = "#f9fafb",
}: ScreenWrapperProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{ paddingTop: Platform.OS === "ios" ? insets.top : insets.top }}
      className={`flex-1 ${className}`}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={statusBarBg} />
      {children}
    </View>
  );
}
