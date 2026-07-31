import { eq, desc } from "drizzle-orm";
import { getDb, initDb } from "./client";
import { periodLogs, userSettings } from "./schema";
import type {
  PeriodLog,
  UserSettings,
  FlowLevel,
  MoodType,
  SymptomType,
  CrampEntry,
  CravingEntry,
  SleepEntry,
} from "@/shared/types";
import type { PeriodLogRow, UserSettingsRow } from "./schema";

const SETTINGS_ROW_ID = "singleton";

export async function ensureReady(): Promise<void> {
  await initDb();
}

function toOptional<T>(val: T | null | undefined): T | undefined {
  if (val === null || val === undefined) return undefined;
  return val;
}

function rowToLog(row: PeriodLogRow): PeriodLog {
  return {
    id: row.id,
    date: row.date,
    flow: toOptional(row.flow as FlowLevel),
    symptoms: (row.symptoms as SymptomType[]) ?? [],
    mood: toOptional(row.mood as MoodType),
    notes: toOptional(row.notes),
    isPeriod: row.isPeriod,
    cramps: toOptional(row.cramps as CrampEntry),
    cravings: toOptional(row.cravings as CravingEntry),
    sleep: toOptional(row.sleep as SleepEntry),
    water: row.water ?? 0,
  };
}

function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    cycleLength: row.cycleLength,
    periodLength: row.periodLength,
    lastPeriodStart: row.lastPeriodStart ?? null,
    primaryGoal: (row.primaryGoal as any) ?? "track_period",
    notificationsEnabled: row.notificationsEnabled,
    notifyBeforeDays: row.notifyBeforeDays,
    notifyTime: row.notifyTime,
    ovulationReminderEnabled: row.ovulationReminderEnabled ?? true,
    pillReminderEnabled: row.pillReminderEnabled ?? false,
    pillNotifyTime: row.pillNotifyTime ?? "20:00",
    symptomTracking: row.symptomTracking,
    flowTracking: row.flowTracking,
    onboardingComplete: row.onboardingComplete,
    hasSeenStorageNotice: row.hasSeenStorageNotice,
  };
}

export async function fetchAllLogs(): Promise<PeriodLog[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(periodLogs)
    .orderBy(desc(periodLogs.date));
  return rows.map(rowToLog);
}

export async function insertLog(log: PeriodLog): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const id = log.id || (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const values = {
    id,
    date: log.date,
    flow: log.flow ?? null,
    symptoms: log.symptoms ?? [],
    mood: log.mood ?? null,
    notes: log.notes ?? null,
    isPeriod: log.isPeriod ?? false,
    cramps: log.cramps ?? null,
    cravings: log.cravings ?? null,
    sleep: log.sleep ?? null,
    water: log.water ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  const { id: _id, ...updateSet } = values;
  await db
    .insert(periodLogs)
    .values(values)
    .onConflictDoUpdate({
      target: periodLogs.id,
      set: updateSet,
    });
}

export async function updateLogDb(
  id: string,
  updates: Partial<PeriodLog>,
): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (updates.date !== undefined) patch.date = updates.date;
  if (updates.flow !== undefined) patch.flow = updates.flow ?? null;
  if (updates.symptoms !== undefined) patch.symptoms = updates.symptoms;
  if (updates.mood !== undefined) patch.mood = updates.mood ?? null;
  if (updates.notes !== undefined) patch.notes = updates.notes ?? null;
  if (updates.isPeriod !== undefined) patch.isPeriod = updates.isPeriod ?? false;
  if (updates.cramps !== undefined) patch.cramps = updates.cramps ?? null;
  if (updates.cravings !== undefined) patch.cravings = updates.cravings ?? null;
  if (updates.sleep !== undefined) patch.sleep = updates.sleep ?? null;
  if (updates.water !== undefined) patch.water = updates.water ?? 0;
  await db.update(periodLogs).set(patch).where(eq(periodLogs.id, id));
}

export async function deleteLogDb(id: string): Promise<void> {
  const db = getDb();
  await db.delete(periodLogs).where(eq(periodLogs.id, id));
}

export async function deleteAllLogs(): Promise<void> {
  const db = getDb();
  await db.delete(periodLogs);
}

export async function fetchSettings(): Promise<UserSettings | null> {
  const db = getDb();
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.id, SETTINGS_ROW_ID))
    .limit(1);
  if (rows.length === 0) return null;
  return rowToSettings(rows[0]);
}

export async function upsertSettings(settings: UserSettings): Promise<void> {
  const db = getDb();
  const now = Date.now();
  const data = {
    id: SETTINGS_ROW_ID,
    cycleLength: settings.cycleLength ?? 28,
    periodLength: settings.periodLength ?? 5,
    lastPeriodStart: settings.lastPeriodStart ?? null,
    primaryGoal: settings.primaryGoal ?? "track_period",
    notificationsEnabled: settings.notificationsEnabled ?? false,
    notifyBeforeDays: settings.notifyBeforeDays ?? 2,
    notifyTime: settings.notifyTime ?? "09:00",
    ovulationReminderEnabled: settings.ovulationReminderEnabled ?? true,
    pillReminderEnabled: settings.pillReminderEnabled ?? false,
    pillNotifyTime: settings.pillNotifyTime ?? "20:00",
    symptomTracking: settings.symptomTracking ?? true,
    flowTracking: settings.flowTracking ?? true,
    onboardingComplete: settings.onboardingComplete ?? false,
    hasSeenStorageNotice: settings.hasSeenStorageNotice ?? false,
    updatedAt: now,
  };
  const { id: _id, ...updateData } = data;
  await db
    .insert(userSettings)
    .values(data)
    .onConflictDoUpdate({
      target: userSettings.id,
      set: updateData,
    });
}

export async function resetAllData(): Promise<void> {
  const db = getDb();
  await db.delete(periodLogs);
  await db.delete(userSettings);
}
