import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface QuickLogItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: "pink" | "purple" | "blue" | "green" | "orange" | "rose";
  onPress: () => void;
}

interface QuickLogGridProps {
  items: QuickLogItem[];
}

const toneStyles: Record<
  QuickLogItem["tone"],
  { bg: string; color: string }
> = {
  pink: { bg: "bg-pink-100", color: "#ec4899" },
  purple: { bg: "bg-purple-100", color: "#7c3aed" },
  blue: { bg: "bg-blue-100", color: "#3b82f6" },
  green: { bg: "bg-emerald-100", color: "#10b981" },
  orange: { bg: "bg-orange-100", color: "#f97316" },
  rose: { bg: "bg-rose-100", color: "#f43f5e" },
};

export default function QuickLogGrid({ items }: QuickLogGridProps) {
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
              className={`w-12 h-12 rounded-2xl ${t.bg} items-center justify-center mb-2`}>
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
