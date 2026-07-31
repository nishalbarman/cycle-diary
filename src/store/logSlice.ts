import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PeriodLog } from '@/shared/types';
import { SyncStatus } from '@/shared/services/sync';
import { apiSlice } from './apiSlice';

interface LogState {
  logs: PeriodLog[];
  hydrated: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  syncUid: string | null;
}

const initialState: LogState = {
  logs: [],
  hydrated: false,
  error: null,
  syncStatus: 'idle',
  syncUid: null,
};

// RTK Query powered thunks for backwards compatibility
export const hydrateLogs = () => (dispatch: any) =>
  dispatch(apiSlice.endpoints.getLogs.initiate());

export const addLog = (log: PeriodLog) => (dispatch: any) =>
  dispatch(apiSlice.endpoints.addLog.initiate(log));

export const updateLog = ({ id, updates }: { id: string; updates: Partial<PeriodLog> }) => (dispatch: any) =>
  dispatch(apiSlice.endpoints.updateLog.initiate({ id, updates }));

export const removeLog = (id: string) => (dispatch: any) =>
  dispatch(apiSlice.endpoints.deleteLog.initiate(id));

export const resetAll = () => (dispatch: any) =>
  dispatch(apiSlice.endpoints.resetAll.initiate());

export const rehydrateAfterSync = () => (dispatch: any) =>
  dispatch(apiSlice.endpoints.getLogs.initiate());

const logSlice = createSlice({
  name: 'log',
  initialState,
  reducers: {
    upsertLogLocal(state, action: PayloadAction<PeriodLog>) {
      const payload = action.payload;
      const idx = state.logs.findIndex((l) => l.id === payload.id || l.date === payload.date);
      if (idx !== -1) {
        state.logs[idx] = { ...state.logs[idx], ...payload };
      } else {
        state.logs.unshift(payload);
      }
      state.logs.sort((a, b) => (a.date > b.date ? -1 : 1));
    },
    setSyncStatus(state, action: PayloadAction<SyncStatus>) {
      state.syncStatus = action.payload;
    },
    setSyncUid(state, action: PayloadAction<string | null>) {
      state.syncUid = action.payload;
    },
    setLogs(state, action: PayloadAction<PeriodLog[]>) {
      state.logs = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(apiSlice.endpoints.getLogs.matchFulfilled, (state, action) => {
        state.logs = action.payload;
        state.hydrated = true;
      })
      .addMatcher(apiSlice.endpoints.addLog.matchFulfilled, (state, action) => {
        const payload = action.payload;
        const idx = state.logs.findIndex((l) => l.id === payload.id || l.date === payload.date);
        if (idx !== -1) {
          state.logs[idx] = payload;
        } else {
          state.logs.unshift(payload);
        }
        state.logs.sort((a, b) => (a.date > b.date ? -1 : 1));
      })
      .addMatcher(apiSlice.endpoints.updateLog.matchFulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const idx = state.logs.findIndex((l) => l.id === id);
        if (idx !== -1) {
          state.logs[idx] = { ...state.logs[idx], ...updates } as PeriodLog;
        }
      })
      .addMatcher(apiSlice.endpoints.deleteLog.matchFulfilled, (state, action) => {
        state.logs = state.logs.filter((l) => l.id !== action.payload);
      })
      .addMatcher(apiSlice.endpoints.resetAll.matchFulfilled, (state) => {
        state.logs = [];
      });
  },
});

export const { upsertLogLocal, setSyncStatus, setSyncUid, setLogs, clearError } = logSlice.actions;

export const selectLogs = (state: any): PeriodLog[] => state.log.logs;
export const selectLogHydrated = (state: any): boolean => state.log.hydrated;
export const selectLogError = (state: any): string | null => state.log.error;
export const selectSyncStatus = (state: any): SyncStatus => state.log.syncStatus;
export const selectSyncUid = (state: any): string | null => state.log.syncUid;
export const selectPeriodLogs = (state: any): PeriodLog[] =>
  state.log.logs.filter((l: PeriodLog) => l.isPeriod);

export default logSlice.reducer;
