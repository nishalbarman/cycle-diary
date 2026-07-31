import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserSettings } from '@/shared/types';
import { apiSlice } from './apiSlice';

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

interface SettingsState {
  data: UserSettings;
  hydrated: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  data: DEFAULT_SETTINGS,
  hydrated: false,
  error: null,
};

// RTK Query powered thunks for backwards compatibility
export const hydrateSettings = () => (dispatch: any) =>
  dispatch(apiSlice.endpoints.getSettings.initiate());

export const updateSettings =
  (updates: Partial<UserSettings>) => async (dispatch: any, getState: any) => {
    const current = getState().settings.data as UserSettings;
    const next: UserSettings = { ...current, ...updates };
    // Optimistically apply to local state so the UI updates immediately,
    // then persist via the RTK Query mutation. Roll back if the write fails.
    dispatch(mergeSettings(next));
    try {
      await dispatch(apiSlice.endpoints.updateSettings.initiate(updates)).unwrap();
    } catch (e: any) {
      if (__DEV__) console.warn('[settings] updateSettings failed:', e);
      dispatch(setSettings(current));
    }
  };

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<UserSettings>) {
      state.data = action.payload;
      state.hydrated = true;
    },
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
    builder
      .addMatcher(
        apiSlice.endpoints.getSettings.matchFulfilled,
        (state, action) => {
          state.data = action.payload;
          state.hydrated = true;
        }
      )
      .addMatcher(
        apiSlice.endpoints.updateSettings.matchFulfilled,
        (state, action) => {
          state.data = action.payload;
        }
      )
      .addMatcher(
        apiSlice.endpoints.updateSettings.matchRejected,
        (state, action) => {
          state.error = (action as any).error?.message ?? 'Failed to save settings';
        }
      );
  },
});

export const {
  setSettings,
  mergeSettings,
  setOnboardingComplete,
  setCycleLength,
  clearSettingsError,
} = settingsSlice.actions;

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
