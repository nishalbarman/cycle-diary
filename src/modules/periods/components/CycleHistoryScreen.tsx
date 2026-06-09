import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import { FlowLevel } from "@/shared/types";
import {
  parseDate,
  daysBetween,
  buildPeriodGroups,
  getCompletedCycles,
} from "@/shared/utils/cycle";
import weekDay from "@/shared/utils/weekDays";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";

const FLOW_META: Record<FlowLevel, { label: string; color: string }> = {
  light: { label: "Light", color: "#f9a8d4" },
  medium: { label: "Medium", color: "#ec4899" },
  heavy: { label: "Heavy", color: "#be185d" },
};

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

function SymptomBadge({ symptom }: { symptom: string }) {
  const color = SYMPTOM_COLORS[symptom] ?? "#6b7280";
  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}18` }}>
      <Text
        className="text-xs font-lexend capitalize"
        style={{ color }}>
        {symptom.replace("_", " ")}
      </Text>
    </View>
  );
}

export default function CycleHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const groups = useMemo(() => buildPeriodGroups(logs), [logs]);
  const completedCycles = useMemo(() => getCompletedCycles(logs), [logs]);
  const totalPeriodDays = useMemo(
    () => logs.filter((l) => l.isPeriod).length,
    [logs],
  );

  if (totalPeriodDays === 0) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={["#fdf2f8", "#fce7f3", "#fbcfe8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center rounded-full bg-white/60">
              <Ionicons name="chevron-back" size={24} color="#ec4899" />
            </Pressable>
          </View>
          <Text className="text-2xl font-lexend-bold text-gray-900 mt-2">
            Cycle History
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
          <Text className="text-gray-900 font-lexend-semibold text-lg mt-6">
            No cycles recorded yet
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            Start logging your period to see your cycle history here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#fdf2f8", "#fce7f3", "#fbcfe8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
            colors={["#ec4899"]}
          />
        }>
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center rounded-full bg-white/60">
              <Ionicons name="chevron-back" size={24} color="#ec4899" />
            </Pressable>
          </View>
          <Text className="text-2xl font-lexend-bold text-gray-900 mt-2">
            Cycle History
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            {groups.length} period group{groups.length === 1 ? "" : "s"}, {totalPeriodDays} day{totalPeriodDays === 1 ? "" : "s"} logged
          </Text>
        </View>

        <View className="px-4 -mt-3">
          {groups.map((group, idx) => {
            const startDate = parseDate(group.start);
            const endDate = parseDate(group.end);
            const symptomsInGroup = group.logs.flatMap((l) => l.symptoms);
            const uniqueSymptoms = [...new Set(symptomsInGroup)];
            const flowLevels = group.logs
              .map((l) => l.flow)
              .filter((f): f is FlowLevel => Boolean(f));
            const mostCommonFlow =
              flowLevels.length > 0
                ? flowLevels.sort(
                    (a, b) =>
                      flowLevels.filter((f) => f === a).length -
                      flowLevels.filter((f) => f === b).length,
                  )[flowLevels.length - 1]
                : null;
            const hasMood = group.logs.some((l) => l.mood);
            const completedCycle = completedCycles.find(
              (c) => c.startDate === group.start,
            );

            return (
              <Pressable
                key={group.start}
                onPress={() =>
                  router.push({
                    pathname: "/cycle-details",
                    params: { start: group.start },
                  })
                }
                className="bg-white rounded-2xl p-5 shadow-sm mb-3 active:bg-gray-50">
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-pink-500" />
                    <Text className="font-lexend-semibold text-gray-900">
                      {startDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {", "}
                      {weekDay[endDate.getDay()]}, {endDate.getFullYear()}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {mostCommonFlow && (
                      <View
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: FLOW_META[mostCommonFlow].color }}
                      />
                    )}
                    <Text className="font-lexend text-gray-400 text-sm">
                      {group.periodLength} day{group.periodLength === 1 ? "" : "s"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="#9ca3af"
                    />
                  </View>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  {mostCommonFlow && (
                    <View
                      className="rounded-full px-2 py-0.5"
                      style={{
                        backgroundColor: `${FLOW_META[mostCommonFlow].color}18`,
                      }}>
                      <Text
                        className="text-[10px] font-lexend-semibold"
                        style={{ color: FLOW_META[mostCommonFlow].color }}>
                        {FLOW_META[mostCommonFlow].label} flow
                      </Text>
                    </View>
                  )}
                  {completedCycle && (
                    <View className="rounded-full px-2 py-0.5 bg-purple-50">
                      <Text className="text-[10px] font-lexend-semibold text-purple-600">
                        {completedCycle.length} day cycle
                      </Text>
                    </View>
                  )}
                  {!completedCycle && idx === groups.length - 1 && (
                    <View className="rounded-full px-2 py-0.5 bg-gray-100">
                      <Text className="text-[10px] font-lexend-semibold text-gray-500">
                        Ongoing
                      </Text>
                    </View>
                  )}
                  {hasMood && (
                    <View className="rounded-full px-2 py-0.5 bg-amber-50">
                      <Text className="text-[10px] font-lexend-semibold text-amber-600">
                        Mood logged
                      </Text>
                    </View>
                  )}
                </View>
                <View className="flex-row gap-1 flex-wrap">
                  {uniqueSymptoms.slice(0, 5).map((s) => (
                    <SymptomBadge key={s} symptom={s} />
                  ))}
                  {uniqueSymptoms.length > 5 && (
                    <View className="rounded-full px-2.5 py-1">
                      <Text className="text-xs font-lexend text-gray-400">
                        +{uniqueSymptoms.length - 5}
                      </Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
