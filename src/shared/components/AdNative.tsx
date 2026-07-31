import { memo, useEffect, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import {
  NativeAd,
  NativeAdEventType,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

import { useCheckAdFree } from "../hooks/ads/useCheckAdFree";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectAdEnabled } from "@/store/adConfigSlice";
import { selectIsUserBlocked, trackFrequentAdClick, trackDailyAdClick } from "@/store/adActivitySlice";
import { getAdRequestOptions } from "../services/ads";
import theme from "@/shared/theme";

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
  const dispatch = useAppDispatch();
  const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Force Light mode as per app theme specification
  const isDark = false;

  const isEnabled = useAppSelector(selectAdEnabled);
  const nativeId = useAppSelector((s) => s.adConfig.nativeId);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const { isAdFree } = useCheckAdFree();

  const trackFrequentClick = () => dispatch(trackFrequentAdClick());
  const trackDailyClick = () => dispatch(trackDailyAdClick());

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
        trackFrequentClick();
        trackDailyClick();
      },
    );
    return () => listener.remove();
  }, [nativeAd, isAdFree]);

  if (isAdFree || !isEnabled || isUserBlocked) return null;

  if (!nativeAd) {
    return isLoading ? (
      <NativeAdPlaceholder compact={compact} style={style} isDark={isDark} />
    ) : null;
  }

  const cardBg = "#FFFFFF";
  const borderColor = "rgba(0,0,0,0.08)";
  const textColor = "#1F2937";
  const bodyColor = "#6B7280";
  const primaryColor = theme.primary;

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
                backgroundColor: "rgba(0,0,0,0.04)",
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
  const blockColor = "#E5E7EB";
  const mutedBlockColor = "#F3F4F6";

  return (
    <View
      pointerEvents="none"
      style={[
        styles.adContainer,
        styles.placeholderContainer,
        {
          backgroundColor: "#FFFFFF",
          borderColor: "rgba(0,0,0,0.08)",
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
    marginBottom: 8,
  },
  labelText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  adContainer: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  compactContainer: {
    padding: 10,
  },
  topRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  headline: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    lineHeight: 18,
  },
  media: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginBottom: 12,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  placeholderContainer: {
    opacity: 0.7,
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  placeholderLine: {
    height: 12,
    borderRadius: 6,
    width: "80%",
    marginBottom: 6,
  },
  placeholderLineShort: {
    width: "50%",
    height: 10,
  },
  placeholderMedia: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderCta: {
    width: "100%",
    height: 40,
    borderRadius: 12,
  },
});
