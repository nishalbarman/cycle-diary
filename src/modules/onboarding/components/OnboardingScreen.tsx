import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/shared/components/CustomButton";
import { usePeriodStore } from "@/shared/store/periodStore";

type Step = "welcome" | "cycle" | "period" | "last" | "done";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const updateSettings = usePeriodStore((s) => s.updateSettings);
  const settings = usePeriodStore((s) => s.settings);

  const [step, setStep] = useState<Step>("welcome");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodDate, setLastPeriodDate] = useState(new Date());

  const renderStep = () => {
    switch (step) {
        case "welcome":
          return (
            <View className="items-center flex-1 justify-center px-6">
              <View className="w-24 h-24 bg-pink-500 rounded-full items-center justify-center mb-6">
                <Ionicons name="rose" size={44} color="white" />
              </View>
              <Text className="text-3xl font-lexend-bold text-gray-900 text-center mb-3">
                Welcome to Cycle Diary
              </Text>
              <Text className="text-gray-500 font-lexend text-center text-lg leading-6">
                Track your menstrual cycle, predict your next period, and understand your body better.
              </Text>
              <View className="mt-6 flex-row items-center bg-white/80 rounded-2xl px-4 py-3">
                <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
                <Text className="ml-2 text-xs font-lexend text-gray-500 flex-1">
                  This app shows ads. You’ll be asked for consent before any ad
                  loads, and you can change your choices anytime in Settings.
                </Text>
              </View>
              <View className="mt-8">
                <CustomButton
                  title="Get Started"
                  size="lg"
                  onPress={() => setStep("cycle")}
                />
              </View>
            </View>
          );

      case "cycle":
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-lexend-bold text-gray-900 mb-2">
              What's your typical cycle length?
            </Text>
            <Text className="text-gray-500 font-lexend mb-8">
              The average cycle is 28 days, but it can vary from 21 to 35 days.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm items-center">
              <Text className="text-5xl font-lexend-bold text-pink-500 mb-4">
                {cycleLength}
              </Text>
              <Text className="text-gray-400 font-lexend mb-6">days</Text>
              <View className="flex-row items-center gap-6">
                <Pressable
                  onPress={() => setCycleLength(Math.max(18, cycleLength - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                  <Ionicons name="remove" size={24} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setCycleLength(Math.min(45, cycleLength + 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                  <Ionicons name="add" size={24} color="#374151" />
                </Pressable>
              </View>
            </View>
            <View className="mt-8">
              <CustomButton
                title="Next"
                onPress={() => setStep("period")}
              />
            </View>
          </View>
        );

      case "period":
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-lexend-bold text-gray-900 mb-2">
              How long does your period typically last?
            </Text>
            <Text className="text-gray-500 font-lexend mb-8">
              The average period lasts 3 to 7 days.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm items-center">
              <Text className="text-5xl font-lexend-bold text-pink-500 mb-4">
                {periodLength}
              </Text>
              <Text className="text-gray-400 font-lexend mb-6">days</Text>
              <View className="flex-row items-center gap-6">
                <Pressable
                  onPress={() => setPeriodLength(Math.max(1, periodLength - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                  <Ionicons name="remove" size={24} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setPeriodLength(Math.min(10, periodLength + 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center">
                  <Ionicons name="add" size={24} color="#374151" />
                </Pressable>
              </View>
            </View>
            <View className="mt-8">
              <CustomButton
                title="Next"
                onPress={() => setStep("last")}
              />
            </View>
          </View>
        );

      case "last": {
        const y = lastPeriodDate.getFullYear();
        const m = lastPeriodDate.getMonth();
        const d = lastPeriodDate.getDate();
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-lexend-bold text-gray-900 mb-2">
              When did your last period start?
            </Text>
            <Text className="text-gray-500 font-lexend mb-8">
              This helps us predict your next cycle.
            </Text>
            <View className="bg-white rounded-2xl p-6 shadow-sm items-center">
              <Ionicons name="calendar" size={48} color="#ec4899" />
              <Text className="text-xl font-lexend-semibold text-gray-900 mt-4 mb-6">
                {lastPeriodDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <View className="flex-row gap-4">
                <Pressable
                  onPress={() => setLastPeriodDate(new Date(y, m, d - 1))}
                  className="bg-gray-100 px-4 py-3 rounded-xl">
                  <Ionicons name="chevron-back" size={20} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setLastPeriodDate(new Date())}
                  className="bg-gray-100 px-4 py-3 rounded-xl">
                  <Text className="font-lexend text-gray-600">Today</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLastPeriodDate(new Date(y, m, d + 1))}
                  className="bg-gray-100 px-4 py-3 rounded-xl">
                  <Ionicons name="chevron-forward" size={20} color="#374151" />
                </Pressable>
              </View>
            </View>
            <View className="mt-8">
              <CustomButton
                title="Done"
                onPress={() => {
                  updateSettings({
                    cycleLength,
                    periodLength,
                    lastPeriodStart: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                    onboardingComplete: true,
                  });
                  router.replace("/(tabs)");
                }}
              />
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-pink-50" style={{ paddingTop: insets.top }}>
      {/* Progress dots */}
      <View className="flex-row justify-center gap-2 py-4">
        {(["welcome", "cycle", "period", "last"] as const).map((s) => (
          <View
            key={s}
            className={`w-2.5 h-2.5 rounded-full ${
              ["welcome", "cycle", "period", "last"].indexOf(s) <=
              ["welcome", "cycle", "period", "last"].indexOf(step)
                ? "bg-pink-500"
                : "bg-gray-300"
            }`}
          />
        ))}
      </View>
      {renderStep()}
    </View>
  );
}
