// src/store/periodSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import dayjs from 'dayjs';

export interface PeriodState {
  periods: string[]; // ISO date strings
  settings: {
    onboardingComplete: boolean;
    cycleLength: number; // days, default 28
  };
}

const initialState: PeriodState = {
  periods: [],
  settings: {
    onboardingComplete: false,
    cycleLength: 28,
  },
};

const periodSlice = createSlice({
  name: 'period',
  initialState,
  reducers: {
    addPeriod(state, action: PayloadAction<string>) {
      if (!state.periods.includes(action.payload)) {
        state.periods.push(action.payload);
        state.periods.sort();
      }
    },
    setCycleLength(state, action: PayloadAction<number>) {
      state.settings.cycleLength = action.payload;
    },
    completeOnboarding(state) {
      state.settings.onboardingComplete = true;
    },
  },
});

export const { addPeriod, setCycleLength, completeOnboarding } = periodSlice.actions;

export const selectPeriods = (state: any) => state.period.periods;
export const selectSettings = (state: any) => state.period.settings;
export const selectNextPrediction = (state: any) => {
  const { periods, settings } = state.period as PeriodState;
  if (periods.length === 0) return null;
  const last = dayjs(periods[periods.length - 1]);
  return last.add(settings.cycleLength, 'day').format('YYYY-MM-DD');
};

export default periodSlice.reducer;
