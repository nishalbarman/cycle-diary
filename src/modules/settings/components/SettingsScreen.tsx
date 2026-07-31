// src/modules/settings/components/SettingsScreen.tsx
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
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { selectSettings, updateSettings } from "@/store/settingsSlice";
import { selectLogs, resetAll, addLog } from "@/store/logSlice";
import { selectUser, signOut } from "@/store/authSlice";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsUserBlocked } from "@/store/adActivitySlice";
import { formatDate, parseDate } from "@/shared/utils/cycle";
import { requestNotificationPermissions } from "@/shared/services/notifications";
import { exportAllToFiles, shareExportedFiles } from "@/shared/services/exportData";
import { showPrivacyOptionsForm, resetConsent } from "@/shared/services/ads";
import AdFreeUnlocker from "@/shared/components/AdFreeUnlocker";
import theme from "@/shared/theme";

interface SectionHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center mb-3 mt-4 ml-1">
      {icon && <View className="w-7 h-7 rounded-lg items-center justify-center mr-2.5" style={{ backgroundColor: theme.primaryLight }}>
        <Ionicons name={icon} size={16} color={theme.primary} />
      </View>}
      <View>
        <Text className="text-xs font-lexend-bold text-gray-900 uppercase tracking-wider">{title}</Text>
        {subtitle && <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">{subtitle}</Text>}
      </View>
    </View>
  );
}

interface StepperProps {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  suffix?: string;
  hint?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

function Stepper({ label, value, onChange, min, max, suffix, hint, icon }: StepperProps) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center flex-1 mr-2">
          <View className="w-8 h-8 rounded-xl bg-gray-50 items-center justify-center mr-3">
            <Ionicons name={icon} size={18} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-lexend-semibold text-gray-900 text-sm">{label}</Text>
            {hint && <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">{hint}</Text>}
          </View>
        </View>
        <View className="px-3 py-1 rounded-xl" style={{ backgroundColor: theme.primaryLight }}>
          <Text className="font-lexend-bold text-sm" style={{ color: theme.primary }}>
            {value}{suffix ? ` ${suffix}` : ""}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center gap-3 mt-2">
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={`w-9 h-9 bg-gray-100 rounded-xl items-center justify-center ${value <= min ? "opacity-40" : "active:bg-gray-200"}`}>
          <Ionicons name="remove" size={18} color="#374151" />
        </Pressable>
        <View className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: theme.primary,
              width: `${Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))}%`,
            }}
          />
        </View>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={`w-9 h-9 rounded-xl items-center justify-center ${value >= max ? "opacity-40" : "active:opacity-80"}`}
          style={{ backgroundColor: theme.primary }}>
          <Ionicons name="add" size={18} color="#ffffff" />
        </Pressable>
      </View>
    </View>
  );
}

interface ToggleRowProps {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: keyof typeof Ionicons.glyphMap;
  hint?: string;
}

function ToggleRow({ label, value, onChange, icon, hint }: ToggleRowProps) {
  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-8 h-8 rounded-xl bg-gray-50 items-center justify-center mr-3">
            <Ionicons name={icon} size={18} color={theme.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-lexend-semibold text-gray-900 text-sm">{label}</Text>
            {hint && <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">{hint}</Text>}
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ false: "#e5e7eb", true: theme.primaryLight }}
          thumbColor={value ? theme.primary : "#f3f4f6"}
        />
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const logs = useAppSelector(selectLogs);
  const isAdEnabled = useAppSelector(selectAdEnabled);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);

  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showPillTimePicker, setShowPillTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [refreshingConsent, setRefreshingConsent] = useState(false);

  const handleExport = async () => {
    if (exporting) return;
    if (logs.length === 0) {
      Alert.alert("Nothing to export", "You don't have any logs yet. Add some entries and try again.");
      return;
    }
    setExporting(true);
    try {
      const files = await exportAllToFiles(logs, settings);
      await shareExportedFiles(files);
    } catch (e: any) {
      Alert.alert("Export failed", e?.message ?? "Something went wrong while exporting your data.");
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
    Alert.alert("Reset ad consent?", "This clears your current consent choices. You will be asked again on the next ad request.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: async () => { try { await resetConsent(); } catch { } } },
    ]);
  };

  const lastPeriodDate = useMemo(
    () => (settings.lastPeriodStart ? parseDate(settings.lastPeriodStart) : new Date()),
    [settings.lastPeriodStart]
  );

  const user = useAppSelector(selectUser);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await dispatch(signOut());
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  };

  const handleNotificationToggle = async (v: boolean) => {
    if (v) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert("Notifications disabled", "Please enable notifications in your device settings.");
        return;
      }
    }
    dispatch(updateSettings({ notificationsEnabled: v }));
  };

  const handleReset = () => {
    Alert.alert("Reset all data?", "This will delete all logs and settings. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          dispatch(resetAll());
          router.replace("/onboarding");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {<View className="flex-row items-center justify-between" style={{ backgroundColor: theme.primary, paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 16 }}>
  <View className="flex-row items-center">
    <View className="mr-4" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primaryLight, alignItems: "center", justifyContent: "center" }}>
      <Text className="font-lexend-bold text-xl" style={{ color: theme.primary }}>
        {user?.displayName ? user.displayName.split(' ')[0][0].toUpperCase() : "U"}
      </Text>
    </View>
    <View>
      <Text className="text-white text-2xl font-lexend-bold">
        {user?.displayName || "User"}
      </Text>
      <Text className="text-white text-sm opacity-80">
        {user?.email || "Local Account"}
      </Text>
    </View>
  </View>
  <Pressable onPress={() => {
    // Placeholder for edit profile action
    console.log("Edit profile pressed");
  }} className="flex-row items-center">
    <Ionicons name="create-outline" size={20} color="#fff" />
    <Text className="ml-1 text-white font-lexend-medium">Edit</Text>
  </Pressable>
</View>}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}>

        <View className="px-6 pb-8" style={{ backgroundColor: theme.primary, paddingTop: insets.top + 16 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-2xl font-lexend-bold">History</Text>
            <Pressable onPress={() => router.push("/log")} className="bg-white/20 rounded-full px-4 py-2 flex-row items-center">
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-lexend-semibold ml-1">Log</Text>
            </Pressable>
          </View>
        </View>

        {/* SECTION 0: PROFILE ACCOUNT */}
        {/* <SectionHeader title="Account & Overview" subtitle="Logged-in profile & quick summary" /> */}

        <View className="bg-white mt-5 rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-3">
              <View
                className="w-12 h-12 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: theme.primaryLight }}>
                <Ionicons name="person" size={22} color={theme.primary} />
              </View>
              <View className="flex-1">
                <Text className="font-lexend-bold text-gray-900 text-base">{user?.displayName || "User"}</Text>
                <Text className="text-xs font-lexend text-gray-400 mt-0.5" numberOfLines={1}>{user?.email || "Local Account"}</Text>
              </View>
            </View>

            <Pressable
              onPress={handleSignOut}
              className="px-3 py-2 rounded-xl bg-red-50 flex-row items-center border border-red-100 active:bg-red-100">
              <Ionicons name="log-out-outline" size={16} color="#ef4444" />
              <Text className="ml-1.5 font-lexend-semibold text-xs text-red-600">Sign Out</Text>
            </Pressable>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row gap-2 mt-4 pt-3 border-t border-gray-100">
            <View className="flex-1 bg-pink-50/60 rounded-xl p-2.5 items-center border border-pink-100/60">
              <Text className="text-lg font-lexend-bold text-pink-600">{logs.length}</Text>
              <Text className="text-[10px] font-lexend text-pink-500 mt-0.5">Logs Saved</Text>
            </View>
            <View className="flex-1 bg-purple-50/60 rounded-xl p-2.5 items-center border border-purple-100/60">
              <Text className="text-lg font-lexend-bold text-purple-600">{settings.cycleLength}d</Text>
              <Text className="text-[10px] font-lexend text-purple-500 mt-0.5">Cycle Length</Text>
            </View>
            <View className="flex-1 bg-rose-50/60 rounded-xl p-2.5 items-center border border-rose-100/60">
              <Text className="text-lg font-lexend-bold text-rose-600">{settings.periodLength}d</Text>
              <Text className="text-[10px] font-lexend text-rose-500 mt-0.5">Period Length</Text>
            </View>
          </View>
        </View>

        {/* SECTION 1: CYCLE CONFIGURATION */}
        <SectionHeader icon="calendar" title="Cycle Setup" subtitle="Cycle & period duration preferences" />

        <Stepper
          label="Cycle Length"
          value={settings.cycleLength}
          onChange={(n) => dispatch(updateSettings({ cycleLength: n }))}
          min={18}
          max={45}
          suffix="days"
          hint="Average days between periods"
          icon="repeat"
        />
        <Stepper
          label="Period Length"
          value={settings.periodLength}
          onChange={(n) => dispatch(updateSettings({ periodLength: n }))}
          min={1}
          max={10}
          suffix="days"
          hint="Average duration of menstruation"
          icon="timer"
        />

        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex-row items-center justify-between active:bg-gray-50">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="w-8 h-8 rounded-xl bg-gray-50 items-center justify-center mr-3">
              <Ionicons name="calendar-number" size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-gray-900 text-sm">Last Period Start</Text>
              <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">Tap to change start date</Text>
            </View>
          </View>
          <View className="px-3 py-1.5 rounded-xl bg-gray-100 flex-row items-center gap-1.5">
            <Text className="font-lexend-semibold text-gray-700 text-xs">
              {lastPeriodDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
            <Ionicons name="create-outline" size={14} color="#6b7280" />
          </View>
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={lastPeriodDate}
            mode="date"
            maximumDate={new Date()}
            onChange={async (_, d) => {
              setShowDatePicker(false);
              if (d) {
                const dateStr = formatDate(d);
                await dispatch(updateSettings({ lastPeriodStart: dateStr }));
                await dispatch(addLog({
                  id: `${dateStr}-${Date.now()}`,
                  date: dateStr,
                  isPeriod: true,
                  flow: "medium",
                  symptoms: [],
                }));
              }
            }}
          />
        )}

        {/* SECTION 2: TRACKING OPTIONS */}
        <SectionHeader icon="options" title="Tracking Preferences" subtitle="Customize what details to log" />

        <ToggleRow
          label="Track Symptoms"
          hint="Show symptom chips when logging daily entries"
          icon="color-palette"
          value={settings.symptomTracking}
          onChange={(v) => dispatch(updateSettings({ symptomTracking: v }))}
        />
        <ToggleRow
          label="Track Flow Intensity"
          hint="Show flow level picker (light / medium / heavy)"
          icon="water"
          value={settings.flowTracking}
          onChange={(v) => dispatch(updateSettings({ flowTracking: v }))}
        />

        {/* SECTION 3: NOTIFICATIONS & REMINDERS */}
        <SectionHeader icon="notifications" title="Reminders & Notifications" subtitle="Manage cycle and pill alerts" />

        <ToggleRow
          label="Period Reminders"
          hint="Receive a notification before your predicted period starts"
          icon="notifications"
          value={settings.notificationsEnabled}
          onChange={handleNotificationToggle}
        />

        {settings.notificationsEnabled && (
          <>
            <Stepper
              label="Notify Before"
              value={settings.notifyBeforeDays}
              onChange={(n) => dispatch(updateSettings({ notifyBeforeDays: n }))}
              min={0}
              max={7}
              suffix="days"
              hint="Days in advance to receive notification"
              icon="alarm"
            />
            <Pressable
              onPress={() => setShowTimePicker(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex-row items-center justify-between active:bg-gray-50">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-gray-50 items-center justify-center mr-3">
                  <Ionicons name="time" size={18} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-lexend-semibold text-gray-900 text-sm">Period Reminder Time</Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">Daily alert time</Text>
                </View>
              </View>
              <View className="px-3 py-1.5 rounded-xl bg-gray-100 flex-row items-center gap-1.5">
                <Text className="font-lexend-semibold text-gray-700 text-xs">{settings.notifyTime}</Text>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
              </View>
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
                    dispatch(updateSettings({ notifyTime: `${h}:${m}` }));
                  }
                }}
              />
            )}
            <ToggleRow
              label="Ovulation Reminders"
              hint="Notify 1 day before estimated ovulation day"
              icon="leaf"
              value={settings.ovulationReminderEnabled ?? true}
              onChange={(v) => dispatch(updateSettings({ ovulationReminderEnabled: v }))}
            />
          </>
        )}

        <ToggleRow
          label="Pill / Supplement Reminder"
          hint="Daily reminder for birth control pills or daily vitamins"
          icon="medical"
          value={settings.pillReminderEnabled ?? false}
          onChange={(v) => dispatch(updateSettings({ pillReminderEnabled: v }))}
        />

        {settings.pillReminderEnabled && (
          <>
            <Pressable
              onPress={() => setShowPillTimePicker(true)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex-row items-center justify-between active:bg-gray-50">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-gray-50 items-center justify-center mr-3">
                  <Ionicons name="time" size={18} color={theme.primary} />
                </View>
                <View className="flex-1">
                  <Text className="font-lexend-semibold text-gray-900 text-sm">Pill Reminder Time</Text>
                  <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">Daily alert time</Text>
                </View>
              </View>
              <View className="px-3 py-1.5 rounded-xl bg-gray-100 flex-row items-center gap-1.5">
                <Text className="font-lexend-semibold text-gray-700 text-xs">{settings.pillNotifyTime || "20:00"}</Text>
                <Ionicons name="time-outline" size={14} color="#6b7280" />
              </View>
            </Pressable>
            {showPillTimePicker && (
              <DateTimePicker
                value={(() => {
                  const [h, m] = (settings.pillNotifyTime || "20:00").split(":").map(Number);
                  const d = new Date();
                  d.setHours(h, m, 0, 0);
                  return d;
                })()}
                mode="time"
                onChange={(_, d) => {
                  setShowPillTimePicker(Platform.OS === "ios");
                  if (d) {
                    const h = String(d.getHours()).padStart(2, "0");
                    const m = String(d.getMinutes()).padStart(2, "0");
                    dispatch(updateSettings({ pillNotifyTime: `${h}:${m}` }));
                  }
                }}
              />
            )}
          </>
        )}

        {/* SECTION 4: DATA EXPORT & BACKUP */}
        <SectionHeader icon="download-outline" title="Data & Export" subtitle="Export or backup your period history" />

        <Pressable
          onPress={handleExport}
          disabled={exporting}
          className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3 flex-row items-center ${exporting ? "opacity-60" : "active:bg-gray-50"}`}>
          <View className="w-10 h-10 rounded-xl bg-emerald-100 items-center justify-center mr-3">
            {exporting ? (
              <Ionicons name="sync" size={20} color={theme.primary} />
            ) : (
              <Ionicons name="download" size={20} color={theme.primary} />
            )}
          </View>
          <View className="flex-1">
            <Text className="font-lexend-semibold text-gray-900 text-sm">
              {exporting ? "Preparing export…" : "Export Data to CSV & JSON"}
            </Text>
            <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">
              {logs.length} log{logs.length === 1 ? "" : "s"} saved locally
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </Pressable>

        {isAdEnabled && !isUserBlocked && (
          <View className="mb-3">
            <AdFreeUnlocker />
          </View>
        )}

        {/* SECTION 5: PRIVACY & AD CHOICES */}
        <SectionHeader icon="shield-checkmark" title="Privacy & Ad Choices" subtitle="Consent managed via Google UMP" />

        <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
          <View className="flex-row items-start">
            <View className="w-9 h-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: theme.primaryLight }}>
              <Ionicons name="shield-checkmark" size={18} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-lexend-semibold text-gray-900 text-sm">Ad Consent Management</Text>
              <Text className="text-xs font-lexend text-gray-500 mt-1 leading-4">
                Your ad choices are recorded per ad request according to Google UMP guidelines. You can update or reset them anytime.
              </Text>
            </View>
          </View>
          <View className="flex-row gap-2 mt-4">
            <Pressable
              onPress={handleManageConsent}
              disabled={refreshingConsent}
              className="flex-1 rounded-xl py-2.5 items-center active:opacity-80"
              style={{ backgroundColor: theme.primaryLight }}>
              <Text className="font-lexend-semibold text-xs" style={{ color: theme.primary }}>Manage choices</Text>
            </Pressable>
            <Pressable
              onPress={handleResetConsent}
              className="flex-1 bg-gray-100 rounded-xl py-2.5 items-center active:bg-gray-200">
              <Text className="font-lexend-semibold text-gray-700 text-xs">Reset consent</Text>
            </Pressable>
          </View>
        </View>

        {/* SECTION 6: DANGER ZONE */}
        <SectionHeader icon="alert-circle" title="Danger Zone" subtitle="Irreversible data reset" />

        <Pressable
          onPress={handleReset}
          className="bg-white rounded-2xl p-4 shadow-sm border border-red-100 mb-6 flex-row items-center active:bg-red-50">
          <View className="w-10 h-10 rounded-xl bg-red-100 items-center justify-center mr-3">
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="font-lexend-semibold text-red-600 text-sm">Reset All App Data</Text>
            <Text className="text-[11px] font-lexend text-gray-400 mt-0.5">Delete all logs, settings, and restart onboarding</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ef4444" />
        </Pressable>
      </ScrollView>
    </View>
  );
}
