import { Model } from "@nozbe/watermelondb";
import { field, json } from "@nozbe/watermelondb/decorators";
import type {
  FlowLevel,
  MoodType,
  SymptomType,
  CrampEntry,
  CravingEntry,
  SleepEntry,
} from "@/shared/types";

const sanitizeArray = (source: unknown): SymptomType[] =>
  Array.isArray(source) ? (source as SymptomType[]) : [];

const sanitizeEntry = <T>(source: unknown): T | null =>
  source && typeof source === "object" ? (source as T) : null;

export class PeriodLogModel extends Model {
  static table = "period_logs";

  @field("date") date!: string;
  @field("flow") flow!: FlowLevel | null;
  @json("symptoms", sanitizeArray) symptoms!: SymptomType[];
  @field("mood") mood!: MoodType | null;
  @field("notes") notes!: string | null;
  @field("is_period") isPeriod!: boolean;
  @json("cramps", sanitizeEntry<CrampEntry>) cramps!: CrampEntry | null;
  @json("cravings", sanitizeEntry<CravingEntry>) cravings!: CravingEntry | null;
  @json("sleep", sanitizeEntry<SleepEntry>) sleep!: SleepEntry | null;
  @field("water") water!: number;
}

export class UserSettingsModel extends Model {
  static table = "user_settings";

  @field("cycle_length") cycleLength!: number;
  @field("period_length") periodLength!: number;
  @field("last_period_start") lastPeriodStart!: string | null;
  @field("primary_goal") primaryGoal!: string | null;
  @field("notifications_enabled") notificationsEnabled!: boolean;
  @field("notify_before_days") notifyBeforeDays!: number;
  @field("notify_time") notifyTime!: string;
  @field("ovulation_reminder_enabled") ovulationReminderEnabled!: boolean;
  @field("pill_reminder_enabled") pillReminderEnabled!: boolean;
  @field("pill_notify_time") pillNotifyTime!: string;
  @field("symptom_tracking") symptomTracking!: boolean;
  @field("flow_tracking") flowTracking!: boolean;
  @field("onboarding_complete") onboardingComplete!: boolean;
  @field("has_seen_storage_notice") hasSeenStorageNotice!: boolean;
}
