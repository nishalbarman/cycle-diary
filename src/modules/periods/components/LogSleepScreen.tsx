import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/shared/components/CustomButton";
import { useActionInterstitialAd } from "@/shared/hooks/ads/useActionInterstitialAd";
import { useAppDispatch } from "@/store/hooks";
import { addLog } from "@/store/logSlice";
import { SleepQuality } from "@/shared/types";
import { formatDate } from "@/shared/utils/cycle";

const QUALITY_OPTIONS: {
  label: string;
  value: SleepQuality;
  emoji: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    label: "Poor",
    value: "poor",
    emoji: "😩",
    description: "Tossed & turned",
    color: "#ef4444",
    bg: "bg-rose-50",
    border: "border-rose-300",
  },
  {
    label: "Fair",
    value: "fair",
    emoji: "😕",
    description: "Some interruptions",
    color: "#f97316",
    bg: "bg-orange-50",
    border: "border-orange-300",
  },
  {
    label: "Good",
    value: "good",
    emoji: "😊",
    description: "Slept well",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
  {
    label: "Excellent",
    value: "excellent",
    emoji: "🌟",
    description: "Refreshed & rested",
    color: "#7c3aed",
    bg: "bg-violet-50",
    border: "border-violet-300",
  },
];

export default function LogSleepScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const actionAd = useActionInterstitialAd();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hours, setHours] = useState(7.5);
  const [quality, setQuality] = useState<SleepQuality>("good");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const adjustDay = (delta: number) => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta),
    );
  };

  const adjustHours = (delta: number) => {
    setHours((prev) => {
      const next = Math.round((prev + delta) * 2) / 2;
      if (next < 0) return 0;
      if (next > 16) return 16;
      return next;
    });
  };

  const formatHours = (h: number) => {
    const whole = Math.floor(h);
    const minutes = Math.round((h - whole) * 60);
    if (minutes === 0) return `${whole}h`;
    return `${whole}h ${minutes}m`;
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const dateStr = formatDate(selectedDate);
      await dispatch(addLog({
        id: `${dateStr}-sleep-${Date.now()}`,
        date: dateStr,
        symptoms: [],
        isPeriod: false,
        sleep: {
          hours,
          quality,
          notes: notes.trim() || undefined,
        },
      }));
      actionAd.trackAction();
      setSaving(false);
      router.back();
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Save Error", e?.message ?? "Could not save entry");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1">
        <View
          className="bg-indigo-500 px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center">
              <Ionicons name="close" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-lexend-bold">
              Log Sleep
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <View className="px-4 -mt-4">
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Date
            </Text>
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <Pressable onPress={() => adjustDay(-1)}>
                <Ionicons name="chevron-back" size={20} color="#374151" />
              </Pressable>
              <Text className="font-lexend-semibold text-gray-900 text-base">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
              <Pressable onPress={() => adjustDay(1)}>
                <Ionicons name="chevron-forward" size={20} color="#374151" />
              </Pressable>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-1">
              Hours Slept
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mb-4">
              How long did you sleep?
            </Text>
            <View className="flex-row items-center justify-center gap-6 py-2">
              <Pressable
                onPress={() => adjustHours(-0.5)}
                className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center active:bg-indigo-100">
                <Ionicons name="remove" size={26} color="#6366f1" />
              </Pressable>
              <View className="items-center min-w-[140px]">
                <Text className="text-5xl font-lexend-bold text-indigo-600">
                  {formatHours(hours)}
                </Text>
              </View>
              <Pressable
                onPress={() => adjustHours(0.5)}
                className="w-12 h-12 rounded-full bg-indigo-50 items-center justify-center active:bg-indigo-100">
                <Ionicons name="add" size={26} color="#6366f1" />
              </Pressable>
            </View>
            <View className="flex-row justify-center gap-2 mt-4 flex-wrap">
              {[6, 7, 8, 9].map((h) => (
                <Pressable
                  key={h}
                  onPress={() => setHours(h)}
                  className={`px-3 py-1.5 rounded-full border ${
                    hours === h
                      ? "bg-indigo-500 border-indigo-500"
                      : "bg-gray-50 border-gray-100"
                  }`}>
                  <Text
                    className={`font-lexend text-xs ${
                      hours === h ? "text-white" : "text-gray-500"
                    }`}>
                    {h}h
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-1">
              Quality
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mb-4">
              How well did you sleep?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {QUALITY_OPTIONS.map((opt) => {
                const active = quality === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setQuality(opt.value)}
                    className={`flex-1 min-w-[45%] p-3 rounded-2xl border-2 items-center ${
                      active
                        ? `${opt.bg} ${opt.border}`
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <Text className="text-3xl mb-1">{opt.emoji}</Text>
                    <Text
                      className={`font-lexend-semibold ${
                        active ? "text-gray-900" : "text-gray-600"
                      }`}>
                      {opt.label}
                    </Text>
                    <Text className="text-[10px] font-lexend text-gray-400 mt-0.5 text-center">
                      {opt.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Disturbances, dreams, energy..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3 font-lexend text-gray-900 min-h-[80px]"
            />
          </View>

          <CustomButton
            title={saving ? "Saving..." : "Save Entry"}
            onPress={handleSave}
            size="lg"
            bgVariant="purple"
            className="bg-indigo-500 active:bg-indigo-600"
            disabled={saving}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


