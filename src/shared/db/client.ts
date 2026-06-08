import * as SQLite from "expo-sqlite";
import { drizzle, ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const DB_NAME = "cycle_diary.db";

let _db: ExpoSQLiteDatabase<typeof schema> | null = null;
let _initialized = false;

function ensureTables(expo: SQLite.SQLiteDatabase) {
  expo.execSync(`
    CREATE TABLE IF NOT EXISTS period_logs (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      flow TEXT,
      symptoms TEXT NOT NULL DEFAULT '[]',
      mood TEXT,
      notes TEXT,
      is_period INTEGER NOT NULL DEFAULT 0,
      cramps TEXT,
      cravings TEXT,
      sleep TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS period_logs_date_idx ON period_logs(date);

    CREATE TABLE IF NOT EXISTS user_settings (
      id TEXT PRIMARY KEY NOT NULL,
      cycle_length INTEGER NOT NULL DEFAULT 28,
      period_length INTEGER NOT NULL DEFAULT 5,
      last_period_start TEXT,
      notifications_enabled INTEGER NOT NULL DEFAULT 0,
      notify_before_days INTEGER NOT NULL DEFAULT 2,
      notify_time TEXT NOT NULL DEFAULT '09:00',
      symptom_tracking INTEGER NOT NULL DEFAULT 1,
      flow_tracking INTEGER NOT NULL DEFAULT 1,
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );
  `);

  const lightMigrations = [
    `ALTER TABLE user_settings ADD COLUMN has_seen_storage_notice INTEGER NOT NULL DEFAULT 0;`,
  ];
  for (const stmt of lightMigrations) {
    try {
      expo.execSync(stmt);
    } catch {
    }
  }
}

export function getDb(): ExpoSQLiteDatabase<typeof schema> {
  if (_db) return _db;
  const expo = SQLite.openDatabaseSync(DB_NAME);
  if (!_initialized) {
    ensureTables(expo);
    _initialized = true;
  }
  _db = drizzle(expo, { schema });
  return _db;
}

export async function initDb(): Promise<void> {
  const expo = SQLite.openDatabaseSync(DB_NAME);
  ensureTables(expo);
  _initialized = true;
  _db = drizzle(expo, { schema });
  await _db.get(sql`SELECT 1`);
}
