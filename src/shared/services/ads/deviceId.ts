import * as Application from "expo-application";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const STORAGE_KEY = "device.stableId.v1";

let cached: string | null = null;

function uuid(): string {
  const rnd = () => Math.floor(Math.random() * 0x100000000).toString(16);
  const t = Date.now().toString(16);
  return `${rnd()}-${rnd().slice(0, 4)}-${rnd().slice(0, 4)}-${rnd()}-${t}`;
}

async function getVendorId(): Promise<string | null> {
  try {
    if (Platform.OS === "ios") {
      const id = await Application.getIosIdForVendorAsync();
      return id ?? null;
    }
    if (Platform.OS === "android") {
      const id = Application.getAndroidId();
      return id ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function getStableDeviceId(): Promise<string> {
  if (cached) return cached;

  let stored: string | null = null;
  try {
    stored = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    stored = null;
  }

  if (!stored) {
    const vendor = await getVendorId();
    stored = vendor ?? `gen-${uuid()}`;
    try {
      await AsyncStorage.setItem(STORAGE_KEY, stored);
    } catch {
    }
  }

  cached = stored;
  return stored;
}

export async function getDeviceIdHash(): Promise<string> {
  const id = await getStableDeviceId();
  let h = 0x811c9dc5;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
