import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { usePeriodStore } from "@/shared/store/periodStore";
import {
  parseDate,
  formatDate,
  predictNextPeriod,
  getFormattedDate,
  daysBetween,
} from "@/shared/utils/cycle";
import weekDay from "@/shared/utils/weekDays";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import AdBanner from "@/shared/components/AdBanner";
import { useAdConfigStore } from "@/shared/store/adConfigStore";

const SYMPTOM_ICONS: Record<string, string> = {
  cramps: "fitness",
  headache: "alert-circle",
  bloating: "water",
  fatigue: "battery-dead",
  mood_swings: "happy",
  acne: "color-palette",
  breast_tenderness: "body",
  backache: "body",
  nausea: "medkit",
  cravings: "pizza",
  insomnia: "moon",
};

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const settings = usePeriodStore((s) => s.settings);
  const { refreshing, onRefresh } = usePullToRefresh();
  const adsEnabled = useAdConfigStore((s) => s.isEnabled);

  const periodLogs = useMemo(
    () =>
      logs
        .filter((l) => l.isPeriod)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [logs],
  );

  const predicted = useMemo(
    () => predictNextPeriod(logs, settings),
    [logs, settings],
  );

  // Group logs into cycles
  const cycles = useMemo(() => {
    if (periodLogs.length === 0) return [];

    const groups: { start: string; logs: typeof periodLogs }[] = [];
    let currentGroup: typeof periodLogs = [periodLogs[0]];

    for (let i = 1; i < periodLogs.length; i++) {
      const diff = daysBetween(
        parseDate(periodLogs[i].date),
        parseDate(periodLogs[i - 1].date),
      );
      if (Math.abs(diff) > 1) {
        groups.push({
          start: currentGroup[currentGroup.length - 1].date,
          logs: [...currentGroup],
        });
        currentGroup = [periodLogs[i]];
      } else {
        currentGroup.push(periodLogs[i]);
      }
    }
    if (currentGroup.length > 0) {
      groups.push({
        start: currentGroup[currentGroup.length - 1].date,
        logs: [...currentGroup],
      });
    }
    return groups;
  }, [periodLogs]);

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
          className="bg-pink-500 px-6 pb-7"
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

        <View className="px-4 -mt-4">
          {/* Summary card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-bold text-gray-900 mb-4">
              Cycle Overview
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {cycles.length}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Cycles
                </Text>
              </View>
              <View className="w-px bg-gray-100" />
              <View className="items-center flex-1">
                <Text className="text-2xl font-lexend-bold text-gray-900">
                  {periodLogs.length}
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-1">
                  Days Logged
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
            </View>
          </View>

          {/* Cycle list */}
          {cycles.length === 0 ? (
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm mb-4">
              <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-900 font-lexend-semibold mt-4">
                No cycles recorded yet
              </Text>
              <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
                Start logging your period to see your cycle history here.
              </Text>
              <Pressable
                onPress={() => router.push("/log")}
                className="bg-pink-500 px-6 py-3 rounded-full mt-5">
                <Text className="text-white font-lexend-semibold">
                  Log Your Period
                </Text>
              </Pressable>
            </View>
          ) : (
            cycles.map((cycle) => {
              const startDate = parseDate(cycle.start);
              const endDate = parseDate(cycle.logs[0].date);
              const length = daysBetween(startDate, endDate) + 1;
              const symptomsInCycle = cycle.logs.flatMap((l) => l.symptoms);
              const uniqueSymptoms = [...new Set(symptomsInCycle)];

              return (
                <Pressable
                  key={cycle.start}
                  onPress={() =>
                    router.push({
                      pathname: "/cycle-details",
                      params: { start: cycle.start },
                    })
                  }
                  className="bg-white rounded-2xl p-5 shadow-sm mb-3 active:bg-gray-50">
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center gap-2">
                      <View className="w-3 h-3 rounded-full bg-pink-500" />
                      <Text className="font-lexend-semibold text-gray-900">
                        {startDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {", "}
                        {/* -{" "} */}
                        {/* {endDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })} */}
                        {weekDay?.[endDate.getDay()]}, {endDate.getFullYear()}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <Text className="font-lexend text-gray-400 text-sm">
                        {length} days
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#9ca3af"
                      />
                    </View>
                  </View>
                  <View className="flex-row gap-1">
                    {uniqueSymptoms.slice(0, 5).map((s) => (
                      <View
                        key={s}
                        className="bg-pink-50 rounded-full px-2.5 py-1">
                        <Text className="text-xs font-lexend text-pink-600 capitalize">
                          {s.replace("_", " ")}
                        </Text>
                      </View>
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
            })
          )}

          {/* Predicted next */}
          {predicted && (
            <View className="bg-purple-50 rounded-2xl p-5 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="sparkles" size={18} color="#7c3aed" />
                <Text className="font-lexend-semibold text-purple-900">
                  Next predicted period
                </Text>
              </View>
              <Text className="font-lexend text-purple-700">
                {predicted.start.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}

          {/* Other histories */}
          <View className="mb-8">
            <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-2">
              Activity History
            </Text>
            {(() => {
              const moodCount = logs.filter((l) => l.mood).length;
              const sleepCount = logs.filter((l) => l.sleep).length;
              const cravingsCount = logs.filter((l) => l.cravings).length;
              const crampsCount = logs.filter((l) => l.cramps).length;

              type Item = {
                key: string;
                title: string;
                count: number;
                icon: keyof typeof Ionicons.glyphMap;
                toneBg: string;
                toneIconBg: string;
                toneIcon: string;
                href: string;
              };

              const items: Item[] = [
                {
                  key: "mood",
                  title: "Mood",
                  count: moodCount,
                  icon: "happy",
                  toneBg: "bg-purple-50",
                  toneIconBg: "bg-purple-100",
                  toneIcon: "#7c3aed",
                  href: "/mood-history",
                },
                {
                  key: "sleep",
                  title: "Sleep",
                  count: sleepCount,
                  icon: "moon",
                  toneBg: "bg-indigo-50",
                  toneIconBg: "bg-indigo-100",
                  toneIcon: "#6366f1",
                  href: "/sleep-history",
                },
                {
                  key: "cravings",
                  title: "Cravings",
                  count: cravingsCount,
                  icon: "pizza",
                  toneBg: "bg-emerald-50",
                  toneIconBg: "bg-emerald-100",
                  toneIcon: "#10b981",
                  href: "/cravings-history",
                },
                {
                  key: "cramps",
                  title: "Cramps",
                  count: crampsCount,
                  icon: "fitness",
                  toneBg: "bg-rose-50",
                  toneIconBg: "bg-rose-100",
                  toneIcon: "#f43f5e",
                  href: "/log-cramps",
                },
              ];

              return (
                <View className="flex-row flex-wrap gap-3">
                  {items.map((it) => (
                    <Pressable
                      key={it.key}
                      onPress={() => router.push(it.href as any)}
                      className="flex-1 min-w-[45%] basis-[45%] bg-white rounded-2xl p-4 shadow-sm active:bg-gray-50">
                      <View
                        className={`w-11 h-11 rounded-2xl ${it.toneIconBg} items-center justify-center mb-3`}>
                        <Ionicons
                          name={it.icon}
                          size={20}
                          color={it.toneIcon}
                        />
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
              );
            })()}
          </View>
        </View>

        {adsEnabled && (
          <View className="items-center mt-2 mb-4">
            <AdBanner size="ANCHORED_ADAPTIVE_BANNER" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}
