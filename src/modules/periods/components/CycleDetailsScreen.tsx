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
import { useLocalSearchParams, useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import { PeriodLog } from "@/shared/types";
import {
  parseDate,
  daysBetween,
  formatDate,
} from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";

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

const FLOW_META: Record<string, { label: string; color: string }> = {
  light: { label: "Light", color: "#f9a8d4" },
  medium: { label: "Medium", color: "#ec4899" },
  heavy: { label: "Heavy", color: "#be185d" },
};

const CRAMP_SEVERITY_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  none: { label: "No Cramps", color: "#10b981", bg: "bg-emerald-50" },
  mild: { label: "Mild Cramps", color: "#facc15", bg: "bg-amber-50" },
  moderate: { label: "Moderate Cramps", color: "#f97316", bg: "bg-orange-50" },
  severe: { label: "Severe Cramps", color: "#ef4444", bg: "bg-rose-50" },
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

function buildRangeDays(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur.getTime() <= last.getTime()) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export default function CycleDetailsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ start?: string }>();
  const logs = usePeriodStore((s) => s.logs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const cycle = useMemo(() => {
    if (!params.start) return null;
    const start = parseDate(params.start);
    if (Number.isNaN(start.getTime())) return null;

    const periodLogs = logs
      .filter((l) => l.isPeriod)
      .sort((a, b) => a.date.localeCompare(b.date));

    if (periodLogs.length === 0) return null;

    const groups: { start: string; logs: PeriodLog[] }[] = [];
    let current: PeriodLog[] = [periodLogs[0]];
    for (let i = 1; i < periodLogs.length; i++) {
      const diff = daysBetween(
        parseDate(periodLogs[i - 1].date),
        parseDate(periodLogs[i].date),
      );
      if (Math.abs(diff) > 1) {
        groups.push({ start: current[current.length - 1].date, logs: current });
        current = [periodLogs[i]];
      } else {
        current.push(periodLogs[i]);
      }
    }
    if (current.length > 0) {
      groups.push({ start: current[current.length - 1].date, logs: current });
    }

    const idx = groups.findIndex((g) => g.start === params.start);
    if (idx === -1) return null;
    const currentGroup = groups[idx];
    const nextGroup = groups[idx + 1];

    const periodStart = parseDate(
      currentGroup.logs[currentGroup.logs.length - 1].date,
    );
    const periodEnd = parseDate(currentGroup.logs[0].date);
    const periodLength = currentGroup.logs.length;

    const nextPeriodStart = nextGroup
      ? parseDate(nextGroup.logs[nextGroup.logs.length - 1].date)
      : null;
    const cycleEndExclusive = nextPeriodStart ?? new Date();
    const cycleEnd = new Date(cycleEndExclusive);
    cycleEnd.setDate(cycleEnd.getDate() - 1);
    const cycleLength = daysBetween(periodStart, cycleEnd) + 1;

    return {
      periodStart,
      periodEnd,
      cycleStart: periodStart,
      cycleEnd,
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

  const rangeDays = useMemo(() => {
    if (!cycle) return [];
    return buildRangeDays(cycle.cycleStart, cycle.cycleEnd);
  }, [cycle]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, PeriodLog[]>();
    for (const l of cycleLogs) {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    return map;
  }, [cycleLogs]);

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
  const cycleRange = formatDateRange(cycle.cycleStart, cycle.cycleEnd);

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

          {/* Day-by-day timeline */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-lexend-semibold text-gray-900">
                Day by Day
              </Text>
              <Text className="text-xs font-lexend text-gray-400">
                {cycleRange}
              </Text>
            </View>
            <Text className="text-[11px] font-lexend text-gray-400 mb-4">
              Every entry logged during this cycle.
            </Text>
            <View className="gap-3">
              {rangeDays.map((day, i) => {
                const dayStr = formatDate(day);
                const dayLogs = logsByDate.get(dayStr) ?? [];
                const isLast = i === rangeDays.length - 1;
                const inPeriod = dayLogs.some((l) => l.isPeriod);
                const periodLog = dayLogs.find((l) => l.isPeriod);
                const crampLog = dayLogs.find((l) => l.cramps);
                const cravingLog = dayLogs.find((l) => l.cravings);
                const sleepLog = dayLogs.find((l) => l.sleep);
                const moodLog = dayLogs.find((l) => l.mood);
                const flowMeta = periodLog?.flow
                  ? FLOW_META[periodLog.flow]
                  : null;
                const crampMeta = crampLog?.cramps
                  ? CRAMP_SEVERITY_META[crampLog.cramps.severity]
                  : null;
                const cravingMeta = cravingLog?.cravings
                  ? CRAVING_TYPE_META[cravingLog.cravings.type]
                  : null;
                const sleepMeta = sleepLog?.sleep
                  ? SLEEP_QUALITY_META[sleepLog.sleep.quality]
                  : null;
                const dotColor = flowMeta?.color
                  ? flowMeta.color
                  : crampMeta?.color ?? "#e5e7eb";

                return (
                  <View key={dayStr} className="flex-row">
                    <View className="items-center mr-3" style={{ width: 14 }}>
                      <View
                        className="w-3 h-3 rounded-full border-2"
                        style={{
                          backgroundColor: inPeriod ? dotColor : "transparent",
                          borderColor: dotColor,
                        }}
                      />
                      {!isLast && (
                        <View className="w-px flex-1 bg-gray-200 mt-1" />
                      )}
                    </View>
                    <View
                      className={`flex-1 pb-3 ${dayLogs.length === 0 ? "opacity-50" : ""}`}>
                      <View className="flex-row items-center justify-between">
                        <Text className="font-lexend-semibold text-gray-900 text-sm">
                          {day.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </Text>
                        <View className="flex-row items-center gap-1.5">
                          {flowMeta && (
                            <View
                              className="px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: `${flowMeta.color}33`,
                              }}>
                              <Text
                                className="text-[10px] font-lexend-semibold"
                                style={{ color: flowMeta.color }}>
                                {flowMeta.label}
                              </Text>
                            </View>
                          )}
                          {crampMeta && crampLog?.cramps && (
                            <View
                              className={`px-2 py-0.5 rounded-full ${crampMeta.bg}`}>
                              <Text
                                className="text-[10px] font-lexend-semibold"
                                style={{ color: crampMeta.color }}>
                                {crampLog.cramps.severity === "none"
                                  ? "No Cramps"
                                  : `${crampLog.cramps.severity} cramps`}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        {moodLog?.mood && (
                          <Text className="text-xs font-lexend text-gray-600">
                            {MOOD_EMOJI[moodLog.mood]} {moodLog.mood}
                          </Text>
                        )}
                        {sleepMeta && sleepLog?.sleep && (
                          <Text
                            className="text-xs font-lexend"
                            style={{ color: sleepMeta.color }}>
                            {sleepMeta.emoji} {sleepLog.sleep.hours}h ·{" "}
                            {sleepMeta.label}
                          </Text>
                        )}
                        {cravingMeta && cravingLog?.cravings && (
                          <Text className="text-xs font-lexend text-emerald-700">
                            {cravingMeta.emoji} {cravingMeta.label} (
                            {cravingLog.cravings.intensity}/5)
                          </Text>
                        )}
                      </View>

                      {dayLogs.some((l) => l.symptoms.length > 0) && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {Array.from(
                            new Set(
                              dayLogs.flatMap((l) => l.symptoms),
                            ),
                          ).map((s) => {
                            const meta = SYMPTOM_META[s];
                            if (!meta) return null;
                            return (
                              <View
                                key={s}
                                className={`${meta.bg} px-2 py-0.5 rounded-full`}>
                                <Text
                                  className="text-[10px] font-lexend-semibold"
                                  style={{ color: meta.color }}>
                                  {meta.label}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {dayLogs.map((l) =>
                        l.notes ? (
                          <Text
                            key={l.id}
                            className="text-xs font-lexend text-gray-500 mt-1.5 italic"
                            numberOfLines={3}>
                            “{l.notes}”
                          </Text>
                        ) : null,
                      )}

                      {dayLogs.length === 0 && (
                        <Text className="text-[11px] font-lexend text-gray-300 mt-1">
                          No entries
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
