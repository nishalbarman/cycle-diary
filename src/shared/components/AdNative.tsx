import { memo, useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View, useColorScheme } from "react-native";
import {
  NativeAd,
  NativeAdEventType,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

import { useCheckAdFree } from "../hooks/ads/useCheckAdFree";
import { useAdConfigStore } from "../store/adConfigStore";
import { useAdActivityStore } from "../store/adActivityStore";
import { getAdRequestOptions } from "../services/ads";

const AdLabel = ({ isDark }: { isDark: boolean }) => {
  return (
    <View
      style={[
        styles.labelContainer,
        { backgroundColor: isDark ? "#374151" : "#FEF3C7" },
      ]}>
      <Text
        style={[
          styles.labelText,
          { color: isDark ? "#F9FAFB" : "#92400E" },
        ]}>
        Advertisement
      </Text>
    </View>
  );
};

function NativeAdItem({ style, compact = false }: { style?: any; compact?: boolean }) {
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isDark = useColorScheme() === "dark";
  const {
    isEnabled,
    nativeId,
    frequentInterval,
    maximumAllowedFrequentClicks,
  } = useAdConfigStore();
  const { isUserBlocked, trackFrequentAdClick, trackDailyAdClick } = useAdActivityStore();
  const { isAdFree } = useCheckAdFree();

  useEffect(() => {
    if (!isEnabled || !nativeId || isUserBlocked || isAdFree) {
      setIsLoading(false);
      setNativeAd((prev) => {
        prev?.destroy();
        return null;
      });
      return;
    }

    let mounted = true;
    setIsLoading(true);
    NativeAd.createForAdRequest(nativeId, getAdRequestOptions())
      .then((ad) => {
        if (mounted) {
          setNativeAd(ad);
          setIsLoading(false);
        } else {
          ad.destroy();
        }
      })
      .catch(() => {
        if (mounted) {
          setNativeAd(null);
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isEnabled, nativeId, isUserBlocked, isAdFree]);

  useEffect(() => {
    return () => nativeAd?.destroy();
  }, [nativeAd]);

  useEffect(() => {
    if (!nativeAd || isAdFree) return;
    const listener = nativeAd.addAdEventListener(
      NativeAdEventType.CLICKED,
      () => {
        trackFrequentAdClick();
        trackDailyAdClick();
      },
    );
    return () => listener.remove();
  }, [nativeAd, isAdFree, trackFrequentAdClick, trackDailyAdClick]);

  if (isAdFree || !isEnabled || isUserBlocked) return null;

  if (!nativeAd) {
    return isLoading ? (
      <NativeAdPlaceholder compact={compact} style={style} isDark={isDark} />
    ) : null;
  }

  const cardBg = isDark ? "#1F2937" : "#FFFFFF";
  const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const textColor = isDark ? "#F9FAFB" : "#1F2937";
  const bodyColor = isDark ? "#D1D5DB" : "#6B7280";
  const primaryColor = "#ec4899";

  return (
    <View
      style={[
        styles.adContainer,
        {
          backgroundColor: cardBg,
          borderColor,
        },
        compact && styles.compactContainer,
        style,
      ]}>
      <AdLabel isDark={isDark} />
      <NativeAdView nativeAd={nativeAd}>
        <View style={styles.topRow}>
          {nativeAd?.icon && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <Image
                source={{ uri: nativeAd.icon.url }}
                style={styles.icon}
                resizeMode="cover"
              />
            </NativeAsset>
          )}

          <View style={styles.copy}>
            {!!nativeAd?.headline && (
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text
                  style={[styles.headline, { color: textColor }]}
                  numberOfLines={2}>
                  {nativeAd.headline}
                </Text>
              </NativeAsset>
            )}
            {!!nativeAd?.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text
                  style={[
                    styles.body,
                    { color: bodyColor },
                  ]}
                  numberOfLines={compact ? 2 : 3}>
                  {nativeAd.body}
                </Text>
              </NativeAsset>
            )}
          </View>
        </View>

        {!compact && (
          <NativeMediaView
            resizeMode="cover"
            style={[
              styles.media,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.04)",
              },
            ]}
          />
        )}

        {!!nativeAd?.callToAction && (
          <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
            <View
              style={[
                styles.ctaButton,
                { backgroundColor: primaryColor },
              ]}>
              <Text style={styles.ctaText}>{nativeAd.callToAction}</Text>
            </View>
          </NativeAsset>
        )}
      </NativeAdView>
    </View>
  );
}

export default memo(NativeAdItem);

const NativeAdPlaceholder = ({ compact, style, isDark }: { compact?: boolean; style?: any; isDark: boolean }) => {
  const blockColor = isDark ? "rgba(255,255,255,0.08)" : "#E5E7EB";
  const mutedBlockColor = isDark ? "rgba(255,255,255,0.05)" : "#F3F4F6";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.adContainer,
        styles.placeholderContainer,
        {
          backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
          borderColor: isDark
            ? "rgba(255,255,255,0.10)"
            : "rgba(0,0,0,0.08)",
        },
        compact && styles.compactContainer,
        style,
      ]}>
      <AdLabel isDark={isDark} />

      <View style={styles.topRow}>
        <View
          style={[styles.placeholderIcon, { backgroundColor: blockColor }]}
        />
        <View style={styles.copy}>
          <View
            style={[styles.placeholderLine, { backgroundColor: blockColor }]}
          />
          <View
            style={[
              styles.placeholderLine,
              styles.placeholderLineShort,
              { backgroundColor: mutedBlockColor },
            ]}
          />
        </View>
      </View>
      {!compact && (
        <View
          style={[
            styles.placeholderMedia,
            { backgroundColor: mutedBlockColor },
          ]}
        />
      )}
      <View style={[styles.placeholderCta, { backgroundColor: blockColor }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  labelContainer: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  adContainer: {
    width: "95%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 15,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  placeholderContainer: {
    opacity: 0.9,
  },
  placeholderLabel: {
    width: 88,
    height: 18,
    borderRadius: 4,
    marginBottom: 10,
  },
  placeholderIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  placeholderLine: {
    width: "78%",
    height: 14,
    borderRadius: 4,
  },
  placeholderLineShort: {
    width: "56%",
    height: 12,
    marginTop: 8,
  },
  placeholderMedia: {
    width: "100%",
    aspectRatio: 16 / 9,
    marginTop: 12,
    borderRadius: 8,
  },
  placeholderCta: {
    height: 38,
    marginTop: 12,
    borderRadius: 8,
  },
  compactContainer: {
    padding: 12,
  },
  topRow: {
    flexDirection: "row",
    gap: 10,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  copy: {
    flex: 1,
  },
  headline: {
    fontSize: 15,
    fontWeight: "800",
  },
  body: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
  },
  media: {
    width: "100%",
    aspectRatio: 16 / 9,
    marginTop: 12,
    borderRadius: 8,
  },
  ctaButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13,
  },
});
