import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { usePeriodStore } from "@/shared/store/periodStore";
import { formatDate, parseDate } from "@/shared/utils/cycle";
import { requestNotificationPermissions } from "@/shared/services/notifications";
import {
  exportAllToFiles,
  shareExportedFiles,
} from "@/shared/services/exportData";
import {
  unblockThisDevice,
  blockThisDevice,
} from "@/shared/services/ads/fraud";
import {
  fetchAdConfig,
  resetAdConfigCache,
} from "@/shared/services/ads/config";
import {
  showPrivacyOptionsForm,
  resetConsent,
  refreshAdConfig,
} from "@/shared/services/ads";
import { useAdConfigStore } from "@/shared/store/adConfigStore";
import { useAdActivityStore } from "@/shared/store/adActivityStore";
import AdFreeUnlocker from "@/shared/components/AdFreeUnlocker";

interface StepperProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  suffix?: string;
  hint?: string;
  icon: string;
}

function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  hint,
  icon,
}: StepperProps) {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm mb-3">
      <View className="flex-row items-center mb-3">
        <Ionicons name={icon as any} size={20} color="#ec4899" />
        <Text className="font-lexend-semibold text-gray-900 ml-2 flex-1">
          {label}
        </Text>
        <Text className="font-lexend-bold text-pink-500">
          {value}
          {suffix ? ` ${suffix}` : ""}
        </Text>
      </View>
      {hint && (
        <Text className="text-xs font-lexend text-gray-400 mb-3">{hint}</Text>
      )}
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="remove" size={20} color="#374151" />
        </Pressable>
        <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full bg-pink-400 rounded-full"
            style={{
              width: `${Math.min(100, ((value - min) / (max - min)) * 100)}%`,
            }}
          />
        </View>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center">
          <Ionicons name="add" size={20} color="#374151" />
        </Pressable>
      </View>
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: string;
  hint?: string;
}

function ToggleRow({ label, value, onChange, icon, hint }: ToggleRowProps) {
  return (
    <View className="bg-white rounded-2xl p-5 shadow-sm mb-3">
      <View className="flex-row items-center">
        <Ionicons name={icon as any} size={20} color="#ec4899" />
        <View className="flex-1 ml-3">
          <Text className="font-lexend-semibold text-gray-900">{label}</Text>
          {hint && (
            <Text className="text-xs font-lexend text-gray-400 mt-0.5">
              {hint}
            </Text>
          )}
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#e5e7eb", true: "#f9a8d4" }}
          thumbColor={value ? "#ec4899" : "#f3f4f6"}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const settings = usePeriodStore((s) => s.settings);
  const updateSettings = usePeriodStore((s) => s.updateSettings);
  const reset = usePeriodStore((s) => s.reset);
  const logs = usePeriodStore((s) => s.logs);
  const isAdEnabled = useAdConfigStore((s) => s.isEnabled);
  const isUserBlocked = useAdActivityStore((s) => s.isUserBlocked);

  const [showTimePicker, setShowTimePicker] = React.useState(false);
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshingConsent, setRefreshingConsent] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    if (logs.length === 0) {
      Alert.alert(
        "Nothing to export",
        "You don't have any logs yet. Add some entries and try again.",
      );
      return;
    }
    setExporting(true);
    try {
      const files = await exportAllToFiles(logs, settings);
      await shareExportedFiles(files);
    } catch (e: any) {
      Alert.alert(
        "Export failed",
        e?.message ?? "Something went wrong while exporting your data.",
      );
    } finally {
      setExporting(false);
    }
  };

  const handleManageConsent = async () => {
    setRefreshingConsent(true);
    try {
      await showPrivacyOptionsForm();
    } catch (e: any) {
      Alert.alert("Privacy options", e?.message ?? "Could not open the form.");
    } finally {
      setRefreshingConsent(false);
    }
  };

  const handleResetConsent = () => {
    Alert.alert(
      "Reset ad consent?",
      "This clears your current consent choices. You will be asked again on the next ad request.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetConsent();
            } catch {}
          },
        },
      ],
    );
  };

  const lastPeriodDate = useMemo(
    () =>
      settings.lastPeriodStart
        ? parseDate(settings.lastPeriodStart)
        : new Date(),
    [settings.lastPeriodStart],
  );

  const handleNotificationToggle = async (v: boolean) => {
    if (v) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          "Notifications disabled",
          "Please enable notifications in your device settings.",
        );
        return;
      }
    }
    updateSettings({ notificationsEnabled: v });
  };

  const handleReset = () => {
    Alert.alert(
      "Reset all data?",
      "This will delete all logs and settings. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            reset();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View
        className="px-6 pb-6 flex-row items-center"
        style={{ paddingTop: insets.top + 12 }}>
        {/* <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
          <Ionicons name="chevron-back" size={22} color="black" />
        </Pressable> */}
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 bg-white rounded-full items-center justify-center mr-5">
          <Ionicons name="close" size={22} color="black" />
        </Pressable>
        <Text className="text-black text-xl font-lexend-bold">Settings</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}>
        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1">
          Cycle
        </Text>
        <Stepper
          label="Cycle Length"
          value={settings.cycleLength}
          onChange={(n) => updateSettings({ cycleLength: n })}
          min={18}
          max={45}
          suffix="days"
          hint="Average days between periods"
          icon="calendar"
        />
        <Stepper
          label="Period Length"
          value={settings.periodLength}
          onChange={(n) => updateSettings({ periodLength: n })}
          min={1}
          max={10}
          suffix="days"
          hint="How long your period usually lasts"
          icon="timer"
        />

        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="bg-white rounded-2xl p-5 shadow-sm mb-3 flex-row items-center">
          <Ionicons name="calendar" size={20} color="#ec4899" />
          <View className="flex-1 ml-3">
            <Text className="font-lexend-semibold text-gray-900">
              Last Period Start
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mt-0.5">
              Tap to change
            </Text>
          </View>
          <Text className="font-lexend-semibold text-gray-700">
            {lastPeriodDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={lastPeriodDate}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, d) => {
              setShowDatePicker(Platform.OS === "ios");
              if (d) updateSettings({ lastPeriodStart: formatDate(d) });
            }}
          />
        )}

        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-4">
          Tracking
        </Text>
        <ToggleRow
          label="Track Symptoms"
          hint="Show symptom picker when logging"
          icon="color-palette"
          value={settings.symptomTracking}
          onChange={(v) => updateSettings({ symptomTracking: v })}
        />
        <ToggleRow
          label="Track Flow"
          hint="Show flow intensity (light/medium/heavy)"
          icon="water"
          value={settings.flowTracking}
          onChange={(v) => updateSettings({ flowTracking: v })}
        />

        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-4">
          Notifications
        </Text>
        <ToggleRow
          label="Period Reminders"
          hint="Get notified before your next period"
          icon="notifications"
          value={settings.notificationsEnabled}
          onChange={handleNotificationToggle}
        />

        {settings.notificationsEnabled && (
          <>
            <Stepper
              label="Notify Before"
              value={settings.notifyBeforeDays}
              onChange={(n) => updateSettings({ notifyBeforeDays: n })}
              min={0}
              max={7}
              suffix="days"
              hint="Days before predicted start"
              icon="alarm"
            />
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="bg-white rounded-2xl p-5 shadow-sm mb-3 flex-row items-center">
              <Ionicons name="time" size={20} color="#ec4899" />
              <View className="flex-1 ml-3">
                <Text className="font-lexend-semibold text-gray-900">
                  Notify Time
                </Text>
                <Text className="text-xs font-lexend text-gray-400 mt-0.5">
                  Daily reminder time
                </Text>
              </View>
              <Text className="font-lexend-semibold text-gray-700">
                {settings.notifyTime}
              </Text>
            </Pressable>
            {showTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [h, m] = settings.notifyTime.split(":").map(Number);
                  const d = new Date();
                  d.setHours(h, m, 0, 0);
                  return d;
                })()}
                mode="time"
                onChange={(_, d) => {
                  setShowTimePicker(Platform.OS === "ios");
                  if (d) {
                    const h = String(d.getHours()).padStart(2, "0");
                    const m = String(d.getMinutes()).padStart(2, "0");
                    updateSettings({ notifyTime: `${h}:${m}` });
                  }
                }}
              />
            )}
          </>
        )}

        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-4">
          Data & Backup
        </Text>
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-xl bg-pink-100 items-center justify-center mr-3">
              <Ionicons name="shield-checkmark" size={20} color="#ec4899" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-gray-900">
                Local Storage
              </Text>
              <Text className="text-xs font-lexend text-gray-500 mt-1">
                All your data is stored on this device. Clearing app data or
                uninstalling the app will permanently remove every entry — there
                is no cloud backup.
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleExport}
          disabled={exporting}
          className={`bg-white rounded-2xl p-5 shadow-sm mb-3 flex-row items-center ${
            exporting ? "opacity-60" : "active:bg-gray-50"
          }`}>
          <View className="w-10 h-10 rounded-xl bg-indigo-100 items-center justify-center mr-3">
            {exporting ? (
              <Ionicons name="sync" size={20} color="#6366f1" />
            ) : (
              <Ionicons name="download-outline" size={20} color="#6366f1" />
            )}
          </View>
          <View className="flex-1">
            <Text className="font-lexend-semibold text-gray-900">
              {exporting ? "Preparing export…" : "Export Data to CSV"}
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mt-0.5">
              {logs.length} log{logs.length === 1 ? "" : "s"} · saves a CSV +
              JSON backup you can store anywhere
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </Pressable>

        {isAdEnabled && !isUserBlocked && (
          <View className="mb-3">
            <AdFreeUnlocker />
          </View>
        )}

        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-4">
          Privacy & Ads
        </Text>
        <View className="bg-white rounded-2xl p-5 shadow-sm mb-3">
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-xl bg-pink-100 items-center justify-center mr-3">
              <Ionicons name="shield-checkmark" size={20} color="#ec4899" />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-gray-900">
                Ad consent
              </Text>
              <Text className="text-xs font-lexend text-gray-500 mt-1">
                Managed by Google UMP. Your choice is recorded per ad request —
                you can update it at any time.
              </Text>
              <Text className="text-[11px] font-lexend text-gray-400 mt-1">
                EEA, UK, and Brazilian users see a consent screen the first time
                an ad is requested. Ads only run after you give permission.
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2 mt-4">
            <Pressable
              onPress={handleManageConsent}
              disabled={refreshingConsent}
              className="flex-1 bg-pink-50 rounded-xl py-3 items-center active:bg-pink-100">
              <Text className="font-lexend-semibold text-pink-600 text-sm">
                Manage choices
              </Text>
            </Pressable>
            <Pressable
              onPress={handleResetConsent}
              className="flex-1 bg-gray-100 rounded-xl py-3 items-center active:bg-gray-200">
              <Text className="font-lexend-semibold text-gray-700 text-sm">
                Reset consent
              </Text>
            </Pressable>
          </View>
        </View>

        {__DEV__ && (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-3">
            <View className="flex-row items-center mb-2">
              <Ionicons name="bug-outline" size={18} color="#f59e0b" />
              <Text className="ml-2 font-lexend-semibold text-amber-800">
                Anti-fraud tools (dev)
              </Text>
            </View>
            <Text className="text-xs font-lexend text-amber-700 mb-3">
              Simulate blocking this device from ads, or clear the local
              blocklist. Useful for QA of invalid-impression detection.
            </Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => blockThisDevice("manual-dev-block")}
                className="flex-1 bg-amber-200 rounded-xl py-2 items-center">
                <Text className="text-xs font-lexend-semibold text-amber-900">
                  Block this device
                </Text>
              </Pressable>
              <Pressable
                onPress={() => unblockThisDevice()}
                className="flex-1 bg-amber-200 rounded-xl py-2 items-center">
                <Text className="text-xs font-lexend-semibold text-amber-900">
                  Unblock
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        <Text className="text-xs font-lexend-semibold text-gray-400 uppercase mb-2 ml-1 mt-4">
          Danger Zone
        </Text>
        <Pressable
          onPress={handleReset}
          className="bg-white rounded-2xl p-5 shadow-sm mb-3 flex-row items-center">
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <View className="flex-1 ml-3">
            <Text className="font-lexend-semibold text-red-500">
              Reset All Data
            </Text>
            <Text className="text-xs font-lexend text-gray-400 mt-0.5">
              Delete all logs and restart onboarding
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
