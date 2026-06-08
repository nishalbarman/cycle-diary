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
import { CravingType, SymptomType } from "@/shared/types";
import { formatDate } from "@/shared/utils/cycle";

const CRAVING_TYPES: {
  label: string;
  value: CravingType;
  emoji: string;
  bg: string;
  border: string;
  text: string;
}[] = [
  {
    label: "Sweet",
    value: "sweet",
    emoji: "🍬",
    bg: "bg-pink-50",
    border: "border-pink-300",
    text: "text-pink-700",
  },
  {
    label: "Chocolate",
    value: "chocolate",
    emoji: "🍫",
    bg: "bg-amber-50",
    border: "border-amber-300",
    text: "text-amber-700",
  },
  {
    label: "Salty",
    value: "salty",
    emoji: "🥨",
    bg: "bg-orange-50",
    border: "border-orange-300",
    text: "text-orange-700",
  },
  {
    label: "Carbs",
    value: "carbs",
    emoji: "🍞",
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    text: "text-yellow-700",
  },
  {
    label: "Comfort",
    value: "comfort",
    emoji: "🍲",
    bg: "bg-rose-50",
    border: "border-rose-300",
    text: "text-rose-700",
  },
  {
    label: "Ice",
    value: "ice",
    emoji: "🧊",
    bg: "bg-cyan-50",
    border: "border-cyan-300",
    text: "text-cyan-700",
  },
  {
    label: "Other",
    value: "other",
    emoji: "🍽️",
    bg: "bg-violet-50",
    border: "border-violet-300",
    text: "text-violet-700",
  },
];

export default function LogCravingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addLog = usePeriodStore((s) => s.addLog);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [type, setType] = useState<CravingType>("sweet");
  const [intensity, setIntensity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [notes, setNotes] = useState("");

  const adjustDay = (delta: number) => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta),
    );
  };

  const handleSave = () => {
    const dateStr = formatDate(selectedDate);
    addLog({
      id: `${dateStr}-crave-${Date.now()}`,
      date: dateStr,
      symptoms: ["cravings" as SymptomType],
      isPeriod: false,
      cravings: {
        type,
        intensity,
        notes: notes.trim() || undefined,
      },
    });
    router.back();
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
          className="bg-emerald-500 px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center">
              <Ionicons name="close" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-lexend-bold">
              Log Cravings
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
              What are you craving?
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mb-4">
              Pick the closest match.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CRAVING_TYPES.map((opt) => {
                const active = type === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    className={`flex-row items-center pl-3 pr-4 py-2.5 rounded-2xl border ${
                      active
                        ? `${opt.bg} ${opt.border}`
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <Text className="text-xl mr-2">{opt.emoji}</Text>
                    <Text
                      className={`font-lexend text-sm ${
                        active
                          ? `${opt.text} font-lexend-semibold`
                          : "text-gray-600"
                      }`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-lexend-semibold text-gray-900">
                Intensity
              </Text>
              <Text className="font-lexend-bold text-emerald-600 text-lg">
                {intensity}/5
              </Text>
            </View>
            <Text className="text-xs font-lexend text-gray-400 mb-4">
              How strong is the urge?
            </Text>
            <View className="flex-row justify-between gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = intensity === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setIntensity(n as 1 | 2 | 3 | 4 | 5)}
                    className={`flex-1 aspect-square rounded-2xl items-center justify-center border-2 ${
                      active
                        ? "bg-emerald-500 border-emerald-500"
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <Text
                      className={`text-2xl font-lexend-bold ${
                        active ? "text-white" : "text-gray-400"
                      }`}>
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-xs font-lexend text-gray-400">Mild</Text>
              <Text className="text-xs font-lexend text-gray-400">
                Overwhelming
              </Text>
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Notes
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Specific food, context, mood..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3 font-lexend text-gray-900 min-h-[80px]"
            />
          </View>

          <CustomButton
            title="Save Entry"
            onPress={handleSave}
            size="lg"
            bgVariant="greenery"
            className="bg-emerald-500 active:bg-emerald-600"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
