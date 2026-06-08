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
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!isEnabled || isUserBlocked || isAdFree || isUserBlockedFromAds()) {
      adRef.current = null;
      return;
    }
    if (!appOpenId) return;

    const npa = getAdRequestOptions();
    const ad = AppOpenAd.createForAdRequest(appOpenId, npa);
    adRef.current = ad;

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      if (lastShown && Date.now() - lastShown < pauseTime) return;
      ad.show().catch(() => {
        // ignore: ad not ready or no fill
      });
    });
    const unsubscribeClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      const now = Date.now();
      setLastShown(now);
      setAnyAdShown(now);
      ad.load();
    });
    const unsubscribeError = ad.addAdEventListener(AdEventType.ERROR, () => {
      // silently retry on next foreground
    });

    ad.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
      adRef.current = null;
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
        adRef.current?.show().catch(() => {
          // attempt to reload on failure
          adRef.current?.load();
        });
      }
    });
    return () => sub.remove();
  }, []);
}
