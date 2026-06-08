import React from "react";
import { View, Text } from "react-native";

export interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  suffix?: string;
  emptyText?: string;
}

export function BarChart({
  data,
  height = 140,
  color = "#ec4899",
  suffix = "",
  emptyText = "No data yet",
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <View
        className="items-center justify-center bg-gray-50 rounded-xl"
        style={{ height }}>
        <Text className="text-gray-400 font-lexend text-sm">{emptyText}</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={{ height }} className="flex-row items-end justify-between">
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / max) * (height - 30));
        return (
          <View key={`${d.label}-${i}`} className="items-center flex-1 px-1">
            <Text
              className="text-xs font-lexend-semibold text-gray-700 mb-1"
              numberOfLines={1}>
              {d.value}
              {suffix}
            </Text>
            <View
              className="w-full rounded-t-md"
              style={{ height: h, backgroundColor: color, opacity: 0.85 }}
            />
            <Text
              className="text-[10px] font-lexend text-gray-400 mt-1.5"
              numberOfLines={1}>
              {d.sublabel || d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

interface HorizontalBarListProps {
  items: { label: string; value: number; color: string }[];
  emptyText?: string;
}

export function HorizontalBarList({
  items,
  emptyText = "No symptoms logged",
}: HorizontalBarListProps) {
  if (items.length === 0) {
    return (
      <View className="items-center justify-center bg-gray-50 rounded-xl py-6">
        <Text className="text-gray-400 font-lexend text-sm">{emptyText}</Text>
      </View>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <View className="gap-2">
      {items.map((it) => {
        const w = Math.max(8, (it.value / max) * 100);
        return (
          <View key={it.label} className="flex-row items-center">
            <Text
              className="w-28 text-xs font-lexend text-gray-700 capitalize"
              numberOfLines={1}>
              {it.label}
            </Text>
            <View className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${w}%`, backgroundColor: it.color }}
              />
            </View>
            <Text className="ml-2 w-6 text-xs font-lexend-semibold text-gray-700 text-right">
              {it.value}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
