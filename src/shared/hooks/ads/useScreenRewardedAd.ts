import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setLastRewardedShown,
  setAnyAdLastShownTime,
  trackFrequentAdClick,
  trackDailyAdClick,
  selectIsUserBlocked,
  selectRewardedLastShown,
  type ScreenKey,
} from "@/store/adActivitySlice";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsAdFree, checkAdFreeStatus, startAdFree as startAdFreeAction } from "@/store/adFreeSlice";
import { getAdRequestOptions, isNpa } from "../../services/ads";
import { isUserBlockedFromAds } from "../../services/ads/fraud";

export interface UseScreenRewardedAdResult {
  isLoaded: boolean;
  isOpened: boolean;
  isClosed: boolean;
  isClicked: boolean;
  isEarnedReward: boolean;
  reward: { type: string; amount: number } | null;
  error: Error | null;
  canLoadAd: boolean;
  canShowAd: boolean;
  load: () => void;
  show: () => void;
  adUnitId: string | null;
}

export function useScreenRewardedAd(
  screenKey: ScreenKey,
): UseScreenRewardedAdResult {
  const dispatch = useAppDispatch();
  const isEnabled = useAppSelector(selectAdEnabled);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const isAdFree = useAppSelector(selectIsAdFree);
  const rewardedId = useAppSelector((s) => s.adConfig.rewardedId);
  const pauseTime = useAppSelector((s) => s.adConfig.rewardedAdPauseTime);
  const lastShown = useAppSelector(selectRewardedLastShown(screenKey));

  const checkAdFree = useCallback(() => dispatch(checkAdFreeStatus()), [dispatch]);
  const setLastShown = useCallback((sk: ScreenKey, t?: number) => dispatch(setLastRewardedShown({ screen: sk, time: t })), [dispatch]);
  const setAnyAdShown = useCallback((t: number) => dispatch(setAnyAdLastShownTime(t)), [dispatch]);
  const trackFrequent = useCallback(() => dispatch(trackFrequentAdClick()), [dispatch]);
  const trackDaily = useCallback(() => dispatch(trackDailyAdClick()), [dispatch]);
  const startAdFree = useCallback(() => dispatch(startAdFreeAction()), [dispatch]);

  const npa = useMemo(() => getAdRequestOptions(), [isNpa()]);
  const isDeviceBlocked = isUserBlockedFromAds();

  const adUnitId = useMemo(() => {
    if (!isEnabled) return null;
    if (isUserBlocked || isDeviceBlocked) return null;
    return rewardedId;
  }, [isEnabled, isUserBlocked, isDeviceBlocked, rewardedId]);

  const {
    isLoaded,
    isClosed,
    isOpened,
    isClicked,
    isEarnedReward,
    reward,
    error,
    load,
    show,
  } = useRewardedAd(adUnitId, npa);

  useEffect(() => {
    if (!adUnitId) return;
    if (isAdFree) checkAdFree();
  }, [adUnitId, isAdFree, checkAdFree]);

  useEffect(() => {
    if (isClicked) {
      trackFrequent();
      trackDaily();
    }
  }, [isClicked, trackFrequent, trackDaily]);

  useEffect(() => {
    if (isEarnedReward && reward) {
      startAdFree();
    }
  }, [isEarnedReward, reward, startAdFree]);

  const pauseRemaining = lastShown ? Date.now() - lastShown < pauseTime : false;
  const canLoadAd = !!adUnitId && !isAdFree;
  const canShowAd = canLoadAd && isLoaded && !pauseRemaining;

  const lastClosedRef = useRef<number>(0);
  useEffect(() => {
    if (isClosed) {
      const now = Date.now();
      if (now - lastClosedRef.current < 500) return;
      lastClosedRef.current = now;
      setLastShown(screenKey, now);
      setAnyAdShown(now);
    }
  }, [isClosed, screenKey, setLastShown, setAnyAdShown]);

  const handleShow = useCallback(() => {
    if (!canShowAd) return;
    show();
  }, [canShowAd, show]);

  return {
    isLoaded,
    isOpened,
    isClosed,
    isClicked,
    error: error ?? null,
    isEarnedReward: isEarnedReward ?? false,
    reward: reward ?? null,
    canLoadAd,
    canShowAd,
    load,
    show: handleShow,
    adUnitId,
  };
}
