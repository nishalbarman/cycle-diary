import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLogs, addLog, upsertLogLocal } from "@/store/logSlice";
import { formatDate } from "@/shared/utils/cycle";
import theme from "@/shared/theme";

const GOAL_GLASSES = 8;
const GLASS_VOLUME_ML = 250;

export default function WaterTrackerCard() {
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectLogs);

  const todayStr = formatDate(new Date());
  const todayLog = logs.find((l) => l.date === todayStr);

  const currentWater = todayLog?.water ?? 0;
  const litres = ((currentWater * GLASS_VOLUME_ML) / 1000).toFixed(1);

  const updateWater = (delta: number) => {
    const nextWater = Math.max(0, Math.min(16, currentWater + delta));
    const logItem = {
      id: todayLog?.id ?? `${todayStr}-${Date.now()}`,
      date: todayStr,
      isPeriod: todayLog?.isPeriod ?? false,
      symptoms: todayLog?.symptoms ?? [],
      flow: todayLog?.flow,
      mood: todayLog?.mood,
      notes: todayLog?.notes,
      cramps: todayLog?.cramps,
      cravings: todayLog?.cravings,
      sleep: todayLog?.sleep,
      water: nextWater,
    };
    // 1. Instant synchronous Redux update (0ms latency UI response)
    dispatch(upsertLogLocal(logItem));
    // 2. Async persistence to SQLite & Firebase background
    dispatch(addLog(logItem));
  };

  return (
    <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-cyan-100 items-center justify-center">
            <Ionicons name="water" size={22} color="#06b6d4" />
          </View>
          <View>
            <Text className="font-lexend-bold text-gray-900">Hydration Tracker</Text>
            <Text className="text-xs font-lexend text-gray-400 mt-0.5">
              Goal: {GOAL_GLASSES} glasses (2.0 L)
            </Text>
          </View>
        </View>

        <View className="items-end">
          <Text className="font-lexend-bold text-lg text-cyan-600">
            {currentWater} / {GOAL_GLASSES}
          </Text>
          <Text className="text-[11px] font-lexend text-gray-400">{litres} Litres</Text>
        </View>
      </View>

      {/* Glass icons visual indicator */}
      <View className="flex-row justify-between items-center my-3 px-1">
        {Array.from({ length: GOAL_GLASSES }).map((_, i) => {
          const filled = i < currentWater;
          return (
            <View
              key={i}
              className={`w-6 h-8 rounded-md items-center justify-center ${filled ? "bg-cyan-500" : "bg-gray-100"}`}>
              <Ionicons
                name="water"
                size={14}
                color={filled ? "#ffffff" : "#cbd5e1"}
              />
            </View>
          );
        })}
      </View>

      {/* Buttons */}
      <View className="flex-row gap-3 mt-1">
        <Pressable
          onPress={() => updateWater(-1)}
          disabled={currentWater === 0}
          className={`flex-1 py-2.5 rounded-xl items-center bg-gray-100 ${currentWater === 0 ? "opacity-40" : "active:bg-gray-200"}`}>
          <Text className="font-lexend-semibold text-gray-700 text-xs">- Remove Glass</Text>
        </Pressable>
        <Pressable
          onPress={() => updateWater(1)}
          className="flex-1 py-2.5 rounded-xl items-center bg-cyan-500 active:bg-cyan-600 shadow-sm">
          <Text className="font-lexend-semibold text-white text-xs">+ Drink Glass</Text>
        </Pressable>
      </View>
    </View>
  );
}
