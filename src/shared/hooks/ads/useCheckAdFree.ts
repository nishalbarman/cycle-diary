import { useEffect, useState } from "react";
import { useAdFreeStore } from "../../store/adFreeStore";

const HOUR_MS = 60 * 60 * 1000;

export interface UseCheckAdFreeResult {
  isAdFree: boolean;
  remainingMs: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingLabel: string;
  startAdFree: () => void;
  checkAdFreeStatus: () => void;
}

export function useCheckAdFree(): UseCheckAdFreeResult {
  const isAdFree = useAdFreeStore((s) => s.isAdFree);
  const adFreeStartTime = useAdFreeStore((s) => s.adFreeStartTime);
  const adFreeUnlockTime = useAdFreeStore((s) => s.adFreeUnlockTime);
  const startAdFree = useAdFreeStore((s) => s.startAdFree);
  const checkAdFreeStatus = useAdFreeStore((s) => s.checkAdFreeStatus);

  const [, setTick] = useState(0);
  useEffect(() => {
    if (!isAdFree) return;
    const id = setInterval(() => {
      checkAdFreeStatus();
      setTick((t) => t + 1);
    }, 30_000);
    return () => clearInterval(id);
  }, [isAdFree, checkAdFreeStatus]);

  const windowMs = adFreeUnlockTime * HOUR_MS;
  const remainingMs = isAdFree && adFreeStartTime
    ? Math.max(0, windowMs - (Date.now() - adFreeStartTime))
    : 0;
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const remainingHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const remainingLabel = remainingHours > 0
    ? `${remainingHours}h ${remainingMinutes}m`
    : `${remainingMinutes}m`;

  return {
    isAdFree,
    remainingMs,
    remainingHours,
    remainingMinutes,
    remainingLabel,
    startAdFree,
    checkAdFreeStatus,
  };
}
