// src/store/adActivitySlice.ts
// Migrated from src/shared/store/adActivityStore.ts (Zustand) → Redux Toolkit slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { selectAdFrequentInterval, selectAdDailyClickThreshold, selectMaxFrequentClicks } from './adConfigSlice';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type ScreenKey =
  | 'home'
  | 'calendar'
  | 'history'
  | 'profile'
  | 'settings'
  | 'ad_free_unlock'
  | 'action';

export interface AdActivityState {
  lastAdShownTime: {
    anyAdLastShownTime: number | null;
    interstitial: Record<ScreenKey, number | null>;
    rewarded: Record<ScreenKey, number | null>;
    appOpen: number | null;
  };
  totalAdClickCount: number;
  frequentAdClickCount: number;
  lastClickTimestamp: number | null;
  totalAdClickCountToday: number;
  lastClickDate: string | null;
  isUserBlocked: boolean;
}

const SCREEN_KEYS: ScreenKey[] = ['home', 'calendar', 'history', 'profile', 'settings', 'ad_free_unlock', 'action'];
const nullMap = () =>
  Object.fromEntries(SCREEN_KEYS.map((k) => [k, null])) as Record<ScreenKey, null>;

const initialState: AdActivityState = {
  lastAdShownTime: {
    anyAdLastShownTime: null,
    interstitial: nullMap(),
    rewarded: nullMap(),
    appOpen: null,
  },
  totalAdClickCount: 0,
  frequentAdClickCount: 0,
  lastClickTimestamp: null,
  totalAdClickCountToday: 0,
  lastClickDate: null,
  isUserBlocked: false,
};

const today = () => new Date().toISOString().slice(0, 10);

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const adActivitySlice = createSlice({
  name: 'adActivity',
  initialState,
  reducers: {
    setLastInterstitialShown(state, action: PayloadAction<{ screen: ScreenKey; time?: number }>) {
      const { screen, time = Date.now() } = action.payload;
      state.lastAdShownTime.interstitial[screen] = time;
    },
    setLastRewardedShown(state, action: PayloadAction<{ screen: ScreenKey; time?: number }>) {
      const { screen, time = Date.now() } = action.payload;
      state.lastAdShownTime.rewarded[screen] = time;
    },
    setAnyAdLastShownTime(state, action: PayloadAction<number>) {
      state.lastAdShownTime.anyAdLastShownTime = action.payload;
    },
    setAppOpenLastShown(state, action: PayloadAction<number>) {
      state.lastAdShownTime.appOpen = action.payload;
    },
    // trackFrequentAdClick requires access to adConfig state — use thunk (see below)
    _applyFrequentClick(
      state,
      action: PayloadAction<{ now: number; frequentInterval: number; maxFrequentClicks: number }>
    ) {
      const { now, frequentInterval, maxFrequentClicks } = action.payload;
      if (state.lastClickTimestamp && now - state.lastClickTimestamp <= frequentInterval) {
        const next = state.frequentAdClickCount + 1;
        state.frequentAdClickCount = next;
        state.lastClickTimestamp = now;
        state.totalAdClickCount += 1;
        if (next >= maxFrequentClicks) {
          state.isUserBlocked = true;
          if (__DEV__) console.warn('[ads] Anti-Fraud triggered: Rapid ad clicks detected. User blocked from ads.');
        }
      } else {
        state.frequentAdClickCount = 1;
        state.lastClickTimestamp = now;
        state.totalAdClickCount += 1;
      }
    },
    _applyDailyClick(
      state,
      action: PayloadAction<{ threshold: number }>
    ) {
      if (state.isUserBlocked) return;
      const t = today();
      const baseCount = state.lastClickDate === t ? state.totalAdClickCountToday : 0;
      const next = baseCount + 1;
      state.lastClickDate = t;
      state.totalAdClickCountToday = next;
      if (next >= action.payload.threshold) {
        state.isUserBlocked = true;
        if (__DEV__) console.warn(`[ads] Anti-Fraud triggered: Daily click cap (${action.payload.threshold}) reached. User blocked from ads.`);
      }
    },
    setUserBlocked(state, action: PayloadAction<boolean>) {
      state.isUserBlocked = action.payload;
    },
    reset() {
      return initialState;
    },
  },
});

export const {
  setLastInterstitialShown,
  setLastRewardedShown,
  setAnyAdLastShownTime,
  setAppOpenLastShown,
  _applyFrequentClick,
  _applyDailyClick,
  setUserBlocked,
  reset: resetAdActivity,
} = adActivitySlice.actions;

import { recordAdInteraction } from '@/shared/services/ads/fraud';

// ─────────────────────────────────────────────────────────────────────────────
// Thunks (need to read adConfig state)
// ─────────────────────────────────────────────────────────────────────────────
export const trackFrequentAdClick = () => (dispatch: any, getState: any) => {
  const state = getState();
  const frequentInterval = selectAdFrequentInterval(state);
  const maxFrequentClicks = selectMaxFrequentClicks(state);
  dispatch(_applyFrequentClick({ now: Date.now(), frequentInterval, maxFrequentClicks }));
  recordAdInteraction('click').catch(() => {});
};

export const trackDailyAdClick = () => (dispatch: any, getState: any) => {
  const state = getState();
  const threshold = selectAdDailyClickThreshold(state);
  dispatch(_applyDailyClick({ threshold }));
};

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectAdActivity = (state: any): AdActivityState => state.adActivity;
export const selectIsUserBlocked = (state: any): boolean => state.adActivity.isUserBlocked;
export const selectInterstitialLastShown = (screen: ScreenKey) => (state: any): number | null =>
  state.adActivity.lastAdShownTime.interstitial[screen];
export const selectRewardedLastShown = (screen: ScreenKey) => (state: any): number | null =>
  state.adActivity.lastAdShownTime.rewarded[screen];
export const selectAnyAdLastShownTime = (state: any): number | null =>
  state.adActivity.lastAdShownTime.anyAdLastShownTime;
export const selectAppOpenLastShown = (state: any): number | null =>
  state.adActivity.lastAdShownTime.appOpen;

export default adActivitySlice.reducer;
