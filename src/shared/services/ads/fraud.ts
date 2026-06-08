import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceIdHash, getStableDeviceId } from "./deviceId";
import { getCachedAdConfig } from "./config";

const STORAGE_KEY = "ads.fraud.localBlocklist.v1";
const CLICK_TIMES_KEY = "ads.fraud.clickTimestamps.v1";

type ClickTimes = number[];

async function readClickTimes(): Promise<ClickTimes> {
  try {
    const raw = await AsyncStorage.getItem(CLICK_TIMES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

async function writeClickTimes(times: ClickTimes): Promise<void> {
  try {
    await AsyncStorage.setItem(CLICK_TIMES_KEY, JSON.stringify(times));
  } catch {
  }
}

async function readLocalBlocklist(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

async function writeLocalBlocklist(list: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
  }
}

let initialized = false;
let isBlocked = false;

export async function initFraudDetection(): Promise<void> {
  if (initialized) return;
  initialized = true;
  const hash = await getDeviceIdHash();
  const list = await readLocalBlocklist();
  isBlocked = list.includes(hash);
  const remote = getCachedAdConfig().remoteBlocklist;
  if (remote.includes(hash) || remote.includes(await getStableDeviceId())) {
    isBlocked = true;
    if (!list.includes(hash)) {
      list.push(hash);
      await writeLocalBlocklist(list);
    }
  }
}

export function isUserBlockedFromAds(): boolean {
  return isBlocked;
}

export async function recordAdInteraction(kind: "click" | "impression" | "open"): Promise<void> {
  if (kind !== "click") return;
  const cfg = getCachedAdConfig();
  const now = Date.now();
  const times = await readClickTimes();
  const fresh = times.filter((t) => now - t < cfg.fraudClickWindowMs);
  fresh.push(now);
  await writeClickTimes(fresh);
  if (fresh.length >= cfg.fraudClickThreshold) {
    await blockThisDevice("rapid-clicks");
  }
}

export async function recordAdEventSuspicious(reason: string): Promise<void> {
  await blockThisDevice(reason);
}

export async function blockThisDevice(reason: string): Promise<void> {
  if (isBlocked) return;
  isBlocked = true;
  const hash = await getDeviceIdHash();
  const list = await readLocalBlocklist();
  if (!list.includes(hash)) {
    list.push(hash);
    await writeLocalBlocklist(list);
  }
  if (__DEV__) {
    console.warn(`[ads] Device blocked from ads: ${reason}`);
  }
}

export async function unblockThisDevice(): Promise<void> {
  isBlocked = false;
  const hash = await getDeviceIdHash();
  const list = await readLocalBlocklist();
  await writeLocalBlocklist(list.filter((h) => h !== hash));
  await writeClickTimes([]);
}
