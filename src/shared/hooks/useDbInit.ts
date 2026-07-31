// src/shared/hooks/useDbInit.ts
// Migrated from Zustand usePeriodStore → Redux dispatch
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { hydrateLogs, selectLogHydrated } from '@/store/logSlice';
import { hydrateSettings, selectSettingsHydrated } from '@/store/settingsSlice';

export function useDbInit() {
  const dispatch = useAppDispatch();
  const logsHydrated = useAppSelector(selectLogHydrated);
  const settingsHydrated = useAppSelector(selectSettingsHydrated);

  useEffect(() => {
    if (!logsHydrated) {
      dispatch(hydrateLogs());
    }
  }, [logsHydrated, dispatch]);

  useEffect(() => {
    if (!settingsHydrated) {
      dispatch(hydrateSettings());
    }
  }, [settingsHydrated, dispatch]);
}
