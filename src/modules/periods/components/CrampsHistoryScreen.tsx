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
import { PeriodLog, CrampEntry, CrampSeverity } from "@/shared/types";
import { parseDate } from "@/shared/utils/cycle";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import AdNative from "@/shared/components/AdNative";

const SEVERITY_META: Record<
  CrampSeverity,
  { label: string; color: string; bg: string; text: string; icon: string }
> = {
  none: {
    label: "None",
    color: "#10b981",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "checkmark-circle",
  },
  mild: {
    label: "Mild",
    color: "#facc15",
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "pulse",
  },
  moderate: {
    label: "Moderate",
    color: "#f97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: "pulse",
  },
  severe: {
    label: "Severe",
    color: "#ef4444",
    bg: "bg-rose-50",
    text: "text-rose-700",
    icon: "alert-circle",
  },
};

const LOCATION_LABELS: Record<string, string> = {
  lower_abdomen: "Lower Abdomen",
  back: "Back",
  thighs: "Thighs",
  other: "Other",
};

function formatMonthLabel(date: Date): string {
  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  return date.toLocaleDateString("en-US", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

export default function CrampsHistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const logs = usePeriodStore((s) => s.logs);
  const { refreshing, onRefresh } = usePullToRefresh();

  const crampEntries = useMemo(() => {
    return logs
      .filter((l): l is PeriodLog & { cramps: CrampEntry } => Boolean(l.cramps))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs]);

  const stats = useMemo(() => {
    if (crampEntries.length === 0) return null;
    const severityCount: Record<CrampSeverity, number> = {
      none: 0,
      mild: 0,
      moderate: 0,
      severe: 0,
    };
    for (const l of crampEntries) {
      severityCount[l.cramps.severity]++;
    }
    const severityDistribution = (Object.keys(severityCount) as CrampSeverity[])
      .map((s) => ({ s, c: severityCount[s] }))
      .sort((a, b) => b.c - a.c);

    const moderateOrSevere = crampEntries.filter(
      (l) => l.cramps.severity === "moderate" || l.cramps.severity === "severe",
    ).length;

    return { severityDistribution, moderateOrSevere };
  }, [crampEntries]);

  const groupedByMonth = useMemo(() => {
    const groups: { monthKey: string; label: string; items: PeriodLog[] }[] =
      [];
    for (const log of crampEntries) {
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
  }, [crampEntries]);

  if (crampEntries.length === 0) {
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">Cramps</Text>
        </View>
        <View className="px-5 mt-12 items-center">
          <View className="w-20 h-20 rounded-full bg-rose-100 items-center justify-center">
            <Ionicons name="fitness-outline" size={40} color="#f43f5e" />
          </View>
          <Text className="text-gray-900 font-lexend-semibold mt-5 text-lg">
            No cramps entries yet
          </Text>
          <Text className="text-gray-400 font-lexend text-sm mt-2 text-center">
            Log your cramps from the Home tab to start tracking pain patterns.
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
          <Text className="text-sm font-lexend text-pink-500 mt-2">Cramps</Text>
          <Text className="text-3xl font-lexend-bold text-gray-900 mt-1">
            History
          </Text>
          <Text className="text-sm font-lexend text-gray-500 mt-1">
            {crampEntries.length} entries
          </Text>
        </View>

        <View className="px-4">
          {stats && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <View className="flex-row">
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-rose-100 items-center justify-center mb-2">
                    <Ionicons name="fitness" size={20} color="#f43f5e" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {crampEntries.length}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Total Episodes
                  </Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-orange-100 items-center justify-center mb-2">
                    <Ionicons name="trending-up" size={20} color="#f97316" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {stats.moderateOrSevere}
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Moderate/Severe
                  </Text>
                </View>
                <View className="w-px bg-gray-100" />
                <View className="flex-1 items-center">
                  <View className="w-11 h-11 rounded-2xl bg-emerald-100 items-center justify-center mb-2">
                    <Ionicons name="calendar" size={20} color="#10b981" />
                  </View>
                  <Text className="text-2xl font-lexend-bold text-gray-900">
                    {Math.round(
                      (1 -
                        stats.severityDistribution.find((s) => s.s === "none")
                          ?.c! / crampEntries.length) *
                        100,
                    )}
                    %
                  </Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
                    Reported
                  </Text>
                </View>
              </View>
            </View>
          )}

          {stats && stats.severityDistribution.length > 0 && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Severity Breakdown
              </Text>
              <View className="gap-2">
                {stats.severityDistribution.map(({ s, c }) => {
                  const meta = SEVERITY_META[s];
                  const pct = Math.round((c / crampEntries.length) * 100);
                  return (
                    <View key={s} className="flex-row items-center">
                      <View className="w-8 h-8 rounded-lg bg-gray-50 items-center justify-center mr-2">
                        <Ionicons
                          name={meta.icon as any}
                          size={16}
                          color={meta.color}
                        />
                      </View>
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
                  if (!log.cramps) return null;
                  const meta = SEVERITY_META[log.cramps.severity];
                  const d = parseDate(log.date);
                  return (
                    <View
                      key={log.id}
                      className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center">
                      <View
                        className={`w-12 h-12 rounded-2xl ${meta.bg} items-center justify-center mr-3`}>
                        <Ionicons
                          name={meta.icon as any}
                          size={24}
                          color={meta.color}
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                          <Text className="font-lexend-semibold text-gray-900">
                            {meta.label}
                          </Text>
                          <View className={`px-2 py-0.5 rounded-full ${meta.bg}`}>
                            <Text
                              className={`text-[10px] font-lexend-semibold ${meta.text}`}>
                              {log.cramps.location
                                ? LOCATION_LABELS[log.cramps.location] ??
                                  log.cramps.location
                                : "General"}
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
                        {log.cramps.notes && (
                          <Text
                            className="text-xs font-lexend text-gray-600 mt-2 italic"
                            numberOfLines={3}>
                            “{log.cramps.notes}”
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
