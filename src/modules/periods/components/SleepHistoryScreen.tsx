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
import { PeriodLog, SleepEntry, SleepQuality } from "@/shared/types";
import { parseDate } from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";

const QUALITY_META: Record<
  SleepQuality,
  { label: string; emoji: string; color: string; bg: string; text: string }
> = {
  poor: {
    label: "Poor",
    emoji: "😩",
    color: "#ef4444",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  fair: {
    label: "Fair",
    emoji: "😕",
    color: "#f97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  good: {
    label: "Good",
    emoji: "😊",
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
  },
  excellent: {
    label: "Excellent",
    emoji: "🌟",
    color: "#7c3aed",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
};

function formatHours(h: number) {
  const whole = Math.floor(h);
  const minutes = Math.round((h - whole) * 60);
  if (minutes === 0) return `${whole}h`;
  return `${whole}h ${minutes}m`;
}

function formatMonthLabel(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export default function SleepHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const sleepEntries = useMemo(() => {
    return logs
      .filter((l): l is PeriodLog & { sleep: SleepEntry } => Boolean(l.sleep))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const stats = useMemo(() => {
    if (sleepEntries.length === 0) return null;
    const totalHours = sleepEntries.reduce((a, b) => a + b.sleep.hours, 0);
    const avg = totalHours / sleepEntries.length;

    const last7 = sleepEntries.filter((l) => {
      const days =
        (Date.now() - parseDate(l.date).getTime()) / (1000 * 60 * 60 * 24);
      return days <= 7;
    });
    const avg7 =
      last7.length > 0
        ? last7.reduce((a, b) => a + b.sleep.hours, 0) / last7.length
        : avg;

    let best = sleepEntries[0];
    let worst = sleepEntries[0];
    for (const l of sleepEntries) {
      if (l.sleep.hours > best.sleep.hours) best = l;
      if (l.sleep.hours < worst.sleep.hours) worst = l;
    }

    const qualityMap = new Map<SleepQuality, number>();
    for (const l of sleepEntries) {
      qualityMap.set(
        l.sleep.quality,
        (qualityMap.get(l.sleep.quality) ?? 0) + 1,
      );
    }
    const qualityDistribution = Array.from(qualityMap.entries())
      .map(([q, c]) => ({ q, c }))
      .sort((a, b) => b.c - a.c);

    return { avg, avg7, best, worst, qualityDistribution };
  }, [sleepEntries]);

  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; label: string; items: PeriodLog[] }[] =
      [];
    for (const log of sleepEntries) {
      const d = parseDate(log.date);
      const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last && last.monthKey === monthKey) {
        last.items.push(log);
      } else {
        groups.push({
          monthKey,
          label: formatMonthLabel(d),
          items: [log],
        });
      }
    }
    return groups;
  }, [sleepEntries]);

  if (sleepEntries.length === 0) {
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
            <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
              History
            </Text>
          </View>
          <Text className="text-sm font-lexend text-pink-500 mt-2">Sleep</Text>
        </View>
        <View className="px-5 mt-12 items-center">
          <View className="w-20 h-20 rounded-full bg-indigo-100 items-center justify-center">
            <Ionicons name="moon-outline" size={40} color="#6366f1" />
          </View>
          <Text className="text-gray-900 font-lexend-semibold mt-5 text-lg">
            No sleep entries yet
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            Log your sleep from the Home tab to start tracking rest patterns.
          </Text>
        </View>
      </View>
    );
  }

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
        <View className="px-6 pb-6" style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center rounded-full bg-white/60">
              <Ionicons name="chevron-back" size={24} color="#ec4899" />
            </Pressable>
          </View>
          <Text className="text-sm font-lexend text-pink-500 mt-2">Sleep</Text>
          <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
            History
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            {sleepEntries.length} entries
          </Text>
        </View>

        <View className="px-4">
          {stats && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-indigo-100 items-center justify-center mb-2">
                    <Ionicons name="moon" size={20} color="#6366f1" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {formatHours(stats.avg)}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Avg Sleep
                  </Text>
                  <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                    all time
                  </Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-cyan-100 items-center justify-center mb-2">
                    <Ionicons name="calendar" size={20} color="#06b6d4" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {formatHours(stats.avg7)}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Last 7 Days
                  </Text>
                  <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                    recent
                  </Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-emerald-100 items-center justify-center mb-2">
                    <Ionicons name="trending-up" size={20} color="#10b981" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {formatHours(stats.best.sleep.hours)}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Best Night
                  </Text>
                  <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                    longest
                  </Text>
                </View>
              </View>
            </View>
          )}

          {stats && stats.qualityDistribution.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Quality Breakdown
              </Text>
              <View className="gap-2">
                {stats.qualityDistribution.map(({ q, c }) => {
                  const meta = QUALITY_META[q];
                  const pct = Math.round((c / sleepEntries.length) * 100);
                  return (
                    <View key={q} className="flex-row items-center">
                      <Text className="text-xl mr-2 w-7 text-center">
                        {meta.emoji}
                      </Text>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-xs font-lexend-semibold text-gray-700">
                            {meta.label}
                          </Text>
                          <Text className="text-xs font-lexend text-gray-400">
                            {c} · {pct}%
                          </Text>
                        </View>
                        <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <View
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: meta.color,
                            }}
                          />
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {groupedByMonth.map((group) => (
            <View key={group.monthKey} className="mb-5">
              <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1">
                {group.label}
              </Text>
              <View className="gap-2">
                {group.items.map((log) => {
                  if (!log.sleep) return null;
                  const meta = QUALITY_META[log.sleep.quality];
                  const d = parseDate(log.date);
                  return (
                    <View
                      key={log.id}
                      className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-2xl ${meta.bg} items-center justify-center mr-3`}>
                        <Text className="text-2xl">{meta.emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-lexend-semibold text-gray-900">
                            {formatHours(log.sleep.hours)}
                          </Text>
                          <View
                            className={`px-2 py-0.5 rounded-full ${meta.bg}`}>
                            <Text
                              className={`text-[10px] font-lexend-semibold ${meta.text}`}>
                              {meta.label}
                            </Text>
                          </View>
                        </View>
                        <Text className="text-xs font-lexend text-gray-400 mt-0.5">
                          {d.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                        {log.sleep.notes && (
                          <Text
                            className="text-xs font-lexend text-gray-600 mt-2 italic"
                            numberOfLines={3}>
                            “{log.sleep.notes}”
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
