import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import type {
  SymptomType,
  FlowLevel,
  MoodType,
  CrampEntry,
  CravingEntry,
  SleepEntry,
  UserSettings,
} from "@/shared/types";

export const periodLogs = sqliteTable("period_logs", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  flow: text("flow").$type<FlowLevel>(),
  symptoms: text("symptoms", { mode: "json" })
    .$type<SymptomType[]>()
    .notNull()
    .default([]),
  mood: text("mood").$type<MoodType>(),
  notes: text("notes"),
  isPeriod: integer("is_period", { mode: "boolean" })
    .notNull()
    .default(false),
  cramps: text("cramps", { mode: "json" }).$type<CrampEntry | null>(),
  cravings: text("cravings", { mode: "json" }).$type<CravingEntry | null>(),
  sleep: text("sleep", { mode: "json" }).$type<SleepEntry | null>(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  cycleLength: integer("cycle_length").notNull().default(28),
  periodLength: integer("period_length").notNull().default(5),
  lastPeriodStart: text("last_period_start"),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  notifyBeforeDays: integer("notify_before_days").notNull().default(2),
  notifyTime: text("notify_time").notNull().default("09:00"),
  symptomTracking: integer("symptom_tracking", { mode: "boolean" })
    .notNull()
    .default(true),
  flowTracking: integer("flow_tracking", { mode: "boolean" })
    .notNull()
    .default(true),
  onboardingComplete: integer("onboarding_complete", { mode: "boolean" })
    .notNull()
    .default(false),
  hasSeenStorageNotice: integer("has_seen_storage_notice", { mode: "boolean" })
    .notNull()
    .default(false),
  updatedAt: integer("updated_at").notNull(),
});

export type PeriodLogRow = typeof periodLogs.$inferSelect;
export type PeriodLogInsert = typeof periodLogs.$inferInsert;
export type UserSettingsRow = typeof userSettings.$inferSelect;
export type UserSettingsInsert = typeof userSettings.$inferInsert;
export type { UserSettings };
