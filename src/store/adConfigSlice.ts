// src/store/adConfigSlice.ts
// Migrated from src/shared/store/adConfigStore.ts (Zustand) → Redux Toolkit slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
export interface AdConfigState {
  isEnabled: boolean;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  appOpenId: string;
  nativeId: string;
  appOpenAdPauseTime: number;
  interstitialAdPauseTime: number;
  rewardedAdPauseTime: number;
  frequentInterval: number;
  maximumAllowedFrequentClicks: number;
  maximumAllowedClicksPerDay: number;
  adFreeUnlockTime: number;
  fetchedActivated: boolean;
}

const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
  rewarded: 'ca-app-pub-3940256099942544/5224354917',
  appOpen: 'ca-app-pub-3940256099942544/9257395921',
  native: 'ca-app-pub-3940256099942544/2247696110',
};

export const DEFAULT_AD_CONFIG: AdConfigState = {
  isEnabled: false,
  bannerId: TEST_IDS.banner,
  interstitialId: TEST_IDS.interstitial,
  rewardedId: TEST_IDS.rewarded,
  appOpenId: TEST_IDS.appOpen,
  nativeId: TEST_IDS.native,
  appOpenAdPauseTime: 120_000,
  interstitialAdPauseTime: 60_000,
  rewardedAdPauseTime: 60_000,
  frequentInterval: 1_000,
  maximumAllowedFrequentClicks: 3,
  maximumAllowedClicksPerDay: 7,
  adFreeUnlockTime: 5,
  fetchedActivated: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const adConfigSlice = createSlice({
  name: 'adConfig',
  initialState: DEFAULT_AD_CONFIG,
  reducers: {
    setAll(state, action: PayloadAction<Partial<AdConfigState>>) {
      return { ...state, ...action.payload };
    },
    setFetchedActivated(state, action: PayloadAction<boolean>) {
      state.fetchedActivated = action.payload;
    },
    reset() {
      return DEFAULT_AD_CONFIG;
    },
  },
});

export const { setAll: setAdConfig, setAll: updateAdConfig, setFetchedActivated, reset: resetAdConfig } = adConfigSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectAdConfig = (state: any): AdConfigState => state.adConfig;
export const selectAdEnabled = (state: any): boolean => state.adConfig.isEnabled;
export const selectAdFrequentInterval = (state: any): number => state.adConfig.frequentInterval;
export const selectAdDailyClickThreshold = (state: any): number =>
  state.adConfig.maximumAllowedClicksPerDay ?? 7;
export const selectMaxFrequentClicks = (state: any): number => state.adConfig.maximumAllowedFrequentClicks;

export default adConfigSlice.reducer;
