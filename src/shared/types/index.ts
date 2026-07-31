export type SymptomType =
  | "cramps"
  | "headache"
  | "bloating"
  | "fatigue"
  | "mood_swings"
  | "acne"
  | "breast_tenderness"
  | "backache"
  | "nausea"
  | "cravings"
  | "insomnia";

export type FlowLevel = "light" | "medium" | "heavy";

export type MoodType =
  | "happy"
  | "calm"
  | "energetic"
  | "anxious"
  | "sad"
  | "irritated"
  | "tired"
  | "stressed";

export type CrampSeverity = "none" | "mild" | "moderate" | "severe";

export interface CrampEntry {
  severity: CrampSeverity;
  location?: "lower_abdomen" | "back" | "thighs" | "other";
  notes?: string;
}

export type CravingType =
  | "sweet"
  | "chocolate"
  | "salty"
  | "carbs"
  | "comfort"
  | "ice"
  | "other";

export interface CravingEntry {
  type: CravingType;
  intensity: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type SleepQuality = "poor" | "fair" | "good" | "excellent";

export interface SleepEntry {
  hours: number;
  quality: SleepQuality;
  notes?: string;
}

export interface PeriodLog {
  id: string;
  date: string; // YYYY-MM-DD
  flow?: FlowLevel;
  symptoms: SymptomType[];
  mood?: MoodType;
  notes?: string;
  isPeriod: boolean;
  cramps?: CrampEntry;
  cravings?: CravingEntry;
  sleep?: SleepEntry;
  water?: number; // Glasses of water (0-12)
}

export interface CycleData {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  periodLogs: PeriodLog[];
}

export interface UserSettings {
  cycleLength: number; // average days (default 28)
  periodLength: number; // average days (default 5)
  lastPeriodStart: string | null; // YYYY-MM-DD
  primaryGoal?: "track_period" | "predict_fertility" | "monitor_wellness";
  notificationsEnabled: boolean;
  notifyBeforeDays: number; // days before predicted period
  notifyTime: string; // HH:mm
  ovulationReminderEnabled: boolean;
  pillReminderEnabled: boolean;
  pillNotifyTime: string; // HH:mm
  symptomTracking: boolean;
  flowTracking: boolean;
  onboardingComplete: boolean;
  hasSeenStorageNotice: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}
