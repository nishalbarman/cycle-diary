// src/modules/periods/components/LogPeriodScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import CustomButton from "@/shared/components/CustomButton";
import { useActionInterstitialAd } from "@/shared/hooks/ads/useActionInterstitialAd";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { addLog, selectLogs } from "@/store/logSlice";
import { FlowLevel, MoodType, SymptomType } from "@/shared/types";
import { formatDate } from "@/shared/utils/cycle";
import theme from "@/shared/theme";

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
  const dispatch = useAppDispatch();
  const logs = useAppSelector(selectLogs);
  const actionAd = useActionInterstitialAd();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = formatDate(selectedDate);
  const existingLog = logs.find((l) => l.date === dateStr);

  const [isPeriod, setIsPeriod] = useState(existingLog?.isPeriod ?? true);
  const [flow, setFlow] = useState<FlowLevel | undefined>(existingLog?.flow);
  const [selectedSymptoms, setSelectedSymptoms] = useState<SymptomType[]>(existingLog?.symptoms ?? []);
  const [mood, setMood] = useState<MoodType | undefined>(existingLog?.mood);
  const [water, setWater] = useState(existingLog?.water ?? 0);
  const [notes, setNotes] = useState(existingLog?.notes ?? "");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    const l = logs.find((x) => x.date === formatDate(selectedDate));
    if (l) {
      setIsPeriod(l.isPeriod);
      setFlow(l.flow);
      setSelectedSymptoms(l.symptoms ?? []);
      setMood(l.mood);
      setWater(l.water ?? 0);
      setNotes(l.notes ?? "");
    } else {
      setIsPeriod(true);
      setFlow(undefined);
      setSelectedSymptoms([]);
      setMood(undefined);
      setWater(0);
      setNotes("");
    }
  }, [selectedDate, logs]);

  const toggleSymptom = (s: SymptomType) => {
    setSelectedSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const dateStr = formatDate(selectedDate);
      const result = await dispatch(addLog({
        id: existingLog?.id ?? `${dateStr}-${Date.now()}`,
        date: dateStr,
        flow: isPeriod ? flow : undefined,
        symptoms: selectedSymptoms,
        mood,
        notes: notes.trim() || undefined,
        isPeriod,
        water,
      }));
      if (addLog.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      actionAd.trackAction();
      setSaving(false);
      router.back();
    } catch (e: any) {
      setSaving(false);
      Alert.alert("Save Error", e?.message ?? "Could not save entry");
    }
  };

  const adjustDay = (delta: number) => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + delta));
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} className="flex-1">
        <View className="px-6 pb-6" style={{ backgroundColor: theme.primary, paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-center mb-4">
            <Text className="text-white text-xl font-lexend-bold">Log Entry</Text>
            <View className="w-10" />
          </View>
        </View>

        <View className="px-4 -mt-4">
          {/* Date */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">Date</Text>
            <View className="flex-row items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
              <Pressable onPress={() => adjustDay(-1)}>
                <Ionicons name="chevron-back" size={20} color="#374151" />
              </Pressable>
              <Text className="font-lexend-semibold text-gray-900 text-base">
                {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </Text>
              <Pressable onPress={() => adjustDay(1)}>
                <Ionicons name="chevron-forward" size={20} color="#374151" />
              </Pressable>
            </View>
          </View>

          {/* Type toggle */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">Type</Text>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setIsPeriod(true)} className="flex-1 py-3 rounded-xl items-center" style={{ backgroundColor: isPeriod ? theme.primary : "#f3f4f6" }}>
                <Text className={`font-lexend-semibold ${isPeriod ? "text-white" : "text-gray-600"}`}>Period</Text>
              </Pressable>
              <Pressable onPress={() => { setIsPeriod(false); setFlow(undefined); }} className={`flex-1 py-3 rounded-xl items-center ${!isPeriod ? "bg-purple-500" : "bg-gray-100"}`}>
                <Text className={`font-lexend-semibold ${!isPeriod ? "text-white" : "text-gray-600"}`}>Symptom Only</Text>
              </Pressable>
            </View>
          </View>

          {/* Flow */}
          {isPeriod && (
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <Text className="font-lexend-semibold text-gray-900 mb-3">Flow</Text>
              <View className="flex-row gap-3">
                {FLOW_OPTIONS.map((opt) => (
                  <Pressable key={opt.value} onPress={() => setFlow(flow === opt.value ? undefined : opt.value)}
                    className={`flex-1 py-3 rounded-xl items-center border-2 ${flow === opt.value ? "border-pink-500 bg-pink-50" : "border-gray-100 bg-gray-50"}`}>
                    <View className="w-4 h-4 rounded-full mb-1" style={{ backgroundColor: opt.color }} />
                    <Text className={`text-xs font-lexend-semibold ${flow === opt.value ? "text-pink-700" : "text-gray-600"}`}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {/* Symptoms */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-3">Symptoms</Text>
            <View className="flex-row flex-wrap gap-2">
              {SYMPTOMS.map((s) => {
                const active = selectedSymptoms.includes(s.value);
                return (
                  <Pressable key={s.value} onPress={() => toggleSymptom(s.value)}
                    className={`flex-row items-center px-3 py-2 rounded-full border ${active ? "bg-pink-50 border-pink-300" : "bg-gray-50 border-gray-100"}`}>
                    <Ionicons name={s.icon as any} size={14} color={active ? theme.primary : "#9ca3af"} />
                    <Text className={`ml-1.5 font-lexend text-sm ${active ? "text-pink-700 font-lexend-semibold" : "text-gray-500"}`}>{s.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Mood */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <Text className="font-lexend-semibold text-gray-900 mb-1">Mood</Text>
            <Text className="text-xs font-lexend text-gray-400 mb-3">How are you feeling today?</Text>
            <View className="flex-row flex-wrap gap-2">
              {MOODS.map((m) => {
                const active = mood === m.value;
                return (
                  <Pressable key={m.value} onPress={() => setMood(active ? undefined : m.value)}
                    className={`flex-row items-center pl-2 pr-3 py-2 rounded-full border ${active ? `border-pink-300 ${m.bg}` : "border-gray-100 bg-gray-50"}`}>
                    <Text className="text-base mr-1.5">{m.emoji}</Text>
                    <Text className={`font-lexend text-sm ${active ? "text-gray-900 font-lexend-semibold" : "text-gray-500"}`}>{m.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Water */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-2">
                <Ionicons name="water" size={18} color="#06b6d4" />
                <Text className="font-lexend-semibold text-gray-900">Water Intake</Text>
              </View>
              <Text className="font-lexend-bold text-cyan-600 text-base">{water} glasses</Text>
            </View>
            <View className="flex-row items-center gap-4 mt-2">
              <Pressable
                onPress={() => setWater((w) => Math.max(0, w - 1))}
                className="w-11 h-11 bg-gray-100 rounded-xl items-center justify-center">
                <Ionicons name="remove" size={20} color="#374151" />
              </Pressable>
              <View className="flex-1 bg-cyan-50 rounded-xl py-3 items-center">
                <Text className="font-lexend-semibold text-cyan-700 text-sm">
                  {((water * 250) / 1000).toFixed(1)} Litres
                </Text>
              </View>
              <Pressable
                onPress={() => setWater((w) => Math.min(16, w + 1))}
                className="w-11 h-11 bg-cyan-500 rounded-xl items-center justify-center">
                <Ionicons name="add" size={20} color="#ffffff" />
              </Pressable>
            </View>
          </View>

          {/* Notes */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mb-6">
            <Text className="font-lexend-semibold text-gray-900 mb-3">Notes</Text>
            <TextInput value={notes} onChangeText={setNotes} placeholder="Add notes..." placeholderTextColor="#9ca3af"
              multiline numberOfLines={3} textAlignVertical="top"
              className="bg-gray-50 rounded-xl px-4 py-3 font-lexend text-gray-900 min-h-[80px]" />
          </View>

          <CustomButton title={saving ? "Saving..." : "Save Entry"} onPress={handleSave} size="lg" disabled={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
