// src/modules/periods/components/CalendarScreen.tsx
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectLogs } from "@/store/logSlice";
import { selectSettings, updateSettings } from "@/store/settingsSlice";
import { selectUser } from "@/store/authSlice";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { formatDate, parseDate, predictNextPeriod, getFertileWindow, getPhase, daysBetween, addDays } from "@/shared/utils/cycle";
import CycleRingProgress from "@/modules/periods/components/CycleRingProgress";
import InfoCard from "@/modules/periods/components/InfoCard";
import QuickLogGrid, { QuickLogItem } from "@/modules/periods/components/QuickLogGrid";
import PhaseInsightCard from "@/modules/periods/components/PhaseInsightCard";
import WaterTrackerCard from "@/modules/periods/components/WaterTrackerCard";
import AdNative from "@/shared/components/AdNative";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import theme from "@/shared/theme";

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const logs = useAppSelector(selectLogs);
  const settings = useAppSelector(selectSettings);
  const user = useAppSelector(selectUser);
  const adsEnabled = useAppSelector(selectAdEnabled);

  const { refreshing, onRefresh } = usePullToRefresh();

  const today = new Date();
  const todayStr = formatDate(today);

  const cycleDay = useMemo(() => {
    if (!settings.lastPeriodStart) return 0;
    return Math.max(1, daysBetween(parseDate(settings.lastPeriodStart), today) + 1);
  }, [settings.lastPeriodStart, todayStr]);

  const cycleLength = settings.cycleLength || 28;
  const periodLength = settings.periodLength || 5;
  const progress = Math.min(1, cycleDay / cycleLength);
  const phase = getPhase(cycleDay, periodLength, cycleLength);

  const predicted = useMemo(() => predictNextPeriod(logs, settings), [logs, settings]);
  const daysUntilNext = predicted ? Math.max(0, daysBetween(today, predicted.start)) : null;

  const fertileWindow = useMemo(() => {
    if (!settings.lastPeriodStart) return null;
    return getFertileWindow(parseDate(settings.lastPeriodStart), cycleLength);
  }, [settings.lastPeriodStart, cycleLength]);

  const ovulationDay = useMemo(() => {
    if (!settings.lastPeriodStart) return null;
    return addDays(parseDate(settings.lastPeriodStart), cycleLength - 14);
  }, [settings.lastPeriodStart, cycleLength]);

  const isOverdue = cycleDay > 0 && cycleDay > cycleLength;
  const hasNoData = cycleDay === 0;

  const greetingName = user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const quickLogs: QuickLogItem[] = [
    { icon: "water", label: "Period", tone: "pink", onPress: () => router.push("/(tabs)/log") },
    { icon: "fitness", label: "Cramps", tone: "rose", onPress: () => router.push("/log-cramps") },
    { icon: "moon", label: "Sleep", tone: "blue", onPress: () => router.push("/log-sleep") },
    { icon: "nutrition", label: "Cravings", tone: "green", onPress: () => router.push("/log-cravings") },
  ];

  return (
    <View className="flex-1">
      <LinearGradient colors={theme.gradientHeader as [string, string, ...string[]]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}>
        <View className="px-6 pb-2" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between mb-1">
            <View>
              <Text className="text-sm font-lexend text-pink-500">{today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>
              <Text className="text-2xl font-lexend-bold text-gray-900 mt-0.5">Hi, {greetingName} 👋</Text>
            </View>
            <Pressable onPress={() => router.push("/(tabs)/profile")} className="w-11 h-11 bg-white/70 rounded-full items-center justify-center shadow-sm">
              <Ionicons name="person" size={20} color={theme.primary} />
            </Pressable>
          </View>
        </View>

        <View className="items-center justify-center mt-6 mb-3">
          <CycleRingProgress progress={progress} cycleDay={cycleDay} totalDays={cycleLength} phase={phase} />
          
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className="mt-4 px-4 py-2 bg-white/80 rounded-full flex-row items-center border border-gray-200 shadow-sm active:bg-white">
            <Ionicons name="calendar" size={16} color={theme.primary} />
            <Text className="ml-2 font-lexend-semibold text-xs text-gray-800">
              Last Period: {settings.lastPeriodStart ? parseDate(settings.lastPeriodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Set Date"}
            </Text>
            <Ionicons name="pencil" size={12} color="#6b7280" className="ml-1.5" />
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={settings.lastPeriodStart ? parseDate(settings.lastPeriodStart) : new Date()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) {
                dispatch(updateSettings({ lastPeriodStart: formatDate(d) }));
              }
            }}
          />
        )}

        {isOverdue && (
          <View className="mx-5 mb-4 bg-rose-50 rounded-2xl p-4 flex-row items-center border border-rose-200">
            <View className="w-10 h-10 rounded-xl bg-rose-100 items-center justify-center mr-3">
              <Ionicons name="alert-circle" size={22} color="#e11d48" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-rose-800 text-sm">Period is overdue</Text>
              <Text className="text-xs font-lexend text-rose-600 mt-0.5">{cycleDay - cycleLength} day{cycleDay - cycleLength === 1 ? "" : "s"} past your expected cycle</Text>
            </View>
          </View>
        )}

        {hasNoData && (
          <View className="mx-5 mb-4 bg-purple-50 rounded-2xl p-4 flex-row items-center border border-purple-200">
            <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
              <Ionicons name="calendar" size={22} color="#7c3aed" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-purple-800 text-sm">Start tracking your cycle</Text>
              <Text className="text-xs font-lexend text-purple-600 mt-0.5">Log your first period to see predictions and insights</Text>
            </View>
          </View>
        )}

        <View className="px-5">
          <View className="flex-row gap-3 mb-4">
            <InfoCard icon="calendar" tone="pink" label="Next Period"
              value={predicted ? predicted.start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              sublabel={daysUntilNext === null ? "Log to predict" : daysUntilNext === 0 ? "Expected today" : `In ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}`} />
            <InfoCard icon="leaf" tone="green" label="Fertile Window"
              value={fertileWindow ? fertileWindow.start.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              sublabel={fertileWindow ? `to ${fertileWindow.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Log to predict"} />
            <InfoCard icon="sparkles" tone="purple" label="Ovulation"
              value={ovulationDay ? ovulationDay.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              sublabel={ovulationDay ? `Cycle day ${cycleLength - 14}` : "Log to predict"} />
          </View>

          <PhaseInsightCard phase={phase} />
          <WaterTrackerCard />
        </View>

        <View className="px-5 mt-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-lexend-bold text-gray-900">Quick Log</Text>
          </View>
          <QuickLogGrid items={quickLogs} />
        </View>

        <View className="px-5 mt-6">
          <Pressable onPress={() => router.push("/(tabs)/log")} className="rounded-2xl py-4 px-6 flex-row items-center justify-center shadow-md active:opacity-90" style={{ backgroundColor: theme.primary }}>
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="text-white font-lexend-bold text-base ml-2">Log Today's Entry</Text>
          </Pressable>
        </View>

        {adsEnabled && <View className="items-center mt-4 mb-2 px-5"><AdNative /></View>}
      </ScrollView>
    </View>
  );
}
