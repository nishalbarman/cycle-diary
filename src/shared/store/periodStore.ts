import { create } from "zustand";
import { PeriodLog, UserSettings } from "@/shared/types";
import {
  ensureReady,
  fetchAllLogs,
  fetchSettings,
  insertLog,
  updateLogDb,
  deleteLogDb,
  upsertSettings,
  resetAllData,
} from "@/shared/db/repository";

interface PeriodState {
  logs: PeriodLog[];
  settings: UserSettings;
  hydrated: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  addLog: (log: PeriodLog) => Promise<void>;
  updateLog: (id: string, updates: Partial<PeriodLog>) => Promise<void>;
  removeLog: (id: string) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const defaultSettings: UserSettings = {
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: null,
  notificationsEnabled: false,
  notifyBeforeDays: 2,
  notifyTime: "09:00",
  symptomTracking: true,
  flowTracking: true,
  onboardingComplete: false,
  hasSeenStorageNotice: false,
};

export const usePeriodStore = create<PeriodState>()((set, get) => ({
  logs: [],
  settings: defaultSettings,
  hydrated: false,
  error: null,

  hydrate: async () => {
    try {
      await ensureReady();
      const [logs, settings] = await Promise.all([
        fetchAllLogs(),
        fetchSettings(),
      ]);
      set({
        logs,
        settings: settings ?? defaultSettings,
        hydrated: true,
        error: null,
      });
    } catch (e: any) {
      console.warn("[periodStore] hydrate failed:", e?.message);
      set({
        hydrated: true,
        error: e?.message ?? "Failed to load data",
      });
    }
  },

  addLog: async (log) => {
    set((state) => ({ logs: [log, ...state.logs] }));
    try {
      await insertLog(log);
    } catch (e: any) {
      console.warn("[periodStore] addLog failed:", e?.message);
      set({ error: e?.message ?? "Failed to save log" });
    }
  },

  updateLog: async (id, updates) => {
    set((state) => ({
      logs: state.logs.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
    try {
      await updateLogDb(id, updates);
    } catch (e: any) {
      console.warn("[periodStore] updateLog failed:", e?.message);
      set({ error: e?.message ?? "Failed to update log" });
    }
  },

  removeLog: async (id) => {
    set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
    try {
      await deleteLogDb(id);
    } catch (e: any) {
      console.warn("[periodStore] removeLog failed:", e?.message);
      set({ error: e?.message ?? "Failed to delete log" });
    }
  },

  updateSettings: async (updates) => {
    const next = { ...get().settings, ...updates };
    set({ settings: next });
    try {
      await upsertSettings(next);
    } catch (e: any) {
      console.warn("[periodStore] updateSettings failed:", e?.message);
      set({ error: e?.message ?? "Failed to save settings" });
    }
  },

  reset: async () => {
    set({ logs: [], settings: defaultSettings });
    try {
      await resetAllData();
    } catch (e: any) {
      console.warn("[periodStore] reset failed:", e?.message);
      set({ error: e?.message ?? "Failed to reset data" });
    }
  },
}));
