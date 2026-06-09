import { useEffect, useRef, useCallback } from "react";
import { useScreenInterstitialAd } from "./useScreenInterstitialAd";

const ACTION_THRESHOLD = 3;

export function useActionInterstitialAd() {
  const interstitial = useScreenInterstitialAd("action");
  const counterRef = useRef(0);

  useEffect(() => {
    if (interstitial.canLoadAd && !interstitial.isLoaded) {
      interstitial.load();
    }
  }, [interstitial.canLoadAd, interstitial.isLoaded, interstitial.load]);

  useEffect(() => {
    if (interstitial.isClosed && interstitial.canLoadAd) {
      interstitial.load();
    }
  }, [interstitial.isClosed, interstitial.canLoadAd, interstitial.load]);

  const trackAction = useCallback(() => {
    counterRef.current += 1;
    if (counterRef.current >= ACTION_THRESHOLD) {
      counterRef.current = 0;
      if (interstitial.canShowAd) {
        interstitial.show();
      }
    }
  }, [interstitial.canShowAd, interstitial.show]);

  return { trackAction };
}
