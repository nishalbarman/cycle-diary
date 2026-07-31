import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  ensureReady,
  fetchAllLogs,
  insertLog,
  updateLogDb,
  deleteLogDb,
  fetchSettings,
  upsertSettings,
  resetAllData,
} from '@/shared/db/repository';
import type { PeriodLog, UserSettings } from '@/shared/types';
import { DEFAULT_SETTINGS } from './settingsSlice';
import { buildPeriodGroups, computeCycleLengthStats } from '@/shared/utils/cycle';
import { pushLog, pushLogDelete, pushSettings } from '@/shared/services/sync';

function getSyncUid(getState: any): string | null {
  return (getState() as any).log?.syncUid as string | null;
}

/** Average observed cycle length, or null when there's no completed cycle to measure yet. */
function deriveCycleLength(logs: PeriodLog[]): number | null {
  const stats = computeCycleLengthStats(logs);
  return stats.average > 0 ? stats.average : null;
}

/** Start date of the most recent period group, or null when there are no period logs. */
function deriveLastPeriodStart(logs: PeriodLog[]): string | null {
  const groups = buildPeriodGroups(logs);
  return groups.length > 0 ? groups[groups.length - 1].start : null;
}

/**
 * Recompute auto-derived settings after a period log mutation and persist any
 * meaningful change. The user's own settings are always respected:
 *  - cycleLength is only overwritten when there is real observed data (never a default);
 *  - lastPeriodStart only ever moves forward and never clobbers a manually-set date.
 */
async function syncDerivedSettings(getState: any, allLogs: PeriodLog[]): Promise<void> {
  const current = (await fetchSettings()) ?? DEFAULT_SETTINGS;
  const derivedCycleLength = deriveCycleLength(allLogs);
  const derivedStart = deriveLastPeriodStart(allLogs);

  const next: UserSettings = { ...current };
  let changed = false;

  if (derivedCycleLength !== null && derivedCycleLength !== current.cycleLength) {
    next.cycleLength = derivedCycleLength;
    changed = true;
  }
  if (derivedStart && (!current.lastPeriodStart || derivedStart > current.lastPeriodStart)) {
    next.lastPeriodStart = derivedStart;
    changed = true;
  }

  if (changed) {
    await upsertSettings(next);
    const syncUid = getSyncUid(getState);
    if (syncUid) pushSettings(syncUid, next).catch(() => {});
  }
}

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Log', 'Settings'],
  endpoints: (builder) => ({
    getLogs: builder.query<PeriodLog[], void>({
      async queryFn() {
        try {
          await ensureReady();
          const logs = await fetchAllLogs();
          return { data: logs };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to fetch logs' };
        }
      },
      providesTags: ['Log'],
    }),

    getSettings: builder.query<UserSettings, void>({
      async queryFn() {
        try {
          await ensureReady();
          const settings = await fetchSettings();
          return { data: settings ?? DEFAULT_SETTINGS };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to fetch settings' };
        }
      },
      providesTags: ['Settings'],
    }),

    addLog: builder.mutation<PeriodLog, PeriodLog>({
      async queryFn(log, { getState }) {
        try {
          await ensureReady();
          await insertLog(log);

          if (log.isPeriod) {
            const allLogs = await fetchAllLogs();
            await syncDerivedSettings(getState, allLogs);
          }

          const syncUid = getSyncUid(getState);
          if (syncUid) pushLog(syncUid, log).catch(() => {});

          return { data: log };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to add log' };
        }
      },
      invalidatesTags: ['Log', 'Settings'],
    }),

    updateLog: builder.mutation<{ id: string; updates: Partial<PeriodLog> }, { id: string; updates: Partial<PeriodLog> }>({
      async queryFn({ id, updates }, { getState }) {
        try {
          await ensureReady();
          await updateLogDb(id, updates);

          const allLogs = await fetchAllLogs();
          await syncDerivedSettings(getState, allLogs);

          const syncUid = getSyncUid(getState);
          if (syncUid) {
            const updated = allLogs.find((l) => l.id === id);
            if (updated) pushLog(syncUid, updated).catch(() => {});
          }

          return { data: { id, updates } };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to update log' };
        }
      },
      invalidatesTags: ['Log', 'Settings'],
    }),

    deleteLog: builder.mutation<string, string>({
      async queryFn(id, { getState }) {
        try {
          await ensureReady();
          await deleteLogDb(id);

          const allLogs = await fetchAllLogs();
          await syncDerivedSettings(getState, allLogs);

          const syncUid = getSyncUid(getState);
          if (syncUid) pushLogDelete(syncUid, id).catch(() => {});

          return { data: id };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to delete log' };
        }
      },
      invalidatesTags: ['Log', 'Settings'],
    }),

    updateSettings: builder.mutation<UserSettings, Partial<UserSettings>>({
      async queryFn(updates, { getState }) {
        try {
          await ensureReady();
          const current =
            (getState() as any).settings?.data ??
            (await fetchSettings()) ??
            DEFAULT_SETTINGS;
          const next = { ...current, ...updates };
          await upsertSettings(next);

          // If another settings update landed while persisting, re-apply this
          // one on top of the freshest in-memory state so no change is lost.
          const latest = (getState() as any).settings?.data;
          const merged = latest && latest !== current ? { ...latest, ...updates } : next;
          if (merged !== next) {
            await upsertSettings(merged);
          }

          const syncUid = getSyncUid(getState);
          if (syncUid) pushSettings(syncUid, merged).catch(() => {});
          return { data: merged };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to update settings' };
        }
      },
      invalidatesTags: ['Settings'],
    }),

    resetAll: builder.mutation<void, void>({
      async queryFn() {
        try {
          await ensureReady();
          await resetAllData();
          return { data: undefined };
        } catch (e: any) {
          return { error: e?.message ?? 'Failed to reset data' };
        }
      },
      invalidatesTags: ['Log', 'Settings'],
    }),
  }),
});

export const {
  useGetLogsQuery,
  useGetSettingsQuery,
  useAddLogMutation,
  useUpdateLogMutation,
  useDeleteLogMutation,
  useUpdateSettingsMutation,
  useResetAllMutation,
} = apiSlice;
