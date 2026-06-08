import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "ads.geoCache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface GeoCache {
  isCalifornia: boolean;
  cachedAt: number;
}

interface IpWhoResponse {
  success?: boolean;
  country?: string;
  region?: string;
  country_code?: string;
}

export async function isCaliforniaUser(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GeoCache;
      if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
        return parsed.isCalifornia;
      }
    }
  } catch {}

  try {
    const res = await fetch("https://ipwho.is/", { method: "GET" });
    if (!res.ok) return false;
    const data = (await res.json()) as IpWhoResponse;
    const isCalifornia =
      data.success !== false &&
      ((data.country_code || "").toUpperCase() === "US" &&
        (data.region || "").toLowerCase().includes("california"));
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ isCalifornia, cachedAt: Date.now() } satisfies GeoCache),
    );
    return isCalifornia;
  } catch {
    return false;
  }
}

export async function clearGeoCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
