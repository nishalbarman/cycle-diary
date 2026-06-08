import MobileAds, {
  AdsConsent,
  AdsConsentDebugGeography,
  AdsConsentStatus,
  type RequestOptions,
} from "react-native-google-mobile-ads";
import Constants from "expo-constants";

import { isCaliforniaUser } from "./geoUtils";
import { useAdConfigStore } from "../../store/adConfigStore";
import { useAdFreeStore } from "../../store/adFreeStore";
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
    const status = await AdsConsent.requestConsentInfoUpdate();
    _npa = status === AdsConsentStatus.NON_PERSONALIZED;
    if (status === AdsConsentStatus.REQUIRED) {
      const result = await AdsConsent.showForm();
      _npa = result.status === AdsConsentStatus.NON_PERSONALIZED;
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
    useAdConfigStore.getState().setAll({
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
      maximumAllowedFrequentClicks: cfg.maximumAllowedFrequentClicks,
      dailyClickBlockThreshold: cfg.dailyClickBlockThreshold,
      adFreeUnlockTime: cfg.adFreeUnlockTime,
      fetchedActivated: true,
    });
    useAdFreeStore.getState().setAdFreeUnlockTime(cfg.adFreeUnlockTime);
    notify();
  } catch (e) {
    if (__DEV__) console.warn("[ads] refreshAdConfig failed", e);
  }
}

export async function initializeAds(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const devGeography = (extra.adsDebugGeography as
    | keyof typeof AdsConsentDebugGeography
    | undefined) ?? undefined;
  if (__DEV__ && devGeography && devGeography in AdsConsentDebugGeography) {
    await AdsConsent.setDebugGeography(AdsConsentDebugGeography[devGeography]);
  }

  const isCa = await isCaliforniaUser().catch(() => false);
  if (isCa) {
    await AdsConsent.setAgeUnderConsent(false).catch(() => {});
  }

  await MobileAds().setRequestConfiguration({
    maxAdContentRating: "G",
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });

  if (__DEV__) {
    await MobileAds().openDebugMenu().catch(() => {});
  }

  await MobileAds().initialize();

  try {
    const status = await AdsConsent.requestConsentInfoUpdate();
    _npa = status === AdsConsentStatus.NON_PERSONALIZED;
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
  const { resetAdConfigCache } = await import("./config");
  await resetAdConfigCache();
}
