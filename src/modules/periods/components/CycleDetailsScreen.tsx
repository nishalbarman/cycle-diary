import React, { useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import { FlowLevel, PeriodLog } from "@/shared/types";
import {
  parseDate,
  daysBetween,
  formatDate,
  buildPeriodGroups,
} from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import AdNative from "@/shared/components/AdNative";

const FLOW_META: Record<FlowLevel, { label: string; color: string }> = {
  light: { label: "Light", color: "#f9a8d4" },
  medium: { label: "Medium", color: "#ec4899" },
  heavy: { label: "Heavy", color: "#be185d" },
};

const SYMPTOM_META: Record<
  string,
  { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  cramps: { label: "Cramps", icon: "fitness", color: "#f43f5e", bg: "bg-rose-100" },
  headache: { label: "Headache", icon: "alert-circle", color: "#f97316", bg: "bg-orange-100" },
  bloating: { label: "Bloating", icon: "water", color: "#3b82f6", bg: "bg-blue-100" },
  fatigue: { label: "Fatigue", icon: "battery-dead", color: "#8b5cf6", bg: "bg-violet-100" },
  mood_swings: { label: "Mood Swings", icon: "happy", color: "#ec4899", bg: "bg-pink-100" },
  acne: { label: "Acne", icon: "color-palette", color: "#a855f7", bg: "bg-purple-100" },
  breast_tenderness: { label: "Breast Tenderness", icon: "body", color: "#f472b6", bg: "bg-pink-100" },
  backache: { label: "Backache", icon: "body", color: "#6366f1", bg: "bg-indigo-100" },
  nausea: { label: "Nausea", icon: "medkit", color: "#10b981", bg: "bg-emerald-100" },
  cravings: { label: "Cravings", icon: "pizza", color: "#f59e0b", bg: "bg-amber-100" },
  insomnia: { label: "Insomnia", icon: "moon", color: "#0ea5e9", bg: "bg-sky-100" },
};

const MOOD_EMOJI: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  energetic: "⚡",
  anxious: "😰",
  sad: "😢",
  irritated: "😠",
  tired: "😴",
  stressed: "😫",
};

const CRAVING_TYPE_META: Record<string, { label: string; emoji: string }> = {
  sweet: { label: "Sweet", emoji: "🍬" },
  chocolate: { label: "Chocolate", emoji: "🍫" },
  salty: { label: "Salty", emoji: "🥨" },
  carbs: { label: "Carbs", emoji: "🍞" },
  comfort: { label: "Comfort", emoji: "🍲" },
  ice: { label: "Ice", emoji: "🧊" },
  other: { label: "Other", emoji: "🍽️" },
};

const SLEEP_QUALITY_META: Record<
  string,
  { label: string; emoji: string; color: string }
> = {
  poor: { label: "Poor", emoji: "😩", color: "#ef4444" },
  fair: { label: "Fair", emoji: "😕", color: "#f97316" },
  good: { label: "Good", emoji: "😊", color: "#10b981" },
  excellent: { label: "Excellent", emoji: "🌟", color: "#7c3aed" },
};

export default function CycleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ start?: string }>();
  const logs = usePeriodStore((s) => s.logs);
  const removeLog = usePeriodStore((s) => s.removeLog);
  const { refreshing, onRefresh } = usePullToRefresh();

  const cycle = useMemo(() => {
    if (!params.start) return null;

    const groups = buildPeriodGroups(logs);
    const idx = groups.findIndex((g) => g.start === params.start);
    if (idx === -1) return null;

    const currentGroup = groups[idx];
    const nextGroup = groups[idx + 1];

    const periodStart = parseDate(currentGroup.start);
    const periodEnd = parseDate(currentGroup.end);
    const periodLength = currentGroup.periodLength;

    const nextPeriodStart = nextGroup ? parseDate(nextGroup.start) : null;
    const cycleLength = nextPeriodStart
      ? daysBetween(periodStart, nextPeriodStart)
      : 0;

    return {
      periodStart,
      periodEnd,
      cycleStart: periodStart,
      cycleEnd: nextPeriodStart
        ? new Date(nextPeriodStart.getTime() - 86400000)
        : new Date(),
      cycleLength,
      periodLength,
      isOngoing: !nextGroup,
    };
  }, [params.start, logs]);

  const cycleLogs = useMemo(() => {
    if (!cycle) return [];
    const startStr = formatDate(cycle.cycleStart);
    const endStr = formatDate(cycle.cycleEnd);
    return logs
      .filter((l) => l.date >= startStr && l.date <= endStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [cycle, logs]);

  const symptomFrequency = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of cycleLogs) {
      for (const s of l.symptoms) {
        map.set(s, (map.get(s) ?? 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);
  }, [cycleLogs]);

  const moodSummary = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of cycleLogs) {
      if (l.mood) map.set(l.mood, (map.get(l.mood) ?? 0) + 1);
    }
    if (map.size === 0) return null;
    const total = cycleLogs.length || 1;
    return Array.from(map.entries())
      .map(([mood, count]) => ({ mood, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [cycleLogs]);

  const cravingSummary = useMemo(() => {
    const map = new Map<string, { count: number; totalIntensity: number }>();
    for (const l of cycleLogs) {
      if (l.cravings) {
        const cur = map.get(l.cravings.type) ?? { count: 0, totalIntensity: 0 };
        cur.count += 1;
        cur.totalIntensity += l.cravings.intensity;
        map.set(l.cravings.type, cur);
      }
    }
    if (map.size === 0) return null;
    return Array.from(map.entries())
      .map(([type, { count, totalIntensity }]) => ({
        type,
        count,
        avgIntensity: Math.round((totalIntensity / count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
  }, [cycleLogs]);

  const sleepSummary = useMemo(() => {
    const sleepEntries = cycleLogs
      .map((l) => l.sleep)
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (sleepEntries.length === 0) return null;
    const totalHours = sleepEntries.reduce((a, b) => a + b.hours, 0);
    const avgHours = Math.round((totalHours / sleepEntries.length) * 10) / 10;
    const map = new Map<string, number>();
    for (const s of sleepEntries) {
      map.set(s.quality, (map.get(s.quality) ?? 0) + 1);
    }
    const qualities = Array.from(map.entries())
      .map(([q, c]) => ({ q, c }))
      .sort((a, b) => b.c - a.c);
    return { avgHours, count: sleepEntries.length, qualities };
  }, [cycleLogs]);

  const handleDelete = useCallback(
    (log: PeriodLog) => {
      Alert.alert(
        "Delete Entry",
        `Delete entry for ${log.date}? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await removeLog(log.id);
            },
          },
        ],
      );
    },
    [removeLog],
  );

  if (!cycle) {
    return (
      <View className="flex-1 bg-gray-50">
        <View
          className="bg-pink-500 px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center">
              <Ionicons name="chevron-back" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-lexend-bold">
              Cycle Details
            </Text>
            <View className="w-10" />
          </View>
        </View>
        <View className="px-5 mt-10 items-center">
          <Ionicons name="calendar-outline" size={56} color="#d1d5db" />
          <Text className="text-gray-900 font-lexend-semibold mt-4 text-lg">
            Cycle not found
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            This cycle may have been removed or doesn't exist anymore.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="bg-pink-500 px-6 py-3 rounded-full mt-6">
            <Text className="text-white font-lexend-semibold">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const formatDateRange = (start: Date, end: Date) => {
    const sameMonth = start.getMonth() === end.getMonth();
    const sameYear = start.getFullYear() === end.getFullYear();
    if (sameMonth && sameYear) {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
    }
    if (sameYear) {
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const headerRange = formatDateRange(cycle.periodStart, cycle.periodEnd);

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
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ec4899"
            colors={["#ec4899"]}
          />
        }>
        <View
          className="px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center rounded-full bg-white/60">
              <Ionicons name="chevron-back" size={24} color="#ec4899" />
            </Pressable>
            {cycle.isOngoing && (
              <View className="bg-pink-500 px-3 py-1 rounded-full">
                <Text className="text-white text-xs font-lexend-semibold">
                  In Progress
                </Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-lexend text-pink-500 mt-2">
            {cycle.periodStart.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
            })}
          </Text>
          <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
            {headerRange}
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            Period {cycle.periodLength} days · Cycle {cycle.cycleLength} days
          </Text>
        </View>

        <View className="px-4">
          {/* Stats */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row">
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-pink-100 items-center justify-center mb-2">
                  <Ionicons name="calendar" size={20} color="#ec4899" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {cycle.cycleLength}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Cycle Length
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  days
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-rose-100 items-center justify-center mb-2">
                  <Ionicons name="water" size={20} color="#f43f5e" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {cycle.periodLength}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Period Length
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  days
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-purple-100 items-center justify-center mb-2">
                  <Ionicons name="book" size={20} color="#7c3aed" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {cycleLogs.length}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Days Logged
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  entries
                </Text>
              </View>
            </View>
          </View>

          {/* Day-by-day entries */}
          {cycleLogs.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1">
                Daily Entries
              </Text>
              {cycleLogs.map((log) => (
                <View
                  key={log.id}
                  className="bg-white rounded-2xl p-4 shadow-sm mb-2">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      {log.isPeriod && log.flow && (
                        <View
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: FLOW_META[log.flow].color }}
                        />
                      )}
                      <Text className="font-lexend-semibold text-gray-900">
                        {parseDate(log.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </Text>
                      {log.isPeriod && log.flow && (
                        <Text className="text-xs font-lexend text-gray-400">
                          {FLOW_META[log.flow].label}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row items-center gap-2">
                      {log.mood && (
                        <Text className="text-lg">{MOOD_EMOJI[log.mood] ?? "🙂"}</Text>
                      )}
                      <Pressable
                        onPress={() => handleDelete(log)}
                        className="w-8 h-8 rounded-full bg-red-50 items-center justify-center">
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                  {log.symptoms.length > 0 && (
                    <View className="flex-row flex-wrap gap-1.5 mb-2">
                      {log.symptoms.map((s) => {
                        const meta = SYMPTOM_META[s];
                        if (!meta) return null;
                        return (
                          <View
                            key={s}
                            className={`flex-row items-center pl-1.5 pr-2 py-0.5 rounded-full ${meta.bg}`}>
                            <Ionicons name={meta.icon} size={12} color={meta.color} />
                            <Text
                              className="ml-1 text-[10px] font-lexend-semibold"
                              style={{ color: meta.color }}>
                              {meta.label}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  )}
                  {log.cramps && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons name="fitness" size={14} color="#f43f5e" />
                      <Text className="text-xs font-lexend text-rose-600 capitalize">
                        Cramps: {log.cramps.severity}
                        {log.cramps.location ? ` · ${log.cramps.location.replace("_", " ")}` : ""}
                      </Text>
                    </View>
                  )}
                  {log.sleep && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons name="moon" size={14} color="#6366f1" />
                      <Text className="text-xs font-lexend text-indigo-600">
                        Sleep: {log.sleep.hours}h
                        {log.sleep.quality ? ` · ${SLEEP_QUALITY_META[log.sleep.quality]?.label ?? log.sleep.quality}` : ""}
                      </Text>
                    </View>
                  )}
                  {log.cravings && (
                    <View className="flex-row items-center gap-2 mb-1">
                      <Ionicons name="pizza" size={14} color="#10b981" />
                      <Text className="text-xs font-lexend text-emerald-600">
                        Craving: {CRAVING_TYPE_META[log.cravings.type]?.emoji ?? ""} {CRAVING_TYPE_META[log.cravings.type]?.label ?? log.cravings.type}
                        {" · "}Intensity {log.cravings.intensity}/5
                      </Text>
                    </View>
                  )}
                  {log.notes && (
                    <Text className="text-xs font-lexend text-gray-500 mt-1 ml-0.5" numberOfLines={2}>
                      {log.notes}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Sleep + Cravings mini cards */}
          {(sleepSummary || cravingSummary) && (
            <View className="flex-row gap-3 mb-4">
              {sleepSummary && (
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-indigo-100 items-center justify-center">
                      <Ionicons name="moon" size={18} color="#6366f1" />
                    </View>
                    <Text className="ml-2 font-lexend-semibold text-gray-900">
                      Sleep
                    </Text>
                  </View>
                  <Text className="text-2xl font-lexend-bold text-indigo-600">
                    {sleepSummary.avgHours}h
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    avg over {sleepSummary.count} night
                    {sleepSummary.count === 1 ? "" : "s"}
                  </Text>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {sleepSummary.qualities.map(({ q, c }) => {
                      const meta = SLEEP_QUALITY_META[q];
                      if (!meta) return null;
                      return (
                        <View
                          key={q}
                          className="flex-row items-center bg-indigo-50 rounded-full px-2 py-0.5">
                          <Text className="text-xs mr-1">{meta.emoji}</Text>
                          <Text
                            className="text-[10px] font-lexend-semibold"
                            style={{ color: meta.color }}>
                            {c}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
              {cravingSummary && (
                <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm">
                  <View className="flex-row items-center mb-2">
                    <View className="w-9 h-9 rounded-xl bg-emerald-100 items-center justify-center">
                      <Ionicons name="pizza" size={18} color="#10b981" />
                    </View>
                    <Text className="ml-2 font-lexend-semibold text-gray-900">
                      Cravings
                    </Text>
                  </View>
                  <Text className="text-2xl font-lexend-bold text-emerald-600">
                    {cravingSummary.reduce((a, b) => a + b.count, 0)}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    logs this cycle
                  </Text>
                  <View className="flex-row flex-wrap gap-1 mt-2">
                    {cravingSummary.slice(0, 3).map(({ type, count }) => {
                      const meta = CRAVING_TYPE_META[type];
                      if (!meta) return null;
                      return (
                        <View
                          key={type}
                          className="flex-row items-center bg-emerald-50 rounded-full px-2 py-0.5">
                          <Text className="text-xs mr-1">{meta.emoji}</Text>
                          <Text className="text-[10px] font-lexend-semibold text-emerald-700">
                            {count}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Symptoms */}
          {symptomFrequency.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="font-lexend-semibold text-gray-900">
                  Symptoms
                </Text>
                <Text className="text-xs font-lexend text-gray-400">
                  {symptomFrequency.length} unique
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {symptomFrequency.map(({ symptom, count }) => {
                  const meta = SYMPTOM_META[symptom] ?? {
                    label: symptom.replace("_", " "),
                    icon: "ellipsis-horizontal" as const,
                    color: "#9ca3af",
                    bg: "bg-gray-100",
                  };
                  return (
                    <View
                      key={symptom}
                      className={`flex-row items-center pl-2 pr-3 py-1.5 rounded-full ${meta.bg}`}>
                      <Ionicons
                        name={meta.icon}
                        size={14}
                        color={meta.color}
                      />
                      <Text
                        className="ml-1.5 text-xs font-lexend-semibold"
                        style={{ color: meta.color }}>
                        {meta.label}
                      </Text>
                      <View className="ml-2 bg-white/70 rounded-full px-1.5">
                        <Text
                          className="text-[10px] font-lexend-bold"
                          style={{ color: meta.color }}>
                          {count}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Moods */}
          {moodSummary && moodSummary.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Mood Distribution
              </Text>
              <View className="gap-2">
                {moodSummary.map(({ mood, count, pct }) => (
                  <View key={mood} className="flex-row items-center">
                    <Text className="text-xl mr-2 w-7 text-center">
                      {MOOD_EMOJI[mood] ?? "🙂"}
                    </Text>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-lexend-semibold text-gray-700 capitalize">
                          {mood}
                        </Text>
                        <Text className="text-xs font-lexend text-gray-400">
                          {count} {count === 1 ? "day" : "days"} · {pct}%
                        </Text>
                      </View>
                      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <View
                          className="h-full bg-pink-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        <View className="items-center mb-4"><AdNative /></View>
      </ScrollView>
    </View>
  );
}
