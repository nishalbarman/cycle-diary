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
import { useActionInterstitialAd } from "@/shared/hooks/ads/useActionInterstitialAd";
import { usePeriodStore } from "@/shared/store/periodStore";
import { CrampSeverity } from "@/shared/types";
import { formatDate } from "@/shared/utils/cycle";

const SEVERITY_OPTIONS: {
  label: string;
  value: CrampSeverity;
  color: string;
  bg: string;
  border: string;
  description: string;
}[] = [
  {
    label: "None",
    value: "none",
    color: "#10b981",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    description: "No pain",
  },
  {
    label: "Mild",
    value: "mild",
    color: "#facc15",
    bg: "bg-amber-50",
    border: "border-amber-200",
    description: "Barely noticeable",
  },
  {
    label: "Moderate",
    value: "moderate",
    color: "#f97316",
    bg: "bg-orange-50",
    border: "border-orange-200",
    description: "Distracting, but manageable",
  },
  {
    label: "Severe",
    value: "severe",
    color: "#ef4444",
    bg: "bg-rose-50",
    border: "border-rose-200",
    description: "Hard to function",
  },
];

export default function LogCrampsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const addLog = usePeriodStore((s) => s.addLog);
  const actionAd = useActionInterstitialAd();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [severity, setSeverity] = useState<CrampSeverity>("mild");
  const [location, setLocation] = useState<
    "lower_abdomen" | "back" | "thighs" | "other" | undefined
  >("lower_abdomen");
  const [notes, setNotes] = useState("");

  const adjustDay = (delta: number) => {
    setSelectedDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta),
    );
  };

  const handleSave = async () => {
    const dateStr = formatDate(selectedDate);
    await addLog({
      id: `${dateStr}-cramp-${Date.now()}`,
      date: dateStr,
      symptoms: [],
      isPeriod: false,
      cramps: {
        severity,
        location,
        notes: notes.trim() || undefined,
      },
    });
    actionAd.trackAction();
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
          className="bg-rose-500 px-6 pb-6"
          style={{ paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 -ml-2 items-center justify-center">
              <Ionicons name="close" size={26} color="white" />
            </Pressable>
            <Text className="text-white text-xl font-lexend-bold">
              Log Cramps
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
              Severity
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mb-4">
              How intense is the pain?
            </Text>
            <View className="gap-2">
              {SEVERITY_OPTIONS.map((opt) => {
                const active = severity === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setSeverity(opt.value)}
                    className={`flex-row items-center p-3 rounded-xl border-2 ${
                      active
                        ? `${opt.bg} ${opt.border}`
                        : "border-gray-100 bg-gray-50"
                    }`}>
                    <View
                      className="w-3 h-3 rounded-full mr-3"
                      style={{ backgroundColor: opt.color }}
                    />
                    <View className="flex-1">
                      <Text
                        className={`font-lexend-semibold ${
                          active ? "text-gray-900" : "text-gray-600"
                        }`}>
                        {opt.label}
                      </Text>
                      <Text className="text-xs font-lexend text-gray-400 mt-0.5">
                        {opt.description}
                      </Text>
                    </View>
                    {active && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={opt.color}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">
              Location
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {(
                [
                  { value: "lower_abdomen", label: "Lower Abdomen" },
                  { value: "back", label: "Lower Back" },
                  { value: "thighs", label: "Thighs" },
                  { value: "other", label: "Other" },
                ] as const
              ).map((opt) => {
                const active = location === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() =>
                      setLocation(active ? undefined : opt.value)
                    }
                    className={`px-4 py-2 rounded-full border ${
                      active
                        ? "bg-rose-50 border-rose-300"
                        : "bg-gray-50 border-gray-100"
                    }`}>
                    <Text
                      className={`font-lexend text-sm ${
                        active
                          ? "text-rose-700 font-lexend-semibold"
                          : "text-gray-600"
                      }`}>
                      {opt.label}
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
              placeholder="Anything that helps? Triggers?"
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
            bgVariant="danger"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
