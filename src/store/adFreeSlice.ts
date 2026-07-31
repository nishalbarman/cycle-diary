// src/store/adFreeSlice.ts
// Migrated from src/shared/store/adFreeStore.ts (Zustand) → Redux Toolkit slice
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const HOUR_MS = 60 * 60 * 1000;
const DEFAULT_HOURS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
interface AdFreeState {
  isAdFree: boolean;
  adFreeStartTime: number | null;
  adFreeUnlockTime: number; // hours
  isFetchedAndActivated: boolean;
}

const initialState: AdFreeState = {
  isAdFree: false,
  adFreeStartTime: null,
  adFreeUnlockTime: DEFAULT_HOURS,
  isFetchedAndActivated: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
const adFreeSlice = createSlice({
  name: 'adFree',
  initialState,
  reducers: {
    startAdFree(state) {
      state.isAdFree = true;
      state.adFreeStartTime = Date.now();
    },
    setAdFreeUnlockTime(state, action: PayloadAction<number>) {
      state.adFreeUnlockTime = action.payload;
    },
    checkAdFreeStatus(state) {
      if (!state.isAdFree || !state.adFreeStartTime) return;
      const elapsed = Date.now() - state.adFreeStartTime;
      const windowMs = state.adFreeUnlockTime * HOUR_MS;
      if (elapsed >= windowMs) {
        state.isAdFree = false;
        state.adFreeStartTime = null;
      }
    },
    setFetchedAndActivated(state, action: PayloadAction<boolean>) {
      state.isFetchedAndActivated = action.payload;
    },
    reset() {
      return initialState;
    },
  },
});

export const {
  startAdFree,
  setAdFreeUnlockTime,
  setAdFreeUnlockTime: updateAdFreeUnlockTime,
  checkAdFreeStatus,
  setFetchedAndActivated: setAdFreeFetchedAndActivated,
  setFetchedAndActivated: updateIsFetchedAndActivated,
  reset: resetAdFree,
} = adFreeSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectIsAdFree = (state: any): boolean => state.adFree.isAdFree;
export const selectAdFreeRemainingMs = (state: any): number => {
  const { isAdFree, adFreeStartTime, adFreeUnlockTime } = state.adFree;
  if (!isAdFree || !adFreeStartTime) return 0;
  const elapsed = Date.now() - adFreeStartTime;
  const windowMs = adFreeUnlockTime * HOUR_MS;
  return Math.max(0, windowMs - elapsed);
};

export default adFreeSlice.reducer;
