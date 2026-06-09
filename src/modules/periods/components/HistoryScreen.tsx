import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import {
  predictNextPeriod,
  buildPeriodGroups,
  getCompletedCycles,
} from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { HorizontalBarList } from "@/modules/periods/components/Charts";
import AdNative from "@/shared/components/AdNative";
import { useAdConfigStore } from "@/shared/store/adConfigStore";

const SYMPTOM_COLORS: Record<string, string> = {
  cramps: "#f43f5e",
  headache: "#f97316",
  bloating: "#3b82f6",
  fatigue: "#8b5cf6",
  mood_swings: "#ec4899",
  acne: "#a855f7",
  breast_tenderness: "#f472b6",
  backache: "#6366f1",
  nausea: "#10b981",
  cravings: "#f59e0b",
  insomnia: "#0ea5e9",
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const settings = usePeriodStore((s) => s.settings);
  const { refreshing, onRefresh } = usePullToRefresh();
  const adsEnabled = useAdConfigStore((s) => s.isEnabled);

  const periodGroups = useMemo(() => buildPeriodGroups(logs), [logs]);
  const completedCycles = useMemo(() => getCompletedCycles(logs), [logs]);
  const periodLogsCount = useMemo(
    () => logs.filter((l) => l.isPeriod).length,
    [logs],
  );

  const predicted = useMemo(
    () => predictNextPeriod(logs, settings),
    [logs, settings],
  );

  const symptomFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of logs) {
      for (const s of log.symptoms) {
        counts[s] = (counts[s] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([symptom, count]) => ({
        label: symptom.replace("_", " "),
        value: count,
        color: SYMPTOM_COLORS[symptom] ?? "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  const totalSymptoms = symptomFrequency.reduce((a, b) => a + b.value, 0);

  const activityCounts = useMemo(() => {
    return {
      mood: logs.filter((l) => l.mood).length,
      sleep: logs.filter((l) => l.sleep).length,
      cravings: logs.filter((l) => l.cravings).length,
      cramps: logs.filter((l) => l.cramps).length,
    };
  }, [logs]);

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
            colors={["#ec4899"]}
          />
        }>
        <View
          className="bg-pink-500 px-6 pb-8"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-lexend-bold">
              History
            </Text>
            <Pressable
              onPress={() => router.push("/log")}
              className="bg-white/20 rounded-full px-4 py-2 flex-row items-center">
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-lexend-semibold ml-1">Log</Text>
            </Pressable>
          </View>
        </View>

        <View className="px-4 -mt-5">
          {/* Summary cards */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-bold text-gray-900 mb-4">
              Cycle Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {completedCycles.length}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Cycles
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {periodLogsCount}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Period Days
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {settings.cycleLength}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Avg Cycle
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {logs.length}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Total Logs
                </Text>
              </View>
            </View>
          </View>

          {/* Predicted next */}
          {predicted && (
            <View className="bg-purple-50 rounded-2xl p-4 mb-4 flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-purple-100 items-center justify-center mr-3">
                <Ionicons name="sparkles" size={20} color="#7c3aed" />
              </View>
              <View className="flex-1">
                <Text className="font-lexend-semibold text-purple-900 text-sm">
                  Next predicted period
                </Text>
                <Text className="font-lexend text-purple-700 text-xs mt-0.5">
                  {predicted.start.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}

          {/* Symptom summary */}
          {symptomFrequency.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="font-lexend-bold text-gray-900">
                  Symptom Summary
                </Text>
                <Text className="text-xs font-lexend text-gray-400">
                  {totalSymptoms} total
                </Text>
              </View>
              <HorizontalBarList items={symptomFrequency.slice(0, 8)} />
            </View>
          )}

          {/* Cycle History card */}
          <Pressable
            onPress={() => router.push("/cycle-history")}
            className="bg-white rounded-2xl p-5 shadow-sm mb-4 active:bg-gray-50 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-11 h-11 rounded-2xl bg-pink-100 items-center justify-center">
                <Ionicons name="calendar" size={22} color="#ec4899" />
              </View>
              <View>
                <Text className="font-lexend-semibold text-gray-900">
                  Cycle History
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-0.5">
                  {periodLogsCount > 0
                    ? `${periodGroups.length} period group${periodGroups.length === 1 ? "" : "s"}, ${periodLogsCount} day${periodLogsCount === 1 ? "" : "s"} logged`
                    : "No cycles recorded yet"}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </Pressable>

          {/* Activity History */}
          <View className="mt-4 mb-8">
            <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-3 ml-1">
              Activity History
            </Text>
            <View className="flex-row flex-wrap gap-3">
              {(
                [
                  {
                    key: "mood",
                    title: "Mood",
                    count: activityCounts.mood,
                    icon: "happy",
                    bg: "bg-purple-100",
                    color: "#7c3aed",
                    href: "/mood-history",
                  },
                  {
                    key: "sleep",
                    title: "Sleep",
                    count: activityCounts.sleep,
                    icon: "moon",
                    bg: "bg-indigo-100",
                    color: "#6366f1",
                    href: "/sleep-history",
                  },
                  {
                    key: "cramps",
                    title: "Cramps",
                    count: activityCounts.cramps,
                    icon: "fitness",
                    bg: "bg-rose-100",
                    color: "#f43f5e",
                    href: "/cramps-history",
                  },
                  {
                    key: "cravings",
                    title: "Cravings",
                    count: activityCounts.cravings,
                    icon: "pizza",
                    bg: "bg-emerald-100",
                    color: "#10b981",
                    href: "/cravings-history",
                  },
                ] as const
              ).map((it) => (
                <Pressable
                  key={it.key}
                  onPress={() => router.push(it.href as any)}
                  className="flex-1 min-w-[45%] basis-[45%] bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50">
                  <View
                    className={`w-11 h-11 rounded-2xl ${it.bg} items-center justify-center mb-3`}>
                    <Ionicons name={it.icon as any} size={20} color={it.color} />
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-lexend-semibold text-gray-900">
                      {it.title}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={14}
                      color="#9ca3af"
                    />
                  </View>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    {it.count} {it.count === 1 ? "entry" : "entries"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {adsEnabled && (
            <View className="items-center mb-4">
              <AdNative />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
