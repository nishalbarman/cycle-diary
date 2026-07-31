// src/shared/hooks/useNotificationScheduler.ts
// Migrated from Zustand usePeriodStore → Redux selectors
import { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import { selectLogs } from '@/store/logSlice';
import { selectSettings } from '@/store/settingsSlice';
import { rescheduleAll } from '@/shared/services/notifications';

export function useNotificationScheduler() {
  const logs = useAppSelector(selectLogs);
  const settings = useAppSelector(selectSettings);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    rescheduleAll(logs, settings).catch(() => {});
  }, [
    logs,
    settings.notificationsEnabled,
    settings.notifyBeforeDays,
    settings.notifyTime,
    settings.cycleLength,
    settings.periodLength,
    settings.lastPeriodStart,
  ]);
}
