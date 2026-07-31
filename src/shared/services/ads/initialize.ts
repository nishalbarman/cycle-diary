import MobileAds, {
  AdsConsent,
  AdsConsentStatus,
  type RequestOptions,
  MaxAdContentRating,
} from "react-native-google-mobile-ads";
import Constants from "expo-constants";

import { isCaliforniaUser } from "./geoUtils";
import { store } from "@/store/store";
import { setAdConfig } from "@/store/adConfigSlice";
import { setAdFreeUnlockTime } from "@/store/adFreeSlice";
import { fetchAdConfig } from "./config";

let _initialized = false;
let _npa = false;
let _subscribers = new Set<() => void>();

export function isNpa(): boolean {
  return _npa;
}

export function subscribeAds(listener: () => void): () => void {
  _subscribers.add(listener);
  return () => {
    _subscribers.delete(listener);
  };
}

function notify() {
  for (const l of _subscribers) l();
}

export async function gatherConsent(): Promise<void> {
  if (!_initialized) await initializeAds();
  try {
    const info = await AdsConsent.requestInfoUpdate();
    _npa = info.status === AdsConsentStatus.OBTAINED;
    if (info.status === AdsConsentStatus.REQUIRED) {
      const result = await AdsConsent.showForm();
      _npa = result.status === AdsConsentStatus.OBTAINED;
    }
  } catch (e) {
    if (__DEV__) console.warn("[ads] gatherConsent failed", e);
  }
  notify();
}

export async function showPrivacyOptionsForm(): Promise<void> {
  if (!_initialized) await initializeAds();
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch (e) {
    if (__DEV__) console.warn("[ads] showPrivacyOptionsForm failed", e);
  }
}

export async function resetConsent(): Promise<void> {
  if (!_initialized) await initializeAds();
  try {
    await AdsConsent.reset();
  } catch (e) {
    if (__DEV__) console.warn("[ads] AdsConsent.reset failed", e);
  }
  _npa = false;
  notify();
}

export async function refreshAdConfig(force = true): Promise<void> {
  try {
    const cfg = await fetchAdConfig(force);
    store.dispatch(
      setAdConfig({
        isEnabled: cfg.isEnabled,
        bannerId: cfg.bannerId,
        interstitialId: cfg.interstitialId,
        rewardedId: cfg.rewardedId,
        appOpenId: cfg.appOpenId,
        nativeId: cfg.nativeId,
        appOpenAdPauseTime: cfg.appOpenAdPauseTime,
        interstitialAdPauseTime: cfg.interstitialAdPauseTime,
        rewardedAdPauseTime: cfg.rewardedAdPauseTime,
        frequentInterval: cfg.frequentInterval,
        maximumAllowedClicksPerDay: cfg.maximumAllowedClicksPerDay,
        adFreeUnlockTime: cfg.adFreeUnlockTime,
        fetchedActivated: true,
      })
    );
    store.dispatch(setAdFreeUnlockTime(cfg.adFreeUnlockTime));
    notify();
  } catch (e) {
    if (__DEV__) console.warn("[ads] refreshAdConfig failed", e);
  }
}

export async function initializeAds(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const devGeography = (extra.adsDebugGeography as string | undefined);

  const isCa = await isCaliforniaUser().catch(() => false);
  if (isCa) {
    try { await AdsConsent.requestInfoUpdate(); } catch {}
  }

  await MobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.G,
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });

  if (__DEV__ && devGeography) {
    try { await MobileAds().openDebugMenu(devGeography); } catch {}
  }

  await MobileAds().initialize();

  try {
    const info = await AdsConsent.requestInfoUpdate();
    _npa = info.status === AdsConsentStatus.OBTAINED;
  } catch (e) {
    if (__DEV__) console.warn("[ads] consent status check failed", e);
  }

  await refreshAdConfig(true);

  notify();
}

export function getAdRequestOptions(): RequestOptions {
  return _npa ? { requestNonPersonalizedAdsOnly: true } : {};
}

export async function resetAdConfigCache(): Promise<void> {
  const mod = await import("./config");
  mod.resetAdConfigCache();
}
