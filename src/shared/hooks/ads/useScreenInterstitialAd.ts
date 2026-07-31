import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setLastInterstitialShown,
  setAnyAdLastShownTime,
  trackFrequentAdClick,
  trackDailyAdClick,
  selectIsUserBlocked,
  selectInterstitialLastShown,
  type ScreenKey,
} from "@/store/adActivitySlice";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsAdFree, checkAdFreeStatus } from "@/store/adFreeSlice";
import { getAdRequestOptions, isNpa } from "../../services/ads";
import { isUserBlockedFromAds } from "../../services/ads/fraud";

export interface UseScreenInterstitialAdResult {
  isLoaded: boolean;
  isOpened: boolean;
  isClosed: boolean;
  isClicked: boolean;
  error: Error | null;
  canLoadAd: boolean;
  canShowAd: boolean;
  load: () => void;
  show: () => void;
  adUnitId: string | null;
}

export function useScreenInterstitialAd(
  screenKey: ScreenKey,
): UseScreenInterstitialAdResult {
  const dispatch = useAppDispatch();
  const isEnabled = useAppSelector(selectAdEnabled);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const isAdFree = useAppSelector(selectIsAdFree);
  const interstitialId = useAppSelector((s) => s.adConfig.interstitialId);
  const pauseTime = useAppSelector((s) => s.adConfig.interstitialAdPauseTime);
  const lastShown = useAppSelector(selectInterstitialLastShown(screenKey));

  const checkAdFree = useCallback(() => dispatch(checkAdFreeStatus()), [dispatch]);
  const setLastShown = useCallback((sk: ScreenKey, t?: number) => dispatch(setLastInterstitialShown({ screen: sk, time: t })), [dispatch]);
  const setAnyAdShown = useCallback((t: number) => dispatch(setAnyAdLastShownTime(t)), [dispatch]);
  const trackFrequent = useCallback(() => dispatch(trackFrequentAdClick()), [dispatch]);
  const trackDaily = useCallback(() => dispatch(trackDailyAdClick()), [dispatch]);

  const npa = useMemo(() => getAdRequestOptions(), [isNpa()]);
  const isDeviceBlocked = isUserBlockedFromAds();

  const adUnitId = useMemo(() => {
    if (!isEnabled) return null;
    if (isUserBlocked || isDeviceBlocked) return null;
    return interstitialId;
  }, [isEnabled, isUserBlocked, isDeviceBlocked, interstitialId]);

  const { isLoaded, isClosed, isOpened, isClicked, error, load, show } =
    useInterstitialAd(adUnitId, npa);

  useEffect(() => {
    if (!adUnitId) return;
    if (isAdFree) {
      checkAdFree();
    }
  }, [adUnitId, isAdFree, checkAdFree]);

  useEffect(() => {
    if (isClicked) {
      trackFrequent();
      trackDaily();
    }
  }, [isClicked, trackFrequent, trackDaily]);

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
    canLoadAd,
    canShowAd,
    load,
    show: handleShow,
    adUnitId,
  };
}
