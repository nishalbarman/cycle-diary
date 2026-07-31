// src/store/logSlice.ts
// Enhanced with full sync support and Firebase push — migrates Zustand periodStore log logic
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PeriodLog } from '@/shared/types';
import {
  ensureReady,
  fetchAllLogs,
  insertLog,
  updateLogDb,
  deleteLogDb,
  resetAllData,
} from '@/shared/db/repository';
import { pushLog, pushLogDelete, SyncStatus } from '@/shared/services/sync';
import { buildPeriodGroups, computeCycleLengthStats } from '@/shared/utils/cycle';
import { upsertSettings } from '@/shared/db/repository';

// ─────────────────────────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function deriveCycleLength(logs: PeriodLog[]): number {
  const stats = computeCycleLengthStats(logs);
  return stats.average > 0 ? stats.average : 28;
}

function deriveLastPeriodStart(logs: PeriodLog[]): string | null {
  const groups = buildPeriodGroups(logs);
  return groups.length > 0 ? groups[groups.length - 1].start : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Async Thunks
// ─────────────────────────────────────────────────────────────────────────────

/** Load all logs from SQLite on app start */
export const hydrateLogs = createAsyncThunk(
  'log/hydrate',
  async (_, { rejectWithValue }) => {
    try {
      await ensureReady();
      return await fetchAllLogs();
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to hydrate logs');
    }
  }
);

/** Add a log: optimistic update → SQLite insert → Firebase push */
export const addLog = createAsyncThunk(
  'log/add',
  async (log: PeriodLog, { getState, rejectWithValue }) => {
    try {
      await insertLog(log);

      // If this is a period log, update derived settings
      const state = (getState() as any).log;
      const updatedLogs = [log, ...state.logs];
      if (log.isPeriod) {
        const settings = (getState() as any).settings.data;
        if (settings) {
          const nextSettings = {
            ...settings,
            cycleLength: deriveCycleLength(updatedLogs),
            lastPeriodStart: deriveLastPeriodStart(updatedLogs) ?? settings.lastPeriodStart,
          };
          await upsertSettings(nextSettings);
        }
      }

      // Firebase push (fire-and-forget)
      const syncUid = state.syncUid;
      if (syncUid) {
        pushLog(syncUid, log).catch(() => {});
      }

      return log;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to add log');
    }
  }
);

/** Update a log: SQLite update → Firebase push */
export const updateLog = createAsyncThunk(
  'log/update',
  async ({ id, updates }: { id: string; updates: Partial<PeriodLog> }, { getState, rejectWithValue }) => {
    try {
      await updateLogDb(id, updates);

      const state = (getState() as any).log;
      const syncUid = state.syncUid;
      if (syncUid) {
        const updated = state.logs.find((l: PeriodLog) => l.id === id);
        if (updated) pushLog(syncUid, { ...updated, ...updates }).catch(() => {});
      }

      return { id, updates };
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to update log');
    }
  }
);

/** Remove a log: SQLite delete → Firebase delete */
export const removeLog = createAsyncThunk(
  'log/remove',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      await deleteLogDb(id);

      const state = (getState() as any).log;
      const syncUid = state.syncUid;
      if (syncUid) {
        pushLogDelete(syncUid, id).catch(() => {});
      }

      return id;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to delete log');
    }
  }
);

/** Reset all data (used in "Danger Zone") */
export const resetAll = createAsyncThunk(
  'log/resetAll',
  async (_, { rejectWithValue }) => {
    try {
      await resetAllData();
      return true;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to reset data');
    }
  }
);

/** Re-hydrate logs after Firestore sync writes to SQLite */
export const rehydrateAfterSync = createAsyncThunk(
  'log/rehydrateAfterSync',
  async (_, { rejectWithValue }) => {
    try {
      return await fetchAllLogs();
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to re-hydrate');
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Slice
// ─────────────────────────────────────────────────────────────────────────────
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
    /** Directly inject logs (used by Firestore listener after sync) */
    setLogs(state, action: PayloadAction<PeriodLog[]>) {
      state.logs = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // hydrateLogs
    builder
      .addCase(hydrateLogs.pending, (state) => {
        state.hydrated = false;
        state.error = null;
      })
      .addCase(hydrateLogs.fulfilled, (state, action) => {
        state.logs = action.payload;
        state.hydrated = true;
      })
      .addCase(hydrateLogs.rejected, (state, action) => {
        state.hydrated = true;
        state.error = action.payload as string;
      });

    // addLog
    builder
      .addCase(addLog.fulfilled, (state, action) => {
        const payload = action.payload;
        const idx = state.logs.findIndex((l) => l.id === payload.id || l.date === payload.date);
        if (idx !== -1) {
          state.logs[idx] = payload;
        } else {
          state.logs.unshift(payload);
        }
        state.logs.sort((a, b) => (a.date > b.date ? -1 : 1));
      })
      .addCase(addLog.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // updateLog
    builder
      .addCase(updateLog.fulfilled, (state, action) => {
        const { id, updates } = action.payload as any;
        const idx = state.logs.findIndex((l) => l.id === id);
        if (idx !== -1) {
          state.logs[idx] = { ...state.logs[idx], ...updates } as PeriodLog;
        }
      })
      .addCase(updateLog.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // removeLog
    builder
      .addCase(removeLog.fulfilled, (state, action) => {
        state.logs = state.logs.filter((l) => l.id !== action.payload);
      })
      .addCase(removeLog.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // resetAll
    builder.addCase(resetAll.fulfilled, (state) => {
      state.logs = [];
    });

    // rehydrateAfterSync
    builder.addCase(rehydrateAfterSync.fulfilled, (state, action) => {
      state.logs = action.payload;
    });
  },
});

export const { upsertLogLocal, setSyncStatus, setSyncUid, setLogs, clearError } = logSlice.actions;

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────
export const selectLogs = (state: any): PeriodLog[] => state.log.logs;
export const selectLogHydrated = (state: any): boolean => state.log.hydrated;
export const selectLogError = (state: any): string | null => state.log.error;
export const selectSyncStatus = (state: any): SyncStatus => state.log.syncStatus;
export const selectSyncUid = (state: any): string | null => state.log.syncUid;
export const selectPeriodLogs = (state: any): PeriodLog[] =>
  state.log.logs.filter((l: PeriodLog) => l.isPeriod);

export default logSlice.reducer;
