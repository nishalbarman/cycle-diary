import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { AppOpenAd, AdEventType } from "react-native-google-mobile-ads";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAppOpenLastShown, setAnyAdLastShownTime, selectIsUserBlocked, selectAppOpenLastShown } from "@/store/adActivitySlice";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsAdFree } from "@/store/adFreeSlice";
import { getAdRequestOptions } from "../../services/ads";
import { isUserBlockedFromAds } from "../../services/ads/fraud";

export function useAppOpenAd(): void {
  const dispatch = useAppDispatch();
  const isEnabled = useAppSelector(selectAdEnabled);
  const appOpenId = useAppSelector((s) => s.adConfig.appOpenId);
  const pauseTime = useAppSelector((s) => s.adConfig.appOpenAdPauseTime);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const isAdFree = useAppSelector(selectIsAdFree);
  const lastShown = useAppSelector(selectAppOpenLastShown);

  const setLastShown = (time: number) => dispatch(setAppOpenLastShown(time));
  const setAnyAdShown = (time: number) => dispatch(setAnyAdLastShownTime(time));

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
    dispatch,
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
