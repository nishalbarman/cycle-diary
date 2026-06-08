import { memo } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { useAdConfigStore } from "../store/adConfigStore";
import { useAdActivityStore } from "../store/adActivityStore";
import { useAdFreeStore } from "../store/adFreeStore";
import { getAdRequestOptions, isNpa } from "../services/ads";
import { isUserBlockedFromAds } from "../services/ads/fraud";

interface AdBannerProps {
  size?: keyof typeof BannerAdSize;
  unitId?: string;
}

function AdBannerImpl({
  size = "ANCHORED_ADAPTIVE_BANNER",
  unitId,
}: AdBannerProps) {
  const isEnabled = useAdConfigStore((s) => s.isEnabled);
  const bannerId = useAdConfigStore((s) => s.bannerId);
  const isUserBlocked = useAdActivityStore((s) => s.isUserBlocked);
  const isAdFree = useAdFreeStore((s) => s.isAdFree);
  const trackFrequent = useAdActivityStore((s) => s.trackFrequentAdClick);
  const trackDaily = useAdActivityStore((s) => s.trackDailyAdClick);

  const finalId = unitId ?? bannerId;
  const isDeviceBlocked = isUserBlockedFromAds();
  const npa = getAdRequestOptions();

  if (!isEnabled || isUserBlocked || isAdFree || isDeviceBlocked || !finalId) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={finalId}
        size={BannerAdSize[size]}
        requestOptions={npa}
        onAdClicked={() => {
          trackFrequent();
          trackDaily();
        }}
        onAdFailedToLoad={(err: Error) => {
          if (__DEV__) console.warn("[AdBanner] failed:", err?.message);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    backgroundColor: "transparent",
    ...Platform.select({
      android: { marginBottom: 4 },
      default: {},
    }),
  },
});

export default memo(AdBannerImpl);
