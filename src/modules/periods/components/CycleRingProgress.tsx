import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import theme from "@/shared/theme";

interface CycleRingProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number;
  cycleDay: number;
  totalDays: number;
  phase: string;
}

export default function CycleRingProgress({
  size = 240,
  strokeWidth = 18,
  progress,
  cycleDay,
  totalDays,
  phase,
}: CycleRingProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const dashOffset = circumference * (1 - clampedProgress);
  const center = size / 2;

  const numDots = Math.max(totalDays, 1);
  const dots = Array.from({ length: numDots }, (_, i) => {
    const angle = (i / numDots) * 2 * Math.PI - Math.PI / 2;
    const cx = center + (radius + strokeWidth / 2 + 14) * Math.cos(angle);
    const cy = center + (radius + strokeWidth / 2 + 14) * Math.sin(angle);
    const filled = i / numDots < clampedProgress;
    return { cx, cy, filled, key: i };
  });

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size}>
        <G>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.primaryLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={theme.primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
          {dots.map((d) => (
            <Circle
              key={d.key}
              cx={d.cx}
              cy={d.cy}
              r={d.filled ? 2.5 : 1.5}
              fill={d.filled ? theme.primary : theme.ringTrack}
              opacity={d.filled ? 0.9 : 0.6}
            />
          ))}
        </G>
      </Svg>
      <View className="absolute items-center justify-center">
        <Text className="text-xs font-lexend-semibold text-pink-500 uppercase tracking-widest">
          {phase}
        </Text>
        <Text className="text-6xl font-lexend-bold text-gray-900 mt-1">
          {cycleDay}
        </Text>
        <Text className="text-sm font-lexend text-gray-400 mt-1">
          of {totalDays} days
        </Text>
      </View>
    </View>
  );
}
