import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/shared/theme";

export interface QuickLogItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "pink" | "purple" | "blue" | "green" | "orange" | "rose";
  onPress: () => void;
}

interface QuickLogGridProps {
  items: QuickLogItem[];
}

export default function QuickLogGrid({ items }: QuickLogGridProps) {
  const toneStyles: Record<
    QuickLogItem["tone"],
    { style: any; color: string }
  > = {
    pink: { style: { backgroundColor: theme.primaryLight }, color: theme.primary },
    purple: { style: { backgroundColor: "#f3e8ff" }, color: "#7c3aed" },
    blue: { style: { backgroundColor: "#dbeafe" }, color: "#3b82f6" },
    green: { style: { backgroundColor: "#d1fae5" }, color: "#10b981" },
    orange: { style: { backgroundColor: "#ffedd5" }, color: "#f97316" },
    rose: { style: { backgroundColor: "#ffe4e6" }, color: "#f43f5e" },
  };

  return (
    <View className="flex-row flex-wrap gap-3">
      {items.map((item) => {
        const t = toneStyles[item.tone];
        return (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            className="flex-1 min-w-[30%] basis-[30%] bg-white rounded-2xl p-4 items-center shadow-sm active:scale-95">
            <View
              className="w-12 h-12 rounded-2xl items-center justify-center mb-2"
              style={t.style}>
              <Ionicons name={item.icon} size={22} color={t.color} />
            </View>
            <Text className="text-xs font-lexend-semibold text-gray-700 text-center">
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
