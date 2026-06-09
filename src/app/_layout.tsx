import React, { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import "@/global.css";
import { useAuthStore } from "@/shared/store/authStore";
import { usePeriodStore } from "@/shared/store/periodStore";
import { useNotificationScheduler } from "@/shared/hooks/useNotificationScheduler";
import { useDbInit } from "@/shared/hooks/useDbInit";
import { useAppOpenAd } from "@/shared/hooks/ads/useAppOpenAd";
import {
  initializeAds,
  gatherConsent,
  initFraudDetection,
  refreshAdConfig,
} from "@/shared/services/ads";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const initialized = useAuthStore((s) => s.initialized);
  const init = useAuthStore((s) => s.init);
  const onboardingComplete = usePeriodStore((s) => s.settings.onboardingComplete);
  const hydrated = usePeriodStore((s) => s.hydrated);
  const segments = useSegments();
  const router = useRouter();

  const ready =
    (fontsLoaded || !!fontError) && initialized && !isLoading && hydrated;

  useNotificationScheduler();
  useDbInit();
  useAppOpenAd();

  useEffect(() => {
    const unsub = init();
    return unsub;
  }, [init]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        await initFraudDetection();
        await refreshAdConfig(true);
        if (!cancelled) await gatherConsent();
        if (!cancelled) await initializeAds();
      } catch (e) {
        if (__DEV__) console.warn("[ads] init failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (user && !onboardingComplete && !inOnboarding) {
      router.replace("/onboarding");
    } else if (user && onboardingComplete && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [user, onboardingComplete, ready, segments]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="log" options={{ presentation: "modal" }} />
          <Stack.Screen name="log-cramps" options={{ presentation: "modal" }} />
          <Stack.Screen name="log-cravings" options={{ presentation: "modal" }} />
          <Stack.Screen name="log-sleep" options={{ presentation: "modal" }} />
          <Stack.Screen name="cycle-details" />
          <Stack.Screen name="mood-history" />
          <Stack.Screen name="sleep-history" />
          <Stack.Screen name="cramps-history" />
          <Stack.Screen name="cycle-history" />
          <Stack.Screen name="cravings-history" />
          <Stack.Screen name="settings" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
