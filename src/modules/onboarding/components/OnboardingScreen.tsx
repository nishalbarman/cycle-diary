import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/shared/components/CustomButton";
import { useAppDispatch } from "@/store/hooks";
import { updateSettings } from "@/store/settingsSlice";
import theme from "@/shared/theme";

type Step = "welcome" | "cycle" | "period" | "last";

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const handleUpdateSettings = (updates: Parameters<typeof updateSettings>[0]) =>
    dispatch(updateSettings(updates));

  const [step, setStep] = useState<Step>("welcome");
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastPeriodDate, setLastPeriodDate] = useState(new Date());

  const STEPS: Step[] = ["welcome", "cycle", "period", "last"];

  const renderStep = () => {
    switch (step) {
      case "welcome":
        return (
          <View className="items-center flex-1 justify-center px-6">
            <View
              className="w-24 h-24 rounded-3xl items-center justify-center mb-6 shadow-md"
              style={{ backgroundColor: theme.primary }}>
              <Ionicons name="rose" size={48} color="white" />
            </View>
            <Text className="text-3xl font-lexend-bold text-gray-900 text-center mb-3">
              Welcome to Cycle Diary
            </Text>
            <Text className="text-gray-500 font-lexend text-center text-base leading-6">
              Track your menstrual cycle, predict your next period & ovulation, log symptoms, and monitor daily hydration & health.
            </Text>

            <View className="mt-6 flex-row items-center bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
              <Ionicons name="sparkles" size={20} color={theme.primary} />
              <Text className="ml-3 text-xs font-lexend text-gray-600 flex-1">
                All features included: Period Predictions, Fertile Window, Daily Hydration, Symptom & Mood Tracking.
              </Text>
            </View>

            <View className="mt-8 w-full">
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
              What's your average cycle length?
            </Text>
            <Text className="text-gray-500 font-lexend mb-8 text-sm">
              The average cycle is 28 days (from the start of one period to the start of the next).
            </Text>

            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
              <Text className="text-5xl font-lexend-bold mb-2" style={{ color: theme.primary }}>
                {cycleLength}
              </Text>
              <Text className="text-gray-400 font-lexend mb-6 text-sm">days</Text>
              <View className="flex-row items-center gap-6">
                <Pressable
                  onPress={() => setCycleLength(Math.max(18, cycleLength - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200">
                  <Ionicons name="remove" size={24} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setCycleLength(Math.min(45, cycleLength + 1))}
                  className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                  style={{ backgroundColor: theme.primary }}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            <View className="mt-8">
              <CustomButton
                title="Next"
                size="lg"
                onPress={() => setStep("period")}
              />
            </View>
          </View>
        );

      case "period":
        return (
          <View className="flex-1 justify-center px-6">
            <Text className="text-2xl font-lexend-bold text-gray-900 mb-2">
              How long does your period last?
            </Text>
            <Text className="text-gray-500 font-lexend mb-8 text-sm">
              The average period duration is between 3 to 7 days.
            </Text>

            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
              <Text className="text-5xl font-lexend-bold mb-2" style={{ color: theme.primary }}>
                {periodLength}
              </Text>
              <Text className="text-gray-400 font-lexend mb-6 text-sm">days</Text>
              <View className="flex-row items-center gap-6">
                <Pressable
                  onPress={() => setPeriodLength(Math.max(1, periodLength - 1))}
                  className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center active:bg-gray-200">
                  <Ionicons name="remove" size={24} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setPeriodLength(Math.min(10, periodLength + 1))}
                  className="w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                  style={{ backgroundColor: theme.primary }}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </Pressable>
              </View>
            </View>

            <View className="mt-8">
              <CustomButton
                title="Next"
                size="lg"
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
            <Text className="text-gray-500 font-lexend mb-8 text-sm">
              This date initializes your prediction calculations.
            </Text>

            <View className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 items-center">
              <View className="w-16 h-16 rounded-2xl items-center justify-center mb-4" style={{ backgroundColor: theme.primaryLight }}>
                <Ionicons name="calendar" size={32} color={theme.primary} />
              </View>
              <Text className="text-lg font-lexend-semibold text-gray-900 text-center mb-6">
                {lastPeriodDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => setLastPeriodDate(new Date(y, m, d - 1))}
                  className="bg-gray-100 px-4 py-3 rounded-xl active:bg-gray-200">
                  <Ionicons name="chevron-back" size={20} color="#374151" />
                </Pressable>
                <Pressable
                  onPress={() => setLastPeriodDate(new Date())}
                  className="bg-gray-100 px-5 py-3 rounded-xl active:bg-gray-200">
                  <Text className="font-lexend-semibold text-gray-700 text-sm">Today</Text>
                </Pressable>
                <Pressable
                  onPress={() => setLastPeriodDate(new Date(y, m, d + 1))}
                  className="bg-gray-100 px-4 py-3 rounded-xl active:bg-gray-200">
                  <Ionicons name="chevron-forward" size={20} color="#374151" />
                </Pressable>
              </View>
            </View>

            <View className="mt-8">
              <CustomButton
                title="Complete Setup"
                size="lg"
                onPress={() => {
                  handleUpdateSettings({
                    cycleLength,
                    periodLength,
                    lastPeriodStart: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
                    symptomTracking: true,
                    flowTracking: true,
                    notificationsEnabled: true,
                    ovulationReminderEnabled: true,
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
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Progress Bar */}
      <View className="flex-row justify-center gap-2 py-4 px-6">
        {STEPS.map((s) => {
          const completed = STEPS.indexOf(s) <= STEPS.indexOf(step);
          return (
            <View
              key={s}
              className="flex-1 h-1.5 rounded-full"
              style={{ backgroundColor: completed ? theme.primary : "#e5e7eb" }}
            />
          );
        })}
      </View>
      {renderStep()}
    </View>
  );
}
