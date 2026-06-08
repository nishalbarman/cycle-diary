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
import { MoodType, PeriodLog } from "@/shared/types";
import { parseDate } from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";

const MOOD_META: Record<
  MoodType,
  { emoji: string; label: string; color: string; bg: string }
> = {
  happy: { emoji: "😊", label: "Happy", color: "#facc15", bg: "bg-amber-100" },
  calm: { emoji: "😌", label: "Calm", color: "#06b6d4", bg: "bg-cyan-100" },
  energetic: {
    emoji: "⚡",
    label: "Energetic",
    color: "#f97316",
    bg: "bg-orange-100",
  },
  anxious: {
    emoji: "😰",
    label: "Anxious",
    color: "#8b5cf6",
    bg: "bg-violet-100",
  },
  sad: { emoji: "😢", label: "Sad", color: "#3b82f6", bg: "bg-blue-100" },
  irritated: {
    emoji: "😠",
    label: "Irritated",
    color: "#ef4444",
    bg: "bg-red-100",
  },
  tired: { emoji: "😴", label: "Tired", color: "#6366f1", bg: "bg-indigo-100" },
  stressed: {
    emoji: "😫",
    label: "Stressed",
    color: "#ec4899",
    bg: "bg-pink-100",
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

export default function MoodHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const moodEntries = useMemo(() => {
    return logs
      .filter((l): l is PeriodLog & { mood: MoodType } => Boolean(l.mood))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const moodDistribution = useMemo(() => {
    const map = new Map<MoodType, number>();
    for (const l of moodEntries) {
      if (l.mood) map.set(l.mood, (map.get(l.mood) ?? 0) + 1);
    }
    const total = moodEntries.length || 1;
    return Array.from(map.entries())
      .map(([mood, count]) => ({
        mood,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [moodEntries]);

  const topMood = moodDistribution[0]?.mood;
  const topMoodMeta = topMood ? MOOD_META[topMood] : null;

  const streaks = useMemo(() => {
    if (moodEntries.length === 0) return 0;
    const dates = new Set(moodEntries.map((l) => l.date));
    let streak = 0;
    const cur = new Date();
    while (true) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      if (dates.has(key)) {
        streak += 1;
        cur.setDate(cur.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }, [moodEntries]);

  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; label: string; items: PeriodLog[] }[] =
      [];
    for (const log of moodEntries) {
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
  }, [moodEntries]);

  if (moodEntries.length === 0) {
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">Mood</Text>
        </View>
        <View className="px-5 mt-12 items-center">
          <View className="w-20 h-20 rounded-full bg-purple-100 items-center justify-center">
            <Ionicons name="happy-outline" size={40} color="#7c3aed" />
          </View>
          <Text className="text-gray-900 font-lexend-semibold mt-5 text-lg">
            No mood entries yet
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            Log how you feel from the Home tab to start tracking your moods.
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">Mood</Text>
          <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
            History
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            {moodEntries.length} entries
          </Text>
        </View>

        <View className="px-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row">
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-purple-100 items-center justify-center mb-2">
                  <Ionicons name="heart" size={20} color="#7c3aed" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {moodEntries.length}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Total
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  entries
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-pink-100 items-center justify-center mb-2">
                  <Text className="text-2xl">{topMoodMeta?.emoji ?? "🙂"}</Text>
                </View>
                <Text className="text-sm font-lexend-bold text-gray-900 capitalize">
                  {topMoodMeta?.label ?? "—"}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Most Common
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="flex-1 items-center">
                <View className="w-11 h-11 rounded-2xl bg-amber-100 items-center justify-center mb-2">
                  <Ionicons name="flame" size={20} color="#f97316" />
                </View>
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {streaks}
                </Text>
                <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                  Day Streak
                </Text>
                <Text className="text-[10px] font-lexend text-gray-300 mt-0.5">
                  consecutive
                </Text>
              </View>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Mood Distribution
            </Text>
            <View className="gap-2">
              {moodDistribution.map(({ mood, count, pct }) => {
                const meta = MOOD_META[mood];
                return (
                  <View key={mood} className="flex-row items-center">
                    <Text className="text-xl mr-2 w-7 text-center">
                      {meta.emoji}
                    </Text>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-xs font-lexend-semibold text-gray-700">
                          {meta.label}
                        </Text>
                        <Text className="text-xs font-lexend text-gray-400">
                          {count} · {pct}%
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

          {groupedByMonth.map((group) => (
            <View key={group.monthKey} className="mb-5">
              <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1">
                {group.label}
              </Text>
              <View className="gap-2">
                {group.items.map((log) => {
                  const meta = log.mood ? MOOD_META[log.mood] : null;
                  if (!meta) return null;
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
                          {log.isPeriod && (
                            <View className="bg-pink-100 px-2 py-0.5 rounded-full">
                              <Text className="text-[10px] font-lexend-semibold text-pink-700">
                                Period day
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="text-xs font-lexend text-gray-400 mt-0.5">
                          {d.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                        {log.notes && (
                          <Text
                            className="text-xs font-lexend text-gray-600 mt-2 italic"
                            numberOfLines={3}>
                            “{log.notes}”
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
