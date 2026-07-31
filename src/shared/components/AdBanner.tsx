import { memo, useCallback } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsUserBlocked, trackFrequentAdClick, trackDailyAdClick } from "@/store/adActivitySlice";
import { selectIsAdFree } from "@/store/adFreeSlice";
import { getAdRequestOptions } from "../services/ads";
import { isUserBlockedFromAds } from "../services/ads/fraud";

interface AdBannerProps {
  size?: keyof typeof BannerAdSize;
  unitId?: string;
}

function AdBannerImpl({
  size = "ANCHORED_ADAPTIVE_BANNER",
  unitId,
}: AdBannerProps) {
  const dispatch = useAppDispatch();
  const isEnabled = useAppSelector(selectAdEnabled);
  const bannerId = useAppSelector((s) => s.adConfig.bannerId);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const isAdFree = useAppSelector(selectIsAdFree);

  const trackFrequent = useCallback(() => dispatch(trackFrequentAdClick()), [dispatch]);
  const trackDaily = useCallback(() => dispatch(trackDailyAdClick()), [dispatch]);

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
