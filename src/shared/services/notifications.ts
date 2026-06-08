import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { UserSettings, PeriodLog } from "@/shared/types";
import { predictNextPeriod, parseDate } from "@/shared/utils/cycle";

const PREDICTION_IDENTIFIER = "period-prediction";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    final = status;
  }
  if (Platform.OS === "android" && final === "granted") {
    await Notifications.setNotificationChannelAsync("period", {
      name: "Period reminders",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#ec4899",
    });
  }
  return final === "granted";
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function nextOccurrenceOfTime(hhmm: string): Date {
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

export async function schedulePeriodPrediction(
  logs: PeriodLog[],
  settings: UserSettings,
): Promise<string | null> {
  if (!settings.notificationsEnabled) return null;

  const predicted = predictNextPeriod(logs, settings);
  if (!predicted) return null;

  const [h, m] = settings.notifyTime.split(":").map((n) => parseInt(n, 10));
  const triggerDate = new Date(predicted.start);
  triggerDate.setDate(
    triggerDate.getDate() - Math.max(0, settings.notifyBeforeDays),
  );
  triggerDate.setHours(h, m, 0, 0);
  if (triggerDate.getTime() <= Date.now()) return null;

  const identifier = await Notifications.scheduleNotificationAsync({
    identifier: PREDICTION_IDENTIFIER,
    content: {
      title: "Period starting soon",
      body: `Your next period is predicted to start in ${settings.notifyBeforeDays} day${settings.notifyBeforeDays === 1 ? "" : "s"}.`,
      data: { type: "period-prediction" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return identifier;
}

export async function rescheduleAll(
  logs: PeriodLog[],
  settings: UserSettings,
): Promise<void> {
  await cancelAllScheduled();
  if (!settings.notificationsEnabled) return;
  const granted = await requestNotificationPermissions();
  if (!granted) return;
  await schedulePeriodPrediction(logs, settings);
}
