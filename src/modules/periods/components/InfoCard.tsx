import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/shared/theme";

export type InfoCardTone = "pink" | "purple" | "blue" | "green" | "orange";

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  sublabel?: string;
  tone?: InfoCardTone;
  onPress?: () => void;
}

export default function InfoCard({
  icon,
  label,
  value,
  sublabel,
  tone = "pink",
  onPress,
}: InfoCardProps) {
  const toneStyles: Record<
    InfoCardTone,
    { bg: string; iconBgStyle: any; iconColor: string; accent: string }
  > = {
    pink: {
      bg: "bg-pink-50",
      iconBgStyle: { backgroundColor: theme.primaryLight },
      iconColor: theme.primary,
      accent: "text-pink-600",
    },
    purple: {
      bg: "bg-purple-50",
      iconBgStyle: { backgroundColor: "#f3e8ff" },
      iconColor: "#7c3aed",
      accent: "text-purple-600",
    },
    blue: {
      bg: "bg-blue-50",
      iconBgStyle: { backgroundColor: "#dbeafe" },
      iconColor: "#3b82f6",
      accent: "text-blue-600",
    },
    green: {
      bg: "bg-emerald-50",
      iconBgStyle: { backgroundColor: "#d1fae5" },
      iconColor: "#10b981",
      accent: "text-emerald-600",
    },
    orange: {
      bg: "bg-orange-50",
      iconBgStyle: { backgroundColor: "#ffedd5" },
      iconColor: "#f97316",
      accent: "text-orange-600",
    },
  };

  const tone_ = toneStyles[tone];
  const Container: any = onPress ? Pressable : View;

  return (
    <Container
      onPress={onPress}
      className="bg-white rounded-3xl p-4 shadow-sm flex-1">
      <View className="w-10 h-10 rounded-2xl items-center justify-center mb-3" style={tone_.iconBgStyle}>
        <Ionicons name={icon} size={20} color={tone_.iconColor} />
      </View>
      <Text className="text-xs font-lexend text-gray-400 mb-0.5">{label}</Text>
      <Text className={`text-base font-lexend-bold ${tone_.accent}`}>
        {value}
      </Text>
      {sublabel && (
        <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
          {sublabel}
        </Text>
      )}
    </Container>
  );
}
