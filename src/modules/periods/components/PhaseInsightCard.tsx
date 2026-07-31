import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import theme from "@/shared/theme";

interface PhaseInsightCardProps {
  phase: string;
}

interface PhaseAdvice {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  advice: string;
  nutrition: string;
  activity: string;
  badgeBg: string;
  badgeTextColor: string;
}

const PHASE_ADVICE_MAP: Record<string, PhaseAdvice> = {
  "Menstrual Phase": {
    title: "Menstrual Phase — Rest & Recharge",
    icon: "water",
    advice: "Your hormone levels are at their lowest. Focus on gentle self-care and staying warm.",
    nutrition: "Iron-rich foods, warm teas, and hydration.",
    activity: "Gentle walking, light yoga, or restful sleep.",
    badgeBg: "#fee2e2",
    badgeTextColor: "#dc2626",
  },
  "Follicular Phase": {
    title: "Follicular Phase — Energy Rising",
    icon: "sparkles",
    advice: "Estrogen is rising! Your brain power, focus, and energy are at their monthly peak.",
    nutrition: "Fresh vegetables, lean protein, fermented foods.",
    activity: "HIIT, cardio, learning new skills, brainstorming.",
    badgeBg: "#e0e7ff",
    badgeTextColor: "#4f46e5",
  },
  "Ovulatory Phase": {
    title: "Ovulatory Phase — Peak Confidence",
    icon: "sunny",
    advice: "High fertility and high confidence! You're feeling social, magnetic, and energized.",
    nutrition: "Light grains, berries, fiber-rich veggies.",
    activity: "Social events, high-intensity workouts, group fitness.",
    badgeBg: "#fef3c7",
    badgeTextColor: "#d97706",
  },
  "Luteal Phase": {
    title: "Luteal Phase — Slow Down & Nurture",
    icon: "moon",
    advice: "Progesterone is high. You might feel more introverted or experience mild cravings.",
    nutrition: "Magnesium-rich dark chocolate, sweet potatoes, nuts.",
    activity: "Pilates, moderate weight lifting, relaxing baths.",
    badgeBg: "#f3e8ff",
    badgeTextColor: "#7e22ce",
  },
};

export default function PhaseInsightCard({ phase }: PhaseInsightCardProps) {
  const current = PHASE_ADVICE_MAP[phase] || PHASE_ADVICE_MAP["Follicular Phase"];

  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl items-center justify-center" style={{ backgroundColor: theme.primaryLight }}>
            <Ionicons name={current.icon} size={18} color={theme.primary} />
          </View>
          <Text className="font-lexend-bold text-gray-900 text-sm">{current.title}</Text>
        </View>
      </View>

      <Text className="text-xs font-lexend text-gray-600 leading-5 mb-3">
        {current.advice}
      </Text>

      <View className="flex-row gap-2 pt-2 border-t border-gray-100">
        <View className="flex-1 bg-gray-50 rounded-2xl p-3">
          <Text className="text-[10px] font-lexend-semibold text-gray-400 uppercase mb-1">Nutrition Tip</Text>
          <Text className="text-xs font-lexend text-gray-700">{current.nutrition}</Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-2xl p-3">
          <Text className="text-[10px] font-lexend-semibold text-gray-400 uppercase mb-1">Recommended Activity</Text>
          <Text className="text-xs font-lexend text-gray-700">{current.activity}</Text>
        </View>
      </View>
    </View>
  );
}
