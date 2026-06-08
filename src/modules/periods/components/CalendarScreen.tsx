import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import { useAuthStore } from "@/shared/store/authStore";
import {
  formatDate,
  parseDate,
  predictNextPeriod,
  getFertileWindow,
  daysBetween,
  addDays,
} from "@/shared/utils/cycle";
import CycleRingProgress from "@/modules/periods/components/CycleRingProgress";
import InfoCard from "@/modules/periods/components/InfoCard";
import QuickLogGrid, {
  QuickLogItem,
} from "@/modules/periods/components/QuickLogGrid";
import StorageNoticeModal from "@/shared/components/StorageNoticeModal";
import AdBanner from "@/shared/components/AdBanner";
import { useAdConfigStore } from "@/shared/store/adConfigStore";

function getPhase(cycleDay: number, periodLength: number, cycleLength: number) {
  if (cycleDay <= 0) return "New Cycle";
  if (cycleDay <= periodLength) return "Period";
  if (cycleDay <= periodLength + 5) return "Follicular";
  if (cycleDay >= cycleLength - 16 && cycleDay <= cycleLength - 13)
    return "Ovulation";
  if (cycleDay > cycleLength - 14) return "Luteal";
  return "Follicular";
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const settings = usePeriodStore((s) => s.settings);
  const updateSettings = usePeriodStore((s) => s.updateSettings);
  const hydrate = usePeriodStore((s) => s.hydrate);
  const user = useAuthStore((s) => s.user);
  const adsEnabled = useAdConfigStore((s) => s.isEnabled);

  const [refreshing, setRefreshing] = useState(false);
  const [showStorageNotice, setShowStorageNotice] = useState(
    !settings.hasSeenStorageNotice,
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await hydrate();
    } finally {
      setRefreshing(false);
    }
  }, [hydrate]);

  const dismissStorageNotice = useCallback(() => {
    setShowStorageNotice(false);
    if (!settings.hasSeenStorageNotice) {
      updateSettings({ hasSeenStorageNotice: true });
    }
  }, [settings.hasSeenStorageNotice, updateSettings]);

  const goToSettingsAndExport = useCallback(() => {
    setShowStorageNotice(false);
    if (!settings.hasSeenStorageNotice) {
      updateSettings({ hasSeenStorageNotice: true });
    }
    router.push("/settings");
  }, [router, settings.hasSeenStorageNotice, updateSettings]);

  const today = new Date();
  const todayStr = formatDate(today);

  const cycleDay = useMemo(() => {
    if (!settings.lastPeriodStart) return 0;
    const d = daysBetween(parseDate(settings.lastPeriodStart), today) + 1;
    return Math.max(1, d);
  }, [settings.lastPeriodStart, todayStr]);

  const cycleLength = settings.cycleLength || 28;
  const periodLength = settings.periodLength || 5;
  const progress = Math.min(1, cycleDay / cycleLength);
  const phase = getPhase(cycleDay, periodLength, cycleLength);

  const predicted = useMemo(
    () => predictNextPeriod(logs, settings),
    [logs, settings],
  );

  const daysUntilNext = predicted
    ? Math.max(0, daysBetween(today, predicted.start))
    : null;

  const fertileWindow = useMemo(() => {
    if (!settings.lastPeriodStart) return null;
    return getFertileWindow(parseDate(settings.lastPeriodStart), cycleLength);
  }, [settings.lastPeriodStart, cycleLength]);

  const ovulationDay = useMemo(() => {
    if (!settings.lastPeriodStart) return null;
    return addDays(parseDate(settings.lastPeriodStart), cycleLength - 14);
  }, [settings.lastPeriodStart, cycleLength]);

  const greetingName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";

  const quickLogs: QuickLogItem[] = [
    {
      icon: "water",
      label: "Period",
      tone: "pink",
      onPress: () => router.push("/(tabs)/log"),
    },
    {
      icon: "fitness",
      label: "Cramps",
      tone: "rose",
      onPress: () => router.push("/log-cramps"),
    },
    {
      icon: "moon",
      label: "Sleep",
      tone: "blue",
      onPress: () => router.push("/log-sleep"),
    },
    {
      icon: "nutrition",
      label: "Cravings",
      tone: "green",
      onPress: () => router.push("/log-cravings"),
    },
  ];

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#fdf2f8", "#fce7f3", "#fbcfe8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
            colors={["#ec4899"]}
          />
        }>
        {/* Header */}
        <View className="px-6 pb-2" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between mb-1">
            <View>
              <Text className="text-sm font-lexend text-pink-500">
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
              <Text className="text-2xl font-lexend-bold text-gray-900 mt-0.5">
                Hi, {greetingName} 👋
              </Text>
            </View>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              className="w-11 h-11 bg-white/70 rounded-full items-center justify-center shadow-sm">
              <Ionicons name="person" size={20} color="#ec4899" />
            </Pressable>
          </View>
        </View>

        {/* Cycle ring */}
        <View className="items-center justify-center mt-6 mb-6">
          <CycleRingProgress
            progress={progress}
            cycleDay={cycleDay}
            totalDays={cycleLength}
            phase={phase}
          />
        </View>

        {/* Info cards row */}
        <View className="px-5">
          <View className="flex-row gap-3">
            <InfoCard
              icon="calendar"
              tone="pink"
              label="Next Period"
              value={
                predicted
                  ? predicted.start.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
              sublabel={
                daysUntilNext === null
                  ? "Log to predict"
                  : daysUntilNext === 0
                    ? "Expected today"
                    : `In ${daysUntilNext} day${daysUntilNext === 1 ? "" : "s"}`
              }
            />
            <InfoCard
              icon="leaf"
              tone="green"
              label="Fertile Window"
              value={
                fertileWindow
                  ? fertileWindow.start.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
              sublabel={
                fertileWindow
                  ? `to ${fertileWindow.end.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}`
                  : "Log to predict"
              }
            />
            <InfoCard
              icon="sparkles"
              tone="purple"
              label="Ovulation"
              value={
                ovulationDay
                  ? ovulationDay.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
              sublabel={
                ovulationDay
                  ? `Cycle day ${cycleLength - 14}`
                  : "Log to predict"
              }
            />
          </View>
        </View>

        {/* Quick log */}
        <View className="px-5 mt-8">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-lexend-bold text-gray-900">
              Quick Log
            </Text>
          </View>
          <QuickLogGrid items={quickLogs} />
        </View>

        {/* CTA */}
        <View className="px-5 mt-6">
          <Pressable
            onPress={() => router.push("/(tabs)/log")}
            className="bg-pink-500 rounded-2xl py-4 px-6 flex-row items-center justify-center shadow-md active:bg-pink-600">
            <Ionicons name="add-circle" size={22} color="white" />
            <Text className="text-white font-lexend-bold text-base ml-2">
              Log Today's Entry
            </Text>
          </Pressable>
        </View>

        {/* Banner ad */}
        {adsEnabled && (
          <View className="items-center mt-4 mb-2">
            <AdBanner size="ANCHORED_ADAPTIVE_BANNER" />
          </View>
        )}
      </ScrollView>

      <StorageNoticeModal
        visible={showStorageNotice}
        onDismiss={dismissStorageNotice}
        onExportPress={goToSettingsAndExport}
      />
    </View>
  );
}
