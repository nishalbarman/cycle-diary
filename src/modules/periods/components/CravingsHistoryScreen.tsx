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
import { useAppSelector } from "@/store/hooks";
import { selectLogs } from "@/store/logSlice";
import { CravingEntry, CravingType, PeriodLog } from "@/shared/types";
import { parseDate } from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import AdNative from "@/shared/components/AdNative";

const CRAVING_META: Record<
  CravingType,
  { label: string; emoji: string; color: string; bg: string; text: string }
> = {
  sweet: {
    label: "Sweet",
    emoji: "🍬",
    color: "#ec4899",
    bg: "bg-pink-50",
    text: "text-pink-700",
  },
  chocolate: {
    label: "Chocolate",
    emoji: "🍫",
    color: "#d97706",
    bg: "bg-amber-50",
    text: "text-amber-700",
  },
  salty: {
    label: "Salty",
    emoji: "🥨",
    color: "#f97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
  },
  carbs: {
    label: "Carbs",
    emoji: "🍞",
    color: "#ca8a04",
    bg: "bg-yellow-50",
    text: "text-yellow-700",
  },
  comfort: {
    label: "Comfort",
    emoji: "🍲",
    color: "#e11d48",
    bg: "bg-rose-50",
    text: "text-rose-700",
  },
  ice: {
    label: "Ice",
    emoji: "🧊",
    color: "#0891b2",
    bg: "bg-cyan-50",
    text: "text-cyan-700",
  },
  other: {
    label: "Other",
    emoji: "🍽️",
    color: "#7c3aed",
    bg: "bg-violet-50",
    text: "text-violet-700",
  },
};

function formatMonthLabel(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export default function CravingsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = useAppSelector(selectLogs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const cravingEntries = useMemo(() => {
    return logs
      .filter((l): l is PeriodLog & { cravings: CravingEntry } =>
        Boolean(l.cravings),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const stats = useMemo(() => {
    if (cravingEntries.length === 0) return null;
    const map = new Map<
      CravingType,
      { count: number; totalIntensity: number }
    >();
    let totalIntensity = 0;
    for (const l of cravingEntries) {
      if (!l.cravings) continue;
      totalIntensity += l.cravings.intensity;
      const cur = map.get(l.cravings.type) ?? { count: 0, totalIntensity: 0 };
      cur.count += 1;
      cur.totalIntensity += l.cravings.intensity;
      map.set(l.cravings.type, cur);
    }
    const distribution = Array.from(map.entries())
      .map(([type, { count, totalIntensity: ti }]) => ({
        type,
        count,
        pct: Math.round((count / cravingEntries.length) * 100),
        avgIntensity: Math.round((ti / count) * 10) / 10,
      }))
      .sort((a, b) => b.count - a.count);
    return {
      avgIntensity:
        Math.round((totalIntensity / cravingEntries.length) * 10) / 10,
      distribution,
    };
  }, [cravingEntries]);

  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; label: string; items: PeriodLog[] }[] =
      [];
    for (const log of cravingEntries) {
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
  }, [cravingEntries]);

  if (cravingEntries.length === 0) {
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">
            Cravings
          </Text>
        </View>
        <View className="px-5 mt-12 items-center">
          <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center">
            <Ionicons name="pizza-outline" size={40} color="#10b981" />
          </View>
          <Text className="text-gray-900 font-lexend-semibold mt-5 text-lg">
            No cravings logged yet
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            Log your cravings from the Home tab to track patterns over time.
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">
            Cravings
          </Text>
          <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
            History
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            {cravingEntries.length} entries
          </Text>
        </View>

        <View className="px-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row">
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-emerald-100 items-center justify-center mb-2">
                  <Ionicons name="pizza" size={20} color="#10b981" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {cravingEntries.length}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Total
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  logs
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-orange-100 items-center justify-center mb-2">
                  <Ionicons name="flame" size={20} color="#f97316" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {stats?.avgIntensity ?? 0}/5
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Avg Intensity
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  all time
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-pink-100 items-center justify-center mb-2">
                  <Text className="text-2xl">
                    {stats?.distribution[0]
                      ? CRAVING_META[stats.distribution[0].type].emoji
                      : "—"}
                  </Text>
                </View>
                <Text className="text-sm font-lexend-bold text-gray-900">
                  {stats?.distribution[0]
                    ? CRAVING_META[stats.distribution[0].type].label
                    : "—"}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Most Common
                </Text>
              </View>
            </View>
          </View>

          {stats && stats.distribution.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Type Breakdown
              </Text>
              <View className="gap-2">
                {stats.distribution.map(
                  ({ type, count, pct, avgIntensity }) => {
                    const meta = CRAVING_META[type];
                    return (
                      <View key={type} className="flex-row items-center">
                        <Text className="text-xl mr-2 w-7 text-center">
                          {meta.emoji}
                        </Text>
                        <View className="flex-1">
                          <View className="flex-row items-center justify-between mb-1">
                            <Text className="text-xs font-lexend-semibold text-gray-700">
                              {meta.label}
                            </Text>
                            <Text className="text-xs font-lexend text-gray-400">
                              {count} · {pct}% · avg {avgIntensity}/5
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
                  },
                )}
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
                  if (!log.cravings) return null;
                  const meta = CRAVING_META[log.cravings.type];
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
                            {meta.label}
                          </Text>
                          <View className="flex-row items-center">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <View
                                key={n}
                                className={`w-1.5 h-3 rounded-full mx-0.5 ${
                                  n <= log.cravings!.intensity
                                    ? "bg-emerald-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
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
                        {log.cravings.notes && (
                          <Text
                            className="text-xs font-lexend text-gray-600 mt-2 italic"
                            numberOfLines={3}>
                            “{log.cravings.notes}”
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
        <View className="items-center mb-4"><AdNative /></View>
      </ScrollView>
    </View>
  );
}

