// Root layout for expo-router based navigation
import { useEffect, useCallback } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "@/store/store";
import { Slot, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Application from "expo-application";
import remoteConfig from "@react-native-firebase/remote-config";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

import "@/global.css";
import { useNotificationScheduler } from "@/shared/hooks/useNotificationScheduler";
import { useDbInit } from "@/shared/hooks/useDbInit";
import { useSync } from "@/shared/hooks/useSync";
import { useAppOpenAd } from "@/shared/hooks/ads/useAppOpenAd";
import {
  initializeAds,
  gatherConsent,
  initFraudDetection,
} from "@/shared/services/ads";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectUser,
  selectAuthIsLoading,
  selectAuthInitialized,
  initAuthListener,
} from "@/store/authSlice";
import {
  selectOnboardingComplete,
  selectSettingsHydrated,
} from "@/store/settingsSlice";
import { selectLogHydrated } from "@/store/logSlice";
import { selectIsUserBlocked } from "@/store/adActivitySlice";
import { updateAdConfig } from "@/store/adConfigSlice";
import { selectAppConfig, updateAppConfig } from "@/store/appConfigSlice";
import {
  updateAdFreeUnlockTime,
  updateIsFetchedAndActivated,
} from "@/store/adFreeSlice";
import ForceUpdateModal from "@/shared/components/ForceUpdateModal";

// Prevent splash screen auto hide until fonts and store are ready
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const dispatch = useAppDispatch();
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const user = useAppSelector(selectUser);
  const isLoading = useAppSelector(selectAuthIsLoading);
  const initialized = useAppSelector(selectAuthInitialized);
  const onboardingComplete = useAppSelector(selectOnboardingComplete);
  const logsHydrated = useAppSelector(selectLogHydrated);
  const settingsHydrated = useAppSelector(selectSettingsHydrated);
  const isUserBlocked = useAppSelector(selectIsUserBlocked);
  const { versionCode, fetchedActivated, forceUpdate } = useAppSelector(selectAppConfig);

  const segments = useSegments();
  const router = useRouter();

  const hydrated = logsHydrated && settingsHydrated;
  const ready = (fontsLoaded || !!fontError) && initialized && !isLoading && hydrated;

  // Initialize side‑effects
  useNotificationScheduler();
  useDbInit();
  useSync();
  useAppOpenAd();

  // Firebase Remote Config fetch & activate
  const fetchRemoteConfig = useCallback(async () => {
    if (isUserBlocked) return;
    try {
      await remoteConfig().setDefaults({
        ad_config: JSON.stringify({
          isEnabled: true,
          bannerId: "ca-app-pub-3940256099942544/6300978111",
          appopenId: "ca-app-pub-3940256099942544/9257395921",
          interstitialId: "ca-app-pub-3940256099942544/1033173712",
          rewardedId: "ca-app-pub-3940256099942544/5224354917",
          nativeId: "ca-app-pub-3940256099942544/2247696110",

          frequentInterval: 1000,
          maximumAllowedFrequentClicks: 3,
          appOpenAdPauseTime: 120000,
          interstitialAdPauseTime: 60000,
          rewardedAdPauseTime: 60000,
          maximumAllowedClicksPerDay: 7
        }),
        android_version_config: JSON.stringify({
          versionCode: 54,
          forceUpdate: true,
        }),
        adFreeUnlockTime: 0,
      });

      await remoteConfig().fetchAndActivate();

      const rawAdConfig = remoteConfig().getString("ad_config");
      const rawVersionConfig = remoteConfig().getString("android_version_config");

      const adConfig = rawAdConfig ? JSON.parse(rawAdConfig) : {};
      const androidVersionConfig = rawVersionConfig ? JSON.parse(rawVersionConfig) : {};
      const adFreeUnlockTime =
        remoteConfig().getNumber("adFreeUnlockTime") ||
        Number(adConfig.adFreeUnlockTime || 0);

      dispatch(
        updateAdConfig({
          ...adConfig,
          bannerId: adConfig.bannerId,
          appOpenId: adConfig.appopenId ?? adConfig.appOpenId,
          interstitialId: adConfig.interstitialId,
          rewardedId: adConfig.rewardedId,
          nativeId: adConfig.nativeId,
          maximumAllowedClicksPerDay: adConfig.maximumAllowedClicksPerDay ?? 7,
        })
      );
      dispatch(
        updateAppConfig({ ...androidVersionConfig, fetchedActivated: true })
      );
      dispatch(updateAdFreeUnlockTime(adFreeUnlockTime));
      dispatch(updateIsFetchedAndActivated(true));
    } catch (e) {
      if (__DEV__) console.warn("[remoteConfig] fetch failed:", e);
    }
  }, [dispatch, isUserBlocked]);

  // Firebase Auth listener — dispatches setUser / clearUser to Redux
  useEffect(() => {
    const unsub = initAuthListener(dispatch);
    return unsub;
  }, [dispatch]);

  // Ads & Remote Config initialization
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        await initFraudDetection();
        await fetchRemoteConfig();
        if (!cancelled) await gatherConsent();
        if (!cancelled) await initializeAds();
      } catch (e) {
        if (__DEV__) console.warn("[ads] init failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, fetchRemoteConfig]);

  // Version Check for Force Update
  const currentBuildVersion = Number(Application.nativeBuildVersion || 0);
  const isUpdateRequired =
    Boolean(fetchedActivated) &&
    Boolean(forceUpdate) &&
    versionCode > 0 &&
    currentBuildVersion > 0 &&
    currentBuildVersion < versionCode;

  // Splash screen
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  // Auth & onboarding routing logic
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
    <>
      <Slot />
      <ForceUpdateModal
        visible={isUpdateRequired}
        latestVersionCode={versionCode}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AppContent />
      </PersistGate>
    </Provider>
  );
}
