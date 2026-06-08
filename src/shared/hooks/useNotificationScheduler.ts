import { useEffect, useRef } from "react";
import { usePeriodStore } from "@/shared/store/periodStore";
import { rescheduleAll } from "@/shared/services/notifications";

export function useNotificationScheduler() {
  const logs = usePeriodStore((s) => s.logs);
  const settings = usePeriodStore((s) => s.settings);
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
