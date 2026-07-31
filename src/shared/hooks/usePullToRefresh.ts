// src/shared/hooks/usePullToRefresh.ts
// Migrated from Zustand usePeriodStore → Redux dispatch
import { useState, useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { rehydrateAfterSync } from '@/store/logSlice';
import { hydrateSettings } from '@/store/settingsSlice';

export function usePullToRefresh() {
  const dispatch = useAppDispatch();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(rehydrateAfterSync()),
        dispatch(hydrateSettings()),
      ]);
    } catch {
      // Errors are surfaced via Redux error state
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  return { refreshing, onRefresh };
}
