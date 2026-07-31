// src/store/settingsSlice.ts
// Enhanced: full UserSettings management with SQLite persistence + Firebase push
// Migrates Zustand periodStore settings operations
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings } from '@/shared/types';
import {
  ensureReady,
  fetchSettings,
  upsertSettings as upsertSettingsDb,
} from '@/shared/db/repository';
import { pushSettings } from '@/shared/services/sync';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
interface SettingsState {
  data: UserSettings;
  hydrated: boolean;
  error: string | null;
}

export const DEFAULT_SETTINGS: UserSettings = {
  cycleLength: 28,
  periodLength: 5,
  lastPeriodStart: null,
  primaryGoal: 'track_period',
  notificationsEnabled: true,
  notifyBeforeDays: 2,
  notifyTime: '09:00',
  ovulationReminderEnabled: true,
  pillReminderEnabled: false,
  pillNotifyTime: '20:00',
  symptomTracking: true,
  flowTracking: true,
  onboardingComplete: false,
  hasSeenStorageNotice: false,
};

const initialState: SettingsState = {
  data: DEFAULT_SETTINGS,
  hydrated: false,
  error: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────────────────────────

/** Load settings from SQLite on app start */
export const hydrateSettings = createAsyncThunk(
  'settings/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      await ensureReady();
      const settings = await fetchSettings();
      return settings ?? DEFAULT_SETTINGS;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to load settings');
    }
  }
);

/** Persist updated settings to SQLite + Firebase */
export const updateSettings = createAsyncThunk(
  'settings/update',
  async (updates: Partial<UserSettings>, { getState, rejectWithValue }) => {
    try {
      const current = (getState() as any).settings.data as UserSettings;
      const next = { ...current, ...updates };
      await upsertSettingsDb(next);

      // Firebase push (fire-and-forget)
      const syncUid = (getState() as any).log.syncUid as string | null;
      if (syncUid) pushSettings(syncUid, next).catch(() => {});

      return next;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to save settings');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /** Directly set settings (e.g., from Firestore snapshot) */
    setSettings(state, action: PayloadAction<UserSettings>) {
      state.data = action.payload;
      state.hydrated = true;
    },
    /** Merge partial settings without SQLite write (for derived updates from logSlice) */
    mergeSettings(state, action: PayloadAction<Partial<UserSettings>>) {
      state.data = { ...state.data, ...action.payload };
    },
    setOnboardingComplete(state, action: PayloadAction<boolean>) {
      state.data.onboardingComplete = action.payload;
    },
    setCycleLength(state, action: PayloadAction<number>) {
      state.data.cycleLength = action.payload;
    },
    clearSettingsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // hydrateSettings
    builder
      .addCase(hydrateSettings.pending, (state) => {
        state.hydrated = false;
        state.error = null;
      })
      .addCase(hydrateSettings.fulfilled, (state, action) => {
        state.data = action.payload;
        state.hydrated = true;
      })
      .addCase(hydrateSettings.rejected, (state, action) => {
        state.hydrated = true;
        state.error = action.payload as string;
      });

    // updateSettings
    builder
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.data = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setSettings,
  mergeSettings,
  setOnboardingComplete,
  setCycleLength,
  clearSettingsError,
} = settingsSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectSettings = (state: any): UserSettings => state.settings.data;
export const selectSettingsHydrated = (state: any): boolean => state.settings.hydrated;
export const selectSettingsError = (state: any): string | null => state.settings.error;
export const selectOnboardingComplete = (state: any): boolean =>
  state.settings.data.onboardingComplete;
export const selectCycleLength = (state: any): number => state.settings.data.cycleLength;
export const selectPeriodLength = (state: any): number => state.settings.data.periodLength;
export const selectLastPeriodStart = (state: any): string | null =>
  state.settings.data.lastPeriodStart;
export const selectNotificationsEnabled = (state: any): boolean =>
  state.settings.data.notificationsEnabled;

export default settingsSlice.reducer;
