import firestore from "@react-native-firebase/firestore";
import { PeriodLog, UserSettings } from "@/shared/types";
import {
  fetchAllLogs,
  fetchSettings,
  upsertSettings,
  insertLog,
  deleteLogDb,
} from "@/shared/db/repository";

const LOGS_COLLECTION = (uid: string) => `users/${uid}/logs`;
const META_COLLECTION = (uid: string) => `users/${uid}/meta`;

export type SyncStatus = "idle" | "syncing" | "error";

let _currentUid: string | null = null;
let _onStatusChange: ((status: SyncStatus) => void) | null = null;
let _unsubscribeLogs: (() => void) | null = null;
let _unsubscribeSettings: (() => void) | null = null;

export function setSyncStatusListener(cb: (status: SyncStatus) => void) {
  _onStatusChange = cb;
}

function notify(status: SyncStatus) {
  _onStatusChange?.(status);
}

function logToFirestore(log: PeriodLog): Record<string, unknown> {
  return {
    id: log.id,
    date: log.date,
    flow: log.flow ?? null,
    symptoms: log.symptoms ?? [],
    mood: log.mood ?? null,
    notes: log.notes ?? null,
    isPeriod: log.isPeriod ?? false,
    cramps: log.cramps ?? null,
    cravings: log.cravings ?? null,
    sleep: log.sleep ?? null,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
}

function settingsToFirestore(settings: UserSettings): Record<string, unknown> {
  return {
    id: "singleton",
    cycleLength: settings.cycleLength,
    periodLength: settings.periodLength,
    lastPeriodStart: settings.lastPeriodStart ?? null,
    notificationsEnabled: settings.notificationsEnabled,
    notifyBeforeDays: settings.notifyBeforeDays,
    notifyTime: settings.notifyTime,
    symptomTracking: settings.symptomTracking,
    flowTracking: settings.flowTracking,
    onboardingComplete: settings.onboardingComplete,
    hasSeenStorageNotice: settings.hasSeenStorageNotice ?? false,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  };
}

export async function pushLog(uid: string, log: PeriodLog): Promise<void> {
  try {
    await firestore()
      .collection(LOGS_COLLECTION(uid))
      .doc(log.id)
      .set(logToFirestore(log), { merge: true });
  } catch (e) {
    if (__DEV__) console.warn("[sync] pushLog failed:", e);
  }
}

export async function pushLogDelete(uid: string, logId: string): Promise<void> {
  try {
    await firestore()
      .collection(LOGS_COLLECTION(uid))
      .doc(logId)
      .delete();
  } catch (e) {
    if (__DEV__) console.warn("[sync] pushLogDelete failed:", e);
  }
}

export async function pushSettings(uid: string, settings: UserSettings): Promise<void> {
  try {
    await firestore()
      .collection(META_COLLECTION(uid))
      .doc("settings")
      .set(settingsToFirestore(settings), { merge: true });
  } catch (e) {
    if (__DEV__) console.warn("[sync] pushSettings failed:", e);
  }
}

async function pullLogs(uid: string): Promise<{ logs: PeriodLog[]; serverTimestamps: Record<string, number> }> {
  const snap = await firestore()
    .collection(LOGS_COLLECTION(uid))
    .get();

  const serverTimestamps: Record<string, number> = {};
  const logs: PeriodLog[] = [];
  for (const doc of snap.docs) {
    const data = doc.data();
    serverTimestamps[doc.id] = data.updatedAt?.toMillis?.() ?? 0;
    logs.push({
      id: doc.id,
      date: data.date ?? "",
      flow: data.flow ?? undefined,
      symptoms: data.symptoms ?? [],
      mood: data.mood ?? undefined,
      notes: data.notes ?? undefined,
      isPeriod: data.isPeriod ?? false,
      cramps: data.cramps ?? undefined,
      cravings: data.cravings ?? undefined,
      sleep: data.sleep ?? undefined,
    });
  }
  return { logs, serverTimestamps };
}

async function pullSettings(uid: string): Promise<{ settings: UserSettings | null; serverTimestamp: number }> {
  const doc = await firestore()
    .collection(META_COLLECTION(uid))
    .doc("settings")
    .get();

  if (!doc.exists) return { settings: null, serverTimestamp: 0 };

  const data = doc.data()!;
  return {
    settings: {
      cycleLength: data.cycleLength ?? 28,
      periodLength: data.periodLength ?? 5,
      lastPeriodStart: data.lastPeriodStart ?? null,
      notificationsEnabled: data.notificationsEnabled ?? false,
      notifyBeforeDays: data.notifyBeforeDays ?? 2,
      notifyTime: data.notifyTime ?? "09:00",
      ovulationReminderEnabled: data.ovulationReminderEnabled ?? true,
      pillReminderEnabled: data.pillReminderEnabled ?? false,
      pillNotifyTime: data.pillNotifyTime ?? "20:00",
      symptomTracking: data.symptomTracking ?? true,
      flowTracking: data.flowTracking ?? true,
      onboardingComplete: data.onboardingComplete ?? false,
      hasSeenStorageNotice: data.hasSeenStorageNotice ?? false,
    },
    serverTimestamp: data.updatedAt?.toMillis?.() ?? 0,
  };
}

export async function pullFromFirestore(uid: string): Promise<{ pulledLogs: number; pulledSettings: boolean }> {
  notify("syncing");
  try {
    const localLogs = await fetchAllLogs();
    const localSettings = await fetchSettings();

    const { logs: remoteLogs, serverTimestamps } = await pullLogs(uid);
    const { settings: remoteSettings, serverTimestamp: remoteSettingsTs } = await pullSettings(uid);

    let pulledLogs = 0;
    let pulledSettings = false;
    const localMap = new Map(localLogs.map((l) => [l.id, l]));

    for (const remote of remoteLogs) {
      const local = localMap.get(remote.id);
      if (!local) {
        await insertLog(remote);
        pulledLogs++;
      }
    }

    if (remoteSettings && !localSettings) {
      await upsertSettings(remoteSettings);
      pulledSettings = true;
    }

    notify("idle");
    return { pulledLogs, pulledSettings };
  } catch (e) {
    notify("error");
    throw e;
  }
}

export function subscribeToFirestore(uid: string): () => void {
  if (_currentUid === uid) return () => {};
  unsubscribeFromFirestore();

  _currentUid = uid;

  _unsubscribeLogs = firestore()
    .collection(LOGS_COLLECTION(uid))
    .onSnapshot(
      async (snapshot) => {
        notify("syncing");
        try {
          const localLogs = await fetchAllLogs();
          const localMap = new Map(localLogs.map((l) => [l.id, l]));

          for (const change of snapshot.docChanges()) {
            if (change.type === "added" || change.type === "modified") {
              const data = change.doc.data();
              const remote: PeriodLog = {
                id: change.doc.id,
                date: data.date ?? "",
                flow: data.flow ?? undefined,
                symptoms: data.symptoms ?? [],
                mood: data.mood ?? undefined,
                notes: data.notes ?? undefined,
                isPeriod: data.isPeriod ?? false,
                cramps: data.cramps ?? undefined,
                cravings: data.cravings ?? undefined,
                sleep: data.sleep ?? undefined,
              };
              const local = localMap.get(remote.id);
              if (!local) {
                await insertLog(remote);
              }
            } else if (change.type === "removed") {
              await deleteLogDb(change.doc.id);
            }
          }
          notify("idle");
        } catch (e) {
          notify("error");
          if (__DEV__) console.warn("[sync] snapshot handler error:", e);
        }
      },
      (error) => {
        notify("error");
        if (__DEV__) console.warn("[sync] snapshot listener error:", error);
      },
    );

  _unsubscribeSettings = firestore()
    .collection(META_COLLECTION(uid))
    .doc("settings")
    .onSnapshot(
      async (doc) => {
        if (!doc.exists) return;
        notify("syncing");
        try {
          const data = doc.data()!;
          const localSettings = await fetchSettings();
          if (!localSettings) {
            await upsertSettings({
              cycleLength: data.cycleLength ?? 28,
              periodLength: data.periodLength ?? 5,
              lastPeriodStart: data.lastPeriodStart ?? null,
              notificationsEnabled: data.notificationsEnabled ?? false,
              notifyBeforeDays: data.notifyBeforeDays ?? 2,
              notifyTime: data.notifyTime ?? "09:00",
              ovulationReminderEnabled: data.ovulationReminderEnabled ?? true,
              pillReminderEnabled: data.pillReminderEnabled ?? false,
              pillNotifyTime: data.pillNotifyTime ?? "20:00",
              symptomTracking: data.symptomTracking ?? true,
              flowTracking: data.flowTracking ?? true,
              onboardingComplete: data.onboardingComplete ?? false,
              hasSeenStorageNotice: data.hasSeenStorageNotice ?? false,
            });
          }
          notify("idle");
        } catch (e) {
          notify("error");
        }
      },
      (error) => {
        notify("error");
        if (__DEV__) console.warn("[sync] settings snapshot error:", error);
      },
    );

  return () => unsubscribeFromFirestore();
}

export function unsubscribeFromFirestore() {
  _currentUid = null;
  if (_unsubscribeLogs) {
    _unsubscribeLogs();
    _unsubscribeLogs = null;
  }
  if (_unsubscribeSettings) {
    _unsubscribeSettings();
    _unsubscribeSettings = null;
  }
}
