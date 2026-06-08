import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/shared/components/CustomButton";
import { usePeriodStore } from "@/shared/store/periodStore";
import { FlowLevel, MoodType, SymptomType } from "@/shared/types";
import { formatDate } from "@/shared/utils/cycle";

const FLOW_OPTIONS: { label: string; value: FlowLevel; color: string }[] = [
  { label: "Light", value: "light", color: "#f9a8d4" },
  { label: "Medium", value: "medium", color: "#ec4899" },
  { label: "Heavy", value: "heavy", color: "#be185d" },
];

const SYMPTOMS: { label: string; value: SymptomType; icon: string }[] = [
  { label: "Cramps", value: "cramps", icon: "fitness" },
  { label: "Headache", value: "headache", icon: "alert-circle" },
  { label: "Bloating", value: "bloating", icon: "water" },
  { label: "Fatigue", value: "fatigue", icon: "battery-dead" },
  { label: "Mood Swings", value: "mood_swings", icon: "happy" },
  { label: "Acne", value: "acne", icon: "color-palette" },
  { label: "Backache", value: "backache", icon: "body" },
  { label: "Nausea", value: "nausea", icon: "medkit" },
  { label: "Cravings", value: "cravings", icon: "pizza" },
  { label: "Insomnia", value: "insomnia", icon: "moon" },
];

const MOODS: { label: string; value: MoodType; emoji: string; color: string; bg: string }[] = [
  { label: "Happy", value: "happy", emoji: "😊", color: "#facc15", bg: "bg-amber-100" },
  { label: "Calm", value: "calm", emoji: "😌", color: "#06b6d4", bg: "bg-cyan-100" },
  { label: "Energetic", value: "energetic", emoji: "⚡", color: "#f97316", bg: "bg-orange-100" },
  { label: "Anxious", value: "anxious", emoji: "😰", color: "#8b5cf6", bg: "bg-violet-100" },
  { label: "Sad", value: "sad", emoji: "😢", color: "#3b82f6", bg: "bg-blue-100" },
  { label: "Irritated", value: "irritated", emoji: "😠", color: "#ef4444", bg: "bg-red-100" },
  { label: "Tired", value: "tired", emoji: "😴", bg: "bg-indigo-100", color: "#6366f1" },
  { label: "Stressed", value: "stressed", emoji: "😫", color: "#ec4899", bg: "bg-pink-100" },
];

export default function LogPeriodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addLog = usePeriodStore((s) => s.addLog);
  const settings = usePeriodStore((s) => s.settings);
  const updateSettings = usePeriodStore((s) => s.updateSettings);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPeriod, setIsPeriod] = useState(true);
  const [flow, setFlow] = useState<FlowLevel | undefined>();
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>([]);
  const [mood, setMood] = useState<MoodType | undefined>();
  const [notes, setNotes] = useState("");

  const toggleSymptom = (s: SymptomType) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  const handleSave = () => {
    const dateStr = formatDate(selectedDate);
    addLog({
      id: `${dateStr}-${Date.now()}`,
      date: dateStr,
      flow,
      symptoms: selectedSymptoms,
      mood,
      notes: notes.trim() || undefined,
      isPeriod,
    });

    // Auto-set lastPeriodStart if it's the first period logged or earlier
    if (isPeriod) {
      if (
        !settings.lastPeriodStart ||
        dateStr < settings.lastPeriodStart
      ) {
        updateSettings({ lastPeriodStart: dateStr });
      }
    }

    router.back();
  };

  const adjustDay = (delta: number) => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta),
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-gray-50">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        className="flex-1">
        {/* Header */}
        <View
          className="bg-pink-500 px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-center mb-4">
            <Text className="text-white text-xl font-lexend-bold">
              Log Entry
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <View className="px-4 -mt-4">
          {/* Date selector */}
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

          {/* Period toggle */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Type
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setIsPeriod(true)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  isPeriod ? "bg-pink-500" : "bg-gray-100"
                }`}>
                <Text
                  className={`font-lexend-semibold ${
                    isPeriod ? "text-white" : "text-gray-600"
                  }`}>
                  Period
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setIsPeriod(false);
                  setFlow(undefined);
                }}
                className={`flex-1 py-3 rounded-xl items-center ${
                  !isPeriod ? "bg-purple-500" : "bg-gray-100"
                }`}>
                <Text
                  className={`font-lexend-semibold ${
                    !isPeriod ? "text-white" : "text-gray-600"
                  }`}>
                  Symptom Only
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Flow level */}
          {isPeriod && settings.flowTracking && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Flow
              </Text>
              <View className="flex-row gap-3">
                {FLOW_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() =>
                      setFlow(flow === opt.value ? undefined : opt.value)
                    }
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${
                      flow === opt.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-100 bg-gray-50"
                    }`}>
                    <View
                      className="w-4 h-4 rounded-full mb-1"
                      style={{ backgroundColor: opt.color }}
                    />
                    <Text
                      className={`text-xs font-lexend-semibold ${
                        flow === opt.value ? "text-pink-700" : "text-gray-600"
                      }`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Symptoms */}
          {settings.symptomTracking && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">
                Symptoms
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {SYMPTOMS.map((s) => {
                  const active = selectedSymptoms.includes(s.value);
                  return (
                    <Pressable
                      key={s.value}
                      onPress={() => toggleSymptom(s.value)}
                      className={`flex-row items-center px-3 py-2 rounded-full border ${
                        active
                          ? "bg-pink-50 border-pink-300"
                          : "bg-gray-50 border-gray-100"
                      }`}>
                      <Ionicons
                        name={s.icon as any}
                        size={14}
                        color={active ? "#ec4899" : "#9ca3af"}
                      />
                      <Text
                        className={`ml-1.5 font-lexend text-sm ${
                          active
                            ? "text-pink-700 font-lexend-semibold"
                            : "text-gray-500"
                        }`}>
                        {s.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* Mood */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-1">
              Mood
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mb-3">
              How are you feeling today?
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {MOODS.map((m) => {
                const active = mood === m.value;
                return (
                  <Pressable
                    key={m.value}
                    onPress={() => setMood(active ? undefined : m.value)}
                    className={`flex-row items-center pl-2 pr-3 py-2 rounded-full border ${
                      active
                        ? `border-pink-300 ${m.bg}`
                        : "border-gray-100 bg-gray-50"
                    }`}>
                    <Text className="text-base mr-1.5">{m.emoji}</Text>
                    <Text
                      className={`font-lexend text-sm ${
                        active
                          ? "text-gray-900 font-lexend-semibold"
                          : "text-gray-500"
                      }`}>
                      {m.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3 font-lexend text-gray-900 min-h-[80px]"
            />
          </View>

          <CustomButton title="Save Entry" onPress={handleSave} size="lg" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
