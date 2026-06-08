import { useCallback, useEffect, useMemo, useRef } from "react";
import { useInterstitialAd } from "react-native-google-mobile-ads";

import { useAdActivityStore, type ScreenKey } from "../../store/adActivityStore";
import { useAdConfigStore } from "../../store/adConfigStore";
import { useAdFreeStore } from "../../store/adFreeStore";
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
  const isEnabled = useAdConfigStore((s) => s.isEnabled);
  const isUserBlocked = useAdActivityStore((s) => s.isUserBlocked);
  const isAdFree = useAdFreeStore((s) => s.isAdFree);
  const checkAdFree = useAdFreeStore((s) => s.checkAdFreeStatus);
  const interstitialId = useAdConfigStore((s) => s.interstitialId);
  const pauseTime = useAdConfigStore((s) => s.interstitialAdPauseTime);
  const lastShown = useAdActivityStore(
    (s) => s.lastAdShownTime.interstitial[screenKey],
  );
  const setLastShown = useAdActivityStore((s) => s.setLastInterstitialShown);
  const setAnyAdShown = useAdActivityStore((s) => s.setAnyAdLastShownTime);
  const trackFrequent = useAdActivityStore((s) => s.trackFrequentAdClick);
  const trackDaily = useAdActivityStore((s) => s.trackDailyAdClick);

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

  const isAdFreeActive = useAdFreeStore((s) => s.isAdFree);
  const pauseRemaining = lastShown ? Date.now() - lastShown < pauseTime : false;

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
    error,
    canLoadAd,
    canShowAd,
    load,
    show: handleShow,
    adUnitId,
  };
}
