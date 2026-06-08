import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useCheckAdFree } from "../hooks/ads/useCheckAdFree";
import { useScreenRewardedAd } from "../hooks/ads/useScreenRewardedAd";
import { useAdConfigStore } from "../store/adConfigStore";

export function AdFreeUnlocker() {
  const isEnabled = useAdConfigStore((s) => s.isEnabled);
  const unlockHours = useAdConfigStore((s) => s.adFreeUnlockTime);
  const { isAdFree, remainingLabel, startAdFree } = useCheckAdFree();
  const { isLoaded, isOpened, isClosed, isEarnedReward, show, load, error } =
    useScreenRewardedAd("ad_free_unlock");
  const [tapped, setTapped] = useState(false);

  if (!isEnabled) return null;

  if (isAdFree) {
    return (
      <View style={[styles.container, styles.activeCard]}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <View style={styles.textBlock}>
          <Text style={styles.title}>Ad-free mode active</Text>
          <Text style={styles.subtitle}>
            No ads for the next {remainingLabel}
          </Text>
        </View>
      </View>
    );
  }

  const handlePress = () => {
    setTapped(true);
    if (isLoaded) {
      show();
    } else {
      load();
    }
  };

  const busy = (tapped && !isLoaded && !isOpened) || isOpened;
  const label = isOpened
    ? "Watching ad..."
    : isLoaded
    ? `Watch an ad · ${unlockHours}h ad-free`
    : busy
    ? "Loading ad…"
    : `Watch an ad · ${unlockHours}h ad-free`;

  return (
    <Pressable
      onPress={handlePress}
      disabled={isOpened}
      style={({ pressed }) => [
        styles.container,
        styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="play-circle" size={22} color="#FFFFFF" />
      <View style={styles.textBlock}>
        <Text style={styles.buttonTitle}>
          {isEarnedReward ? "Enjoy your ad-free time" : label}
        </Text>
        <Text style={styles.buttonSubtitle}>
          {error
            ? "Ad failed to load. Tap to retry."
            : isEarnedReward
            ? `No ads for ${unlockHours} hours`
            : "Unlock ad free."}
        </Text>
      </View>
      {busy && <ActivityIndicator size="small" color="#FFFFFF" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
  },
  activeCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  button: {
    backgroundColor: "#6D28D9",
  },
  pressed: {
    opacity: 0.85,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#065F46",
  },
  subtitle: {
    fontSize: 12,
    color: "#047857",
    marginTop: 2,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonSubtitle: {
    fontSize: 12,
    color: "#EDE9FE",
    marginTop: 2,
  },
});

export default AdFreeUnlocker;
