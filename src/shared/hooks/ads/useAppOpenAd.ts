import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";

import { useAdConfigStore } from "../../store/adConfigStore";
import { useAdActivityStore } from "../../store/adActivityStore";
import { useAdFreeStore } from "../../store/adFreeStore";
import { getAdRequestOptions, isNpa } from "../../services/ads";
import { isUserBlockedFromAds } from "../../services/ads/fraud";

export function useAppOpenAd(): void {
  const isEnabled = useAdConfigStore((s) => s.isEnabled);
  const appOpenId = useAdConfigStore((s) => s.appOpenId);
  const pauseTime = useAdConfigStore((s) => s.appOpenAdPauseTime);
  const isUserBlocked = useAdActivityStore((s) => s.isUserBlocked);
  const isAdFree = useAdFreeStore((s) => s.isAdFree);
  const setLastShown = useAdActivityStore((s) => s.setAppOpenLastShown);
  const setAnyAdShown = useAdActivityStore((s) => s.setAnyAdLastShownTime);
  const lastShown = useAdActivityStore((s) => s.lastAdShownTime.appOpen);

  const adRef = useRef<AppOpenAd | null>(null);
  const loadedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isEnabled || isUserBlocked || isAdFree || isUserBlockedFromAds()) {
      adRef.current = null;
      loadedRef.current = false;
      return;
    }
    if (!appOpenId) return;

    const npa = getAdRequestOptions();
    const ad = AppOpenAd.createForAdRequest(appOpenId, npa);
    adRef.current = ad;
    loadedRef.current = false;

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      loadedRef.current = true;
      if (lastShown && Date.now() - lastShown < pauseTime) return;
      ad.show().catch(() => {});
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      loadedRef.current = false;
      const now = Date.now();
      setLastShown(now);
      setAnyAdShown(now);
      ad.load();
    });
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      loadedRef.current = false;
    });

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      adRef.current = null;
      loadedRef.current = false;
    };
  }, [
    isEnabled,
    appOpenId,
    isUserBlocked,
    isAdFree,
    lastShown,
    pauseTime,
    setLastShown,
    setAnyAdShown,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (next === "active" && prev.match(/inactive|background/)) {
        if (loadedRef.current) {
          adRef.current?.show().catch(() => {
            loadedRef.current = false;
            adRef.current?.load();
          });
        } else {
          adRef.current?.load();
        }
      }
    });
    return () => sub.remove();
  }, []);
}
