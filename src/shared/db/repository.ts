import { database } from "./wm/database";
import { PeriodLogModel, UserSettingsModel } from "./wm/models";
import type { PeriodLog, UserSettings } from "@/shared/types";

const SETTINGS_ROW_ID = "singleton";

export async function ensureReady(): Promise<void> {}

function toOptional<T>(val: T | null | undefined): T | undefined {
  if (val === null || val === undefined) return undefined;
  return val;
}

function modelToLog(model: PeriodLogModel): PeriodLog {
  return {
    id: model.id,
    date: model.date,
    flow: toOptional(model.flow),
    symptoms: Array.isArray(model.symptoms) ? model.symptoms : [],
    mood: toOptional(model.mood),
    notes: toOptional(model.notes),
    isPeriod: !!model.isPeriod,
    cramps: toOptional(model.cramps),
    cravings: toOptional(model.cravings),
    sleep: toOptional(model.sleep),
    water: model.water ?? 0,
  };
}

function modelToSettings(model: UserSettingsModel): UserSettings {
  return {
    cycleLength: model.cycleLength,
    periodLength: model.periodLength,
    lastPeriodStart: model.lastPeriodStart ?? null,
    primaryGoal: (model.primaryGoal as any) ?? "track_period",
    notificationsEnabled: model.notificationsEnabled,
    notifyBeforeDays: model.notifyBeforeDays,
    notifyTime: model.notifyTime,
    ovulationReminderEnabled: model.ovulationReminderEnabled ?? true,
    pillReminderEnabled: model.pillReminderEnabled ?? false,
    pillNotifyTime: model.pillNotifyTime ?? "20:00",
    symptomTracking: model.symptomTracking,
    flowTracking: model.flowTracking,
    onboardingComplete: model.onboardingComplete,
    hasSeenStorageNotice: model.hasSeenStorageNotice,
  };
}

function applyLogUpdate(record: PeriodLogModel, log: Partial<PeriodLog>): void {
  record.date = log.date ?? record.date;
  record.flow = log.flow ?? null;
  record.symptoms = log.symptoms ?? [];
  record.mood = log.mood ?? null;
  record.notes = log.notes ?? null;
  record.isPeriod = log.isPeriod ?? false;
  record.cramps = log.cramps ?? null;
  record.cravings = log.cravings ?? null;
  record.sleep = log.sleep ?? null;
  record.water = log.water ?? 0;
}

function applySettingsUpdate(
  record: UserSettingsModel,
  settings: UserSettings,
): void {
  record.cycleLength = settings.cycleLength ?? 28;
  record.periodLength = settings.periodLength ?? 5;
  record.lastPeriodStart = settings.lastPeriodStart ?? null;
  record.primaryGoal = settings.primaryGoal ?? "track_period";
  record.notificationsEnabled = settings.notificationsEnabled ?? false;
  record.notifyBeforeDays = settings.notifyBeforeDays ?? 2;
  record.notifyTime = settings.notifyTime ?? "09:00";
  record.ovulationReminderEnabled = settings.ovulationReminderEnabled ?? true;
  record.pillReminderEnabled = settings.pillReminderEnabled ?? false;
  record.pillNotifyTime = settings.pillNotifyTime ?? "20:00";
  record.symptomTracking = settings.symptomTracking ?? true;
  record.flowTracking = settings.flowTracking ?? true;
  record.onboardingComplete = settings.onboardingComplete ?? false;
  record.hasSeenStorageNotice = settings.hasSeenStorageNotice ?? false;
}

export async function fetchAllLogs(): Promise<PeriodLog[]> {
  const logs = await database.collections
    .get<PeriodLogModel>("period_logs")
    .query()
    .fetch();
  return logs.sort((a, b) => (a.date < b.date ? 1 : -1)).map(modelToLog);
}

export async function insertLog(log: PeriodLog): Promise<void> {
  const id =
    log.id ??
    (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const collection = database.collections.get<PeriodLogModel>("period_logs");
  await database.write(async () => {
    const existing = await collection.find(id).catch(() => null);
    if (existing) {
      await existing.update((record) => applyLogUpdate(record, log));
    } else {
      await collection.create((record) => {
        record._raw.id = id;
        applyLogUpdate(record, log);
      });
    }
  });
}

export async function updateLogDb(
  id: string,
  updates: Partial<PeriodLog>,
): Promise<void> {
  const collection = database.collections.get<PeriodLogModel>("period_logs");
  await database.write(async () => {
    const record = await collection.find(id).catch(() => null);
    if (!record) return;
    await record.update((r) => {
      if (updates.date !== undefined) r.date = updates.date;
      if (updates.flow !== undefined) r.flow = updates.flow ?? null;
      if (updates.symptoms !== undefined) r.symptoms = updates.symptoms;
      if (updates.mood !== undefined) r.mood = updates.mood ?? null;
      if (updates.notes !== undefined) r.notes = updates.notes ?? null;
      if (updates.isPeriod !== undefined) r.isPeriod = updates.isPeriod ?? false;
      if (updates.cramps !== undefined) r.cramps = updates.cramps ?? null;
      if (updates.cravings !== undefined) r.cravings = updates.cravings ?? null;
      if (updates.sleep !== undefined) r.sleep = updates.sleep ?? null;
      if (updates.water !== undefined) r.water = updates.water ?? 0;
    });
  });
}

export async function deleteLogDb(id: string): Promise<void> {
  const collection = database.collections.get<PeriodLogModel>("period_logs");
  await database.write(async () => {
    const record = await collection.find(id).catch(() => null);
    if (record) await record.destroyPermanently();
  });
}

export async function deleteAllLogs(): Promise<void> {
  await database.write(async () => {
    const logs = await database.collections
      .get<PeriodLogModel>("period_logs")
      .query()
      .fetch();
    for (const log of logs) {
      await log.destroyPermanently();
    }
  });
}

export async function fetchSettings(): Promise<UserSettings | null> {
  const collection = database.collections.get<UserSettingsModel>("user_settings");
  const record = await collection.find(SETTINGS_ROW_ID).catch(() => null);
  return record ? modelToSettings(record) : null;
}

export async function upsertSettings(settings: UserSettings): Promise<void> {
  const collection = database.collections.get<UserSettingsModel>("user_settings");
  await database.write(async () => {
    const existing = await collection.find(SETTINGS_ROW_ID).catch(() => null);
    if (existing) {
      await existing.update((record) => applySettingsUpdate(record, settings));
    } else {
      await collection.create((record) => {
        record._raw.id = SETTINGS_ROW_ID;
        applySettingsUpdate(record, settings);
      });
    }
  });
}

export async function resetAllData(): Promise<void> {
  await database.write(async () => {
    const logs = await database.collections
      .get<PeriodLogModel>("period_logs")
      .query()
      .fetch();
    for (const log of logs) {
      await log.destroyPermanently();
    }
    const settings = await database.collections
      .get<UserSettingsModel>("user_settings")
      .query()
      .fetch();
    for (const record of settings) {
      await record.destroyPermanently();
    }
  });
}
