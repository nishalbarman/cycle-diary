import remoteConfig from "@react-native-firebase/remote-config";
import { Platform } from "react-native";
import { TestIds } from "react-native-google-mobile-ads";

export interface AdConfig {
  isEnabled: boolean;
  testMode: boolean;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  appOpenId: string;
  nativeId: string;
  appOpenAdPauseTime: number;
  interstitialAdPauseTime: number;
  rewardedAdPauseTime: number;
  frequentInterval: number;
  maximumAllowedFrequentClicks: number;
  dailyClickBlockThreshold: number;
  adFreeUnlockTime: number;
  remoteBlocklist: string[];
  fraudClickWindowMs: number;
  fraudClickThreshold: number;
  debugGeography: "EEA" | "NOT_EEA" | "DISABLED" | null;
}

let cached: AdConfig | null = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000;

const REMOTE_KEYS = {
  adConfig: "ad_config",
  enabled: "ads_enabled",
  testMode: "ads_test_mode",
  bannerId: "ads_banner_id",
  interstitialId: "ads_interstitial_id",
  rewardedId: "ads_rewarded_id",
  appOpenId: "ads_app_open_id",
  nativeId: "ads_native_id",
  appOpenAdPauseTime: "ads_app_open_pause_time_ms",
  interstitialAdPauseTime: "ads_interstitial_pause_time_ms",
  rewardedAdPauseTime: "ads_rewarded_pause_time_ms",
  frequentInterval: "ads_frequent_interval_ms",
  maximumAllowedFrequentClicks: "ads_max_frequent_clicks",
  dailyClickBlockThreshold: "ads_daily_click_block_threshold",
  adFreeUnlockTime: "ad_free_unlock_time_hours",
  remoteBlocklist: "ads_blocked_device_ids",
  fraudClickWindowMs: "ads_fraud_click_window_ms",
  fraudClickThreshold: "ads_fraud_click_threshold",
  debugGeography: "ads_debug_geography",
} as const;

const fallback = (): AdConfig => ({
  isEnabled: true,
  testMode: __DEV__,
  bannerId: TestIds.BANNER,
  interstitialId: TestIds.INTERSTITIAL,
  rewardedId: TestIds.REWARDED,
  appOpenId: TestIds.APP_OPEN,
  nativeId: TestIds.NATIVE,
  appOpenAdPauseTime: 120_000,
  interstitialAdPauseTime: 60_000,
  rewardedAdPauseTime: 60_000,
  frequentInterval: 1_000,
  maximumAllowedFrequentClicks: 3,
  dailyClickBlockThreshold: 10,
  adFreeUnlockTime: 5,
  remoteBlocklist: [],
  fraudClickWindowMs: 2_000,
  fraudClickThreshold: 5,
  debugGeography: null,
});

function asBool(v: unknown, fb: boolean): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v === "true" || v === "1";
  if (typeof v === "number") return v !== 0;
  return fb;
}
function asNumber(v: unknown, fb: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fb;
}
function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}
function asGeo(v: unknown): AdConfig["debugGeography"] {
  if (v === "EEA" || v === "NOT_EEA" || v === "DISABLED") return v;
  if (typeof v === "string" && v.length > 0) {
    const upper = v.toUpperCase();
    if (upper === "EEA" || upper === "NOT_EEA" || upper === "DISABLED") return upper;
  }
  const env = process.env.EXPO_PUBLIC_ADS_DEBUG_GEOGRAPHY?.toUpperCase();
  if (env === "EEA" || env === "NOT_EEA" || env === "DISABLED") return env;
  return null;
}

function applyJsonJsonServer(json: string | undefined): Partial<AdConfig> | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Partial<AdConfig> = {};
    if ("isEnabled" in parsed || "enabled" in parsed)
      out.isEnabled = asBool(parsed.isEnabled ?? parsed.enabled, true);
    if ("testMode" in parsed) out.testMode = asBool(parsed.testMode, __DEV__);
    if ("bannerId" in parsed) out.bannerId = String(parsed.bannerId);
    if ("interstitialId" in parsed) out.interstitialId = String(parsed.interstitialId);
    if ("rewardedId" in parsed) out.rewardedId = String(parsed.rewardedId);
    if ("appOpenId" in parsed) out.appOpenId = String(parsed.appOpenId);
    if ("nativeId" in parsed) out.nativeId = String(parsed.nativeId);
    if ("appOpenAdPauseTime" in parsed)
      out.appOpenAdPauseTime = asNumber(parsed.appOpenAdPauseTime, 120_000);
    if ("interstitialAdPauseTime" in parsed)
      out.interstitialAdPauseTime = asNumber(parsed.interstitialAdPauseTime, 60_000);
    if ("rewardedAdPauseTime" in parsed)
      out.rewardedAdPauseTime = asNumber(parsed.rewardedAdPauseTime, 60_000);
    if ("frequentInterval" in parsed)
      out.frequentInterval = asNumber(parsed.frequentInterval, 1_000);
    if ("maximumAllowedFrequentClicks" in parsed)
      out.maximumAllowedFrequentClicks = asNumber(
        parsed.maximumAllowedFrequentClicks,
        3,
      );
    if ("dailyClickBlockThreshold" in parsed)
      out.dailyClickBlockThreshold = asNumber(
        parsed.dailyClickBlockThreshold,
        10,
      );
    if ("adFreeUnlockTime" in parsed)
      out.adFreeUnlockTime = asNumber(parsed.adFreeUnlockTime, 5);
    if ("remoteBlocklist" in parsed)
      out.remoteBlocklist = asList(parsed.remoteBlocklist);
    return out;
  } catch {
    return null;
  }
}

export async function fetchAdConfig(force = false): Promise<AdConfig> {
  if (!force && cached && Date.now() - lastFetchedAt < CACHE_TTL_MS) {
    return cached;
  }
  const fb = fallback();
  try {
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalInSeconds: 300,
      fetchTimeMillis: 60_000,
    });
    await remoteConfig().setDefaults({
      [REMOTE_KEYS.adConfig]: "{}",
      [REMOTE_KEYS.enabled]: fb.isEnabled,
      [REMOTE_KEYS.testMode]: fb.testMode,
      [REMOTE_KEYS.bannerId]: fb.bannerId,
      [REMOTE_KEYS.interstitialId]: fb.interstitialId,
      [REMOTE_KEYS.rewardedId]: fb.rewardedId,
      [REMOTE_KEYS.appOpenId]: fb.appOpenId,
      [REMOTE_KEYS.nativeId]: fb.nativeId,
      [REMOTE_KEYS.appOpenAdPauseTime]: fb.appOpenAdPauseTime,
      [REMOTE_KEYS.interstitialAdPauseTime]: fb.interstitialAdPauseTime,
      [REMOTE_KEYS.rewardedAdPauseTime]: fb.rewardedAdPauseTime,
      [REMOTE_KEYS.frequentInterval]: fb.frequentInterval,
      [REMOTE_KEYS.maximumAllowedFrequentClicks]: fb.maximumAllowedFrequentClicks,
      [REMOTE_KEYS.dailyClickBlockThreshold]: fb.dailyClickBlockThreshold,
      [REMOTE_KEYS.adFreeUnlockTime]: fb.adFreeUnlockTime,
      [REMOTE_KEYS.remoteBlocklist]: fb.remoteBlocklist.join(","),
      [REMOTE_KEYS.fraudClickWindowMs]: fb.fraudClickWindowMs,
      [REMOTE_KEYS.fraudClickThreshold]: fb.fraudClickThreshold,
      [REMOTE_KEYS.debugGeography]: fb.debugGeography ?? "",
    });
    await remoteConfig().fetchAndActivate();
  } catch {}

  const rc = remoteConfig();
  const jsonOverride = applyJsonJsonServer(
    String(rc.getValue(REMOTE_KEYS.adConfig).value ?? "{}"),
  );

  const cfg: AdConfig = {
    ...fb,
    ...(jsonOverride ?? {}),
    isEnabled: asBool(
      jsonOverride?.isEnabled ?? rc.getValue(REMOTE_KEYS.enabled).value,
      fb.isEnabled,
    ),
    testMode: asBool(
      jsonOverride?.testMode ?? rc.getValue(REMOTE_KEYS.testMode).value,
      fb.testMode,
    ),
    bannerId: String(
      jsonOverride?.bannerId ?? rc.getValue(REMOTE_KEYS.bannerId).value ?? fb.bannerId,
    ),
    interstitialId: String(
      jsonOverride?.interstitialId ??
        rc.getValue(REMOTE_KEYS.interstitialId).value ??
        fb.interstitialId,
    ),
    rewardedId: String(
      jsonOverride?.rewardedId ?? rc.getValue(REMOTE_KEYS.rewardedId).value ?? fb.rewardedId,
    ),
    appOpenId: String(
      jsonOverride?.appOpenId ?? rc.getValue(REMOTE_KEYS.appOpenId).value ?? fb.appOpenId,
    ),
    nativeId: String(
      jsonOverride?.nativeId ?? rc.getValue(REMOTE_KEYS.nativeId).value ?? fb.nativeId,
    ),
    appOpenAdPauseTime: asNumber(
      jsonOverride?.appOpenAdPauseTime ??
        rc.getValue(REMOTE_KEYS.appOpenAdPauseTime).value,
      fb.appOpenAdPauseTime,
    ),
    interstitialAdPauseTime: asNumber(
      jsonOverride?.interstitialAdPauseTime ??
        rc.getValue(REMOTE_KEYS.interstitialAdPauseTime).value,
      fb.interstitialAdPauseTime,
    ),
    rewardedAdPauseTime: asNumber(
      jsonOverride?.rewardedAdPauseTime ??
        rc.getValue(REMOTE_KEYS.rewardedAdPauseTime).value,
      fb.rewardedAdPauseTime,
    ),
    frequentInterval: asNumber(
      jsonOverride?.frequentInterval ?? rc.getValue(REMOTE_KEYS.frequentInterval).value,
      fb.frequentInterval,
    ),
    maximumAllowedFrequentClicks: asNumber(
      jsonOverride?.maximumAllowedFrequentClicks ??
        rc.getValue(REMOTE_KEYS.maximumAllowedFrequentClicks).value,
      fb.maximumAllowedFrequentClicks,
    ),
    dailyClickBlockThreshold: asNumber(
      jsonOverride?.dailyClickBlockThreshold ??
        rc.getValue(REMOTE_KEYS.dailyClickBlockThreshold).value,
      fb.dailyClickBlockThreshold,
    ),
    adFreeUnlockTime: asNumber(
      jsonOverride?.adFreeUnlockTime ??
        rc.getValue(REMOTE_KEYS.adFreeUnlockTime).value,
      fb.adFreeUnlockTime,
    ),
    remoteBlocklist: asList(
      jsonOverride?.remoteBlocklist ?? rc.getValue(REMOTE_KEYS.remoteBlocklist).value,
    ),
    fraudClickWindowMs: asNumber(
      rc.getValue(REMOTE_KEYS.fraudClickWindowMs).value,
      fb.fraudClickWindowMs,
    ),
    fraudClickThreshold: asNumber(
      rc.getValue(REMOTE_KEYS.fraudClickThreshold).value,
      fb.fraudClickThreshold,
    ),
    debugGeography: asGeo(rc.getValue(REMOTE_KEYS.debugGeography).value),
  };

  cached = cfg;
  lastFetchedAt = Date.now();
  return cfg;
}

export function getCachedAdConfig(): AdConfig {
  return cached ?? fallback();
}

export function resetAdConfigCache(): void {
  cached = null;
  lastFetchedAt = 0;
}

export { fallback as AD_CONFIG_DEFAULTS };
export { Platform };
