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

function rowToLog(row: PeriodLogRow): PeriodLog {
  return {
    id: row.id,
    date: row.date,
    flow: (row.flow as FlowLevel | null) ?? undefined,
    symptoms: (row.symptoms as SymptomType[] | null) ?? [],
    mood: (row.mood as MoodType | null) ?? undefined,
    notes: row.notes ?? undefined,
    isPeriod: row.isPeriod,
    cramps: (row.cramps as CrampEntry | null) ?? undefined,
    cravings: (row.cravings as CravingEntry | null) ?? undefined,
    sleep: (row.sleep as SleepEntry | null) ?? undefined,
  };
}

function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    cycleLength: row.cycleLength,
    periodLength: row.periodLength,
    lastPeriodStart: row.lastPeriodStart,
    notificationsEnabled: row.notificationsEnabled,
    notifyBeforeDays: row.notifyBeforeDays,
    notifyTime: row.notifyTime,
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
  await db.insert(periodLogs).values({
    id: log.id,
    date: log.date,
    flow: log.flow ?? null,
    symptoms: log.symptoms ?? [],
    mood: log.mood ?? null,
    notes: log.notes ?? null,
    isPeriod: log.isPeriod,
    cramps: log.cramps ?? null,
    cravings: log.cravings ?? null,
    sleep: log.sleep ?? null,
    createdAt: now,
    updatedAt: now,
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
  if (updates.isPeriod !== undefined) patch.isPeriod = updates.isPeriod;
  if (updates.cramps !== undefined) patch.cramps = updates.cramps ?? null;
  if (updates.cravings !== undefined) patch.cravings = updates.cravings ?? null;
  if (updates.sleep !== undefined) patch.sleep = updates.sleep ?? null;
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
    cycleLength: settings.cycleLength,
    periodLength: settings.periodLength,
    lastPeriodStart: settings.lastPeriodStart,
    notificationsEnabled: settings.notificationsEnabled,
    notifyBeforeDays: settings.notifyBeforeDays,
    notifyTime: settings.notifyTime,
    symptomTracking: settings.symptomTracking,
    flowTracking: settings.flowTracking,
    onboardingComplete: settings.onboardingComplete,
    hasSeenStorageNotice: settings.hasSeenStorageNotice,
    updatedAt: now,
  };
  await db
    .insert(userSettings)
    .values(data)
    .onConflictDoUpdate({
      target: userSettings.id,
      set: { ...data, id: SETTINGS_ROW_ID },
    });
}

export async function resetAllData(): Promise<void> {
  const db = getDb();
  await db.delete(periodLogs);
  await db.delete(userSettings);
}
