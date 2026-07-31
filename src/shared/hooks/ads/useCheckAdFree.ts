import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectIsAdFree,
  startAdFree as startAdFreeAction,
  checkAdFreeStatus as checkAdFreeStatusAction,
} from "@/store/adFreeSlice";

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
  const dispatch = useAppDispatch();
  const isAdFree = useAppSelector(selectIsAdFree);
  const adFreeStartTime = useAppSelector((s) => s.adFree.adFreeStartTime);
  const adFreeUnlockTime = useAppSelector((s) => s.adFree.adFreeUnlockTime);

  const startAdFree = useCallback(() => {
    dispatch(startAdFreeAction());
  }, [dispatch]);

  const checkAdFreeStatus = useCallback(() => {
    dispatch(checkAdFreeStatusAction());
  }, [dispatch]);

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
