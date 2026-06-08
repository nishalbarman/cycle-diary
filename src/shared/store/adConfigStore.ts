import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface AdConfigState {
  isEnabled: boolean;
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  appOpenId: string;
  nativeId: string;
  appOpenAdPauseTime: number;
  interstitialAdPauseTime: number;
  rewardedAdPauseTime: number;
  frequentInterval: number;
  maximumAllowedFrequentClicks: number;
  dailyClickBlockThreshold: number;
  adFreeUnlockTime: number;
  fetchedActivated: boolean;

  setAll: (next: Partial<AdConfigState>) => void;
  setFetchedActivated: (v: boolean) => void;
  reset: () => void;
}

const TEST_IDS = {
  banner: "ca-app-pub-3940256099942544/6300978111",
  interstitial: "ca-app-pub-3940256099942544/1033173712",
  rewarded: "ca-app-pub-3940256099942544/5224354917",
  appOpen: "ca-app-pub-3940256099942544/9257395921",
  native: "ca-app-pub-3940256099942544/2247696110",
};

export const DEFAULT_AD_CONFIG: AdConfigState = {
  isEnabled: false,
  bannerId: TEST_IDS.banner,
  interstitialId: TEST_IDS.interstitial,
  rewardedId: TEST_IDS.rewarded,
  appOpenId: TEST_IDS.appOpen,
  nativeId: TEST_IDS.native,
  appOpenAdPauseTime: 120_000,
  interstitialAdPauseTime: 60_000,
  rewardedAdPauseTime: 60_000,
  frequentInterval: 1_000,
  maximumAllowedFrequentClicks: 3,
  dailyClickBlockThreshold: 10,
  adFreeUnlockTime: 5,
  fetchedActivated: false,
  setAll: () => {},
  setFetchedActivated: () => {},
  reset: () => {},
};

export const useAdConfigStore = create<AdConfigState>()(
  persist(
    (set) => ({
      ...DEFAULT_AD_CONFIG,
      setAll: (next) => set((state) => ({ ...state, ...next })),
      setFetchedActivated: (v) => set({ fetchedActivated: v }),
      reset: () => set(DEFAULT_AD_CONFIG),
    }),
    {
      name: "ads.config",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        bannerId: state.bannerId,
        interstitialId: state.interstitialId,
        rewardedId: state.rewardedId,
        appOpenId: state.appOpenId,
        nativeId: state.nativeId,
        appOpenAdPauseTime: state.appOpenAdPauseTime,
        interstitialAdPauseTime: state.interstitialAdPauseTime,
        rewardedAdPauseTime: state.rewardedAdPauseTime,
        frequentInterval: state.frequentInterval,
        maximumAllowedFrequentClicks: state.maximumAllowedFrequentClicks,
        dailyClickBlockThreshold: state.dailyClickBlockThreshold,
        adFreeUnlockTime: state.adFreeUnlockTime,
      }),
    },
  ),
);
