import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRewardedAd } from "react-native-google-mobile-ads";

import { useAdActivityStore, type ScreenKey } from "../../store/adActivityStore";
import { useAdConfigStore } from "../../store/adConfigStore";
import { useAdFreeStore } from "../../store/adFreeStore";
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
  const isEnabled = useAdConfigStore((s) => s.isEnabled);
  const isUserBlocked = useAdActivityStore((s) => s.isUserBlocked);
  const isAdFree = useAdFreeStore((s) => s.isAdFree);
  const checkAdFree = useAdFreeStore((s) => s.checkAdFreeStatus);
  const rewardedId = useAdConfigStore((s) => s.rewardedId);
  const pauseTime = useAdConfigStore((s) => s.rewardedAdPauseTime);
  const lastShown = useAdActivityStore(
    (s) => s.lastAdShownTime.rewarded[screenKey],
  );
  const setLastShown = useAdActivityStore((s) => s.setLastRewardedShown);
  const setAnyAdShown = useAdActivityStore((s) => s.setAnyAdLastShownTime);
  const trackFrequent = useAdActivityStore((s) => s.trackFrequentAdClick);
  const trackDaily = useAdActivityStore((s) => s.trackDailyAdClick);
  const startAdFree = useAdFreeStore((s) => s.startAdFree);

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
  const isAdFreeActive = useAdFreeStore((s) => s.isAdFree);
  const canLoadAd = !!adUnitId && !isAdFreeActive;
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
    isEarnedReward,
    reward,
    error,
    canLoadAd,
    canShowAd,
    load,
    show: handleShow,
    adUnitId,
  };
}
